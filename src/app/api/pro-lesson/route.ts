
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
        const lesson: any = {};
        for (const [key, value] of Object.entries(cached.fields as Record<string, any>)) {
          if ((key === 'vocabulary' || key === 'phrases') && value.stringValue) {
            try {
              lesson[key] = JSON.parse(value.stringValue);
            } catch (e) {
              console.error(`Failed to parse cached JSON for ${key}:`, value.stringValue);
              lesson[key] = [];
            }
          } else {
            lesson[key] = value.stringValue;
          }
        }
        return NextResponse.json(lesson);
      }
    }

    // Generate with Claude
    const prompt = `Generate a professional language lesson for migrant workers, focusing on practical application.
Target Language: ${language}
Native Language: ${nativeLanguage}
Week: ${week}, Day: ${day}
Topic: "${topic}"

Key areas to incorporate, with cultural tips related to them:
- Legal terms (නීතිය)
- Historical context (ඉතිහාසය)
- Judicial processes (අධිකරන)

CRITICAL — this content is read aloud by text-to-speech, so every word inside "target" and "example" fields must be entirely in ${language}, with NO untranslated English words, legal/technical terms, or proper nouns left in raw English spelling. If a term is a loanword or has no native equivalent, spell it using ${language}'s own orthography/spelling conventions the way a native speaker would naturally write and pronounce it — do not mix raw English spelling into ${language} text, since a single unconverted word breaks the pronunciation mid-sentence for the learner.

Return ONLY a valid JSON object with the following structure:
{
  "title": "A concise lesson title in ${nativeLanguage}",
  "topic": "${topic}",
  "vocabulary": [{"target": "word or short phrase in ${language}", "native": "meaning in ${nativeLanguage}", "phonetic": "simple pronunciation guide", "example": "example sentence in ${language}", "example_native": "translation of the example in ${nativeLanguage}"}],
  "phrases": [{"target": "practical phrase in ${language}", "native": "meaning in ${nativeLanguage}", "situation": "Describe a specific situation to use this phrase (e.g., 'When talking to a lawyer', 'At a government office')"}],
  "cultural_tip": "A crucial cultural tip related to law, history, or bureaucracy in the target country, provided in ${nativeLanguage}.",
  "grammar_note": "A practical grammar tip directly useful for this lesson's topic (e.g., how to form questions, useful verb patterns, or sentence structures). Avoid gender/declension theory. Keep it actionable and simple, provided in ${nativeLanguage}."
}`;

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 4096, messages: [{ role: 'user', content: prompt }] }),
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
