import { NextResponse } from 'next/server';

function createJWT(): string {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim();
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: clientEmail, sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore',
  })).toString('base64url');
  const signingInput = `${header}.${payload}`;
  const sign = require('crypto').createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = sign.sign(privateKey, 'base64url');
  return `${signingInput}.${signature}`;
}

async function getFirebaseToken(): Promise<string> {
  const jwt = createJWT();
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const data = await res.json();
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const { language, nativeLanguage, week, day, topic } = await req.json();
    const cacheKey = `pro_${language}_${nativeLanguage}_w${week}_d${day}`;
    const projectId = process.env.FIREBASE_PROJECT_ID!;
    const token = await getFirebaseToken();
    
    // Check cache
    const cacheUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/proLessons/${cacheKey}`;
    const cacheRes = await fetch(cacheUrl, { headers: { 'Authorization': `Bearer ${token}` } });
    
    if (cacheRes.ok) {
      const cached = await cacheRes.json();
      if (cached.fields) {
        const lesson = Object.fromEntries(Object.entries(cached.fields).map(([k, v]: [string, any]) => [k, v.stringValue || v.arrayValue?.values?.map((x: any) => JSON.parse(x.stringValue)) || v]));
        return NextResponse.json(lesson);
      }
    }

    // Generate with Claude
    const prompt = `Generate a professional language lesson for migrant workers.
Target Language: ${language}
Native Language: ${nativeLanguage}  
Week: ${week}, Day: ${day}, Topic: ${topic}

Return ONLY valid JSON:
{
  "title": "lesson title in ${nativeLanguage}",
  "topic": "${topic}",
  "vocabulary": [{"target": "word", "native": "meaning", "phonetic": "pronunciation", "example": "sentence", "example_native": "translation"}],
  "phrases": [{"target": "phrase", "native": "meaning", "situation": "when to use"}],
  "cultural_tip": "cultural note in ${nativeLanguage}",
  "grammar_note": "grammar tip in ${nativeLanguage}"
}`;

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
    });

    const aiData = await aiRes.json();
    const text = aiData.content[0].text;
    const lesson = JSON.parse(text.replace(/```json|```/g, '').trim());

    // Save to cache
    const fields: any = {
      title: { stringValue: lesson.title },
      topic: { stringValue: lesson.topic },
      cultural_tip: { stringValue: lesson.cultural_tip || '' },
      grammar_note: { stringValue: lesson.grammar_note || '' },
      vocabulary: { stringValue: JSON.stringify(lesson.vocabulary) },
      phrases: { stringValue: JSON.stringify(lesson.phrases) },
    };

    await fetch(`${cacheUrl}?updateMask.fieldPaths=title&updateMask.fieldPaths=topic&updateMask.fieldPaths=cultural_tip&updateMask.fieldPaths=grammar_note&updateMask.fieldPaths=vocabulary&updateMask.fieldPaths=phrases`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });

    // Parse cached arrays back
    lesson.vocabulary = typeof lesson.vocabulary === 'string' ? JSON.parse(lesson.vocabulary) : lesson.vocabulary;
    lesson.phrases = typeof lesson.phrases === 'string' ? JSON.parse(lesson.phrases) : lesson.phrases;

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Pro lesson error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
