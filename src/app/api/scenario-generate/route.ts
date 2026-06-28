import { NextResponse } from 'next/server';

// Isolated from /api/pro-lesson. Writes only to the new `scenarioSessions`
// collection. Does not read or write userProfiles, userProgress, or proLessons.

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

function buildPrompt(userInputRaw: string, targetLanguage: string, nativeLanguage: string, totalDays: number) {
  return `You are generating a personalized daily-conversation plan for a language learner preparing for a real, specific life situation.

User's situation (raw, may mix Sinhala/English): "${userInputRaw}"

- Target Language: ${targetLanguage}
- Native Language: ${nativeLanguage}

Infer the user's specific real-world goal from their situation (e.g. job interview, workplace communication, embassy interview, daily survival in a new role) and design a ${totalDays}-day conversation plan that builds toward handling that situation confidently.

Each day must escalate slightly in complexity. Day 1 should be the most basic, most essential vocabulary/phrases for the situation. The final day should closely simulate the real interaction the user described.

Return ONLY a single, raw, valid JSON object (no markdown fences, no extra text) with this exact structure:
{
  "scenario_title": "string (in English, short)",
  "scenario_title_native": "string (in ${nativeLanguage})",
  "scenario_summary": "string (in ${nativeLanguage}, 1-2 sentences restating the user's goal)",
  "targetLanguage": "${targetLanguage}",
  "nativeLanguage": "${nativeLanguage}",
  "total_days": ${totalDays},
  "daily_topics": [
    {
      "day": 1,
      "topic_title": "string (English)",
      "topic_title_native": "string (${nativeLanguage})",
      "situation_context": "string (${nativeLanguage}, describes the moment in the day's scenario)",
      "target_vocab": [
        { "id": "string", "target": "word/phrase in ${targetLanguage}", "phonetic": "simple phonetic spelling readable by a ${nativeLanguage} speaker", "native_meaning": "meaning in ${nativeLanguage}", "english": "English meaning" }
      ],
      "sample_dialogue": [
        { "id": "string", "context": "string (${nativeLanguage})", "lines": [ { "speaker": "A", "target": "string", "native": "string (${nativeLanguage})", "phonetic": "string" }, { "speaker": "B", "target": "string", "native": "string (${nativeLanguage})", "phonetic": "string" } ] }
      ],
      "conversation_prompts": ["string", "string", "string"]
    }
  ]
}

Rules:
- 5-8 target_vocab items per day, directly relevant to that day's situation.
- 1-2 sample_dialogue entries per day.
- 3-5 conversation_prompts per day, escalating slightly in difficulty across the week.
- Produce all ${totalDays} days in "daily_topics", fully filled in (no placeholders).
- All native-language fields must be in ${nativeLanguage}. Phonetic spellings must be simple and easy for a ${nativeLanguage} speaker to read aloud.
- Properly escape all JSON strings: backslashes as \\\\, double quotes as \\", and control characters (newlines as \\n, etc).`;
}

export async function POST(req: Request) {
  try {
    const { userId, sessionId, userInputRaw, targetLanguage, nativeLanguage, totalDays } = await req.json();

    if (!userId || !sessionId || !userInputRaw || !targetLanguage || !nativeLanguage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const days = totalDays === 14 ? 14 : 7;
    const projectId = process.env.FIREBASE_PROJECT_ID!;
    const token = await getFirebaseToken();
    const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/scenarioSessions/${sessionId}`;

    // Mark session as generating (isolated collection, doesn't touch userProfiles)
    await fetch(docUrl, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          userId: { stringValue: userId },
          userInputRaw: { stringValue: userInputRaw },
          targetLanguage: { stringValue: targetLanguage },
          nativeLanguage: { stringValue: nativeLanguage },
          status: { stringValue: 'generating' },
          currentDay: { integerValue: 1 },
          createdAt: { timestampValue: new Date().toISOString() },
          updatedAt: { timestampValue: new Date().toISOString() },
        },
      }),
    });

    // Generate with Claude Sonnet
    const prompt = buildPrompt(userInputRaw, targetLanguage, nativeLanguage, days);
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 8000, messages: [{ role: 'user', content: prompt }] }),
    });

    const aiData = await aiRes.json();
    const text = aiData?.content?.[0]?.text;
    if (!text) {
      throw new Error('No text returned from AI');
    }

    let plan;
    try {
      plan = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (parseErr) {
      console.error('Scenario plan JSON parse failed:', text);
      await fetch(docUrl, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { status: { stringValue: 'error' } } }),
      });
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Save full plan + mark active
    await fetch(`${docUrl}?updateMask.fieldPaths=plan&updateMask.fieldPaths=status&updateMask.fieldPaths=updatedAt`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          plan: { stringValue: JSON.stringify(plan) },
          status: { stringValue: 'active' },
          updatedAt: { timestampValue: new Date().toISOString() },
        },
      }),
    });

    return NextResponse.json({ sessionId, plan });
  } catch (error) {
    console.error('Scenario generate error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
