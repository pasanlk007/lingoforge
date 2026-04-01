import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: Buffer.from(process.env.FIREBASE_PRIVATE_KEY!, 'base64').toString('utf8'),
      }),
    });
  }
  return getFirestore();
}

export async function POST(req: Request) {
  try {
    const { language, nativeLanguage, week, day, topic } = await req.json();

    const cacheKey = `pro_${language}_${nativeLanguage}_w${week}_d${day}`;
    
    // Check Firestore cache
    const db = getAdminDb();
    const cacheRef = db.collection('proLessons').doc(cacheKey);
    const cached = await cacheRef.get();
    
    if (cached.exists) {
      return NextResponse.json(cached.data());
    }

    // Generate with Claude AI
    const prompt = `Generate a professional language lesson for migrant workers.

Target Language: ${language}
Native Language: ${nativeLanguage}
Week: ${week}, Day: ${day}
Topic: ${topic}

Return ONLY valid JSON (no markdown):
{
  "title": "lesson title in ${nativeLanguage}",
  "topic": "${topic}",
  "vocabulary": [
    {
      "target": "word in ${language}",
      "native": "meaning in ${nativeLanguage}",
      "phonetic": "pronunciation",
      "example": "example sentence in ${language}",
      "example_native": "example in ${nativeLanguage}"
    }
  ],
  "phrases": [
    {
      "target": "useful phrase in ${language}",
      "native": "meaning in ${nativeLanguage}",
      "situation": "when to use"
    }
  ],
  "cultural_tip": "important cultural note in ${nativeLanguage}",
  "grammar_note": "simple grammar tip in ${nativeLanguage}"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content[0].text;
    const clean = text.replace(/```json|```/g, '').trim();
    const lesson = JSON.parse(clean);

    // Cache in Firestore
    await cacheRef.set({
      ...lesson,
      language,
      nativeLanguage,
      week,
      day,
      cachedAt: new Date().toISOString(),
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Pro lesson error:', error);
    return NextResponse.json({ error: 'Failed to generate lesson' }, { status: 500 });
  }
}
