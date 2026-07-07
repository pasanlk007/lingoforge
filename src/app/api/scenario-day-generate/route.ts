import { NextResponse } from 'next/server';
import { getScenarioFirebaseToken, scenarioFirestoreBaseUrl } from '@/lib/scenarioFirestoreAdmin';

// Generates full content (vocab + dialogue + prompts) for ONE day, on-demand,
// when the user actually taps into that day. Small output, fast, and avoids
// ever generating content for days the user never reaches.
// Writes to scenarioSessions/{sessionId}/days/{day} (isolated subcollection).

function buildDayPrompt(
  scenarioTitle: string,
  scenarioSummary: string,
  topicTitle: string,
  situationContext: string,
  targetLanguage: string,
  nativeLanguage: string,
  day: number,
  totalDays: number
) {
  return `You are generating ONE day's conversation practice content for a language learner.

Overall scenario: "${scenarioTitle}" — ${scenarioSummary}
This is day ${day} of ${totalDays}.
Today's topic: "${topicTitle}"
Today's situation: "${situationContext}"

- Target Language: ${targetLanguage}
- Native Language: ${nativeLanguage}

Return ONLY a single, raw, valid JSON object (no markdown fences, no extra text) with this exact structure:
{
  "target_vocab": [
    { "id": "string", "target": "word/phrase in ${targetLanguage}", "phonetic": "simple phonetic spelling readable by a ${nativeLanguage} speaker", "native_meaning": "meaning in ${nativeLanguage}", "english": "English meaning" }
  ],
  "sample_dialogue": [
    { "id": "string", "context": "string (${nativeLanguage})", "lines": [ { "speaker": "A", "target": "string", "native": "string (${nativeLanguage})", "phonetic": "string" }, { "speaker": "B", "target": "string", "native": "string (${nativeLanguage})", "phonetic": "string" } ] }
  ],
  "conversation_prompts": ["string", "string", "string"]
}

Rules:
- 5-7 target_vocab items, directly relevant to today's situation.
- 1-2 short sample_dialogue entries.
- 3-5 conversation_prompts that an AI voice partner could use to start/continue today's practice conversation.
- All native-language fields must be in ${nativeLanguage}. Phonetic spellings must be simple and easy for a ${nativeLanguage} speaker to read aloud.
- Properly escape all JSON strings: backslashes as \\\\, double quotes as \\", and control characters (newlines as \\n, etc).`;
}

export async function POST(req: Request) {
  try {
    const { userId, sessionId, day, scenarioTitle, scenarioSummary, topicTitle, situationContext, targetLanguage, nativeLanguage, totalDays } = await req.json();

    if (!userId || !sessionId || !day || !topicTitle || !targetLanguage || !nativeLanguage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const token = await getScenarioFirebaseToken();
    const dayDocUrl = `${scenarioFirestoreBaseUrl()}/scenarioSessions/${sessionId}/days/${day}`;

    // Check cache first — don't regenerate a day that's already been created.
    // This is allowed even without an active subscription, since it's free
    // (no new AI call) and lets users re-read days they already paid to generate.
    const cacheRes = await fetch(dayDocUrl, { headers: { 'Authorization': `Bearer ${token}` } });
    if (cacheRes.ok) {
      const cached = await cacheRes.json();
      if (cached.fields?.content?.stringValue) {
        return NextResponse.json({ day, content: JSON.parse(cached.fields.content.stringValue) });
      }
    }

    // Gate the actual AI-cost-incurring generation behind an active subscription.
    const profileUrl = `${scenarioFirestoreBaseUrl()}/userProfiles/${userId}`;
    const profileRes = await fetch(profileUrl, { headers: { 'Authorization': `Bearer ${token}` } });
    const profileData = profileRes.ok ? await profileRes.json() : null;
    const isActive = profileData?.fields?.scenarioSubscriptionActive?.booleanValue === true;
    const expiryStr = profileData?.fields?.scenarioSubscriptionExpiry?.stringValue;
    const GRACE_MS = 24 * 60 * 60 * 1000;
    const notExpired = !expiryStr || (new Date(expiryStr).getTime() + GRACE_MS) > Date.now();

    if (!isActive || !notExpired) {
      return NextResponse.json({ error: 'Subscription required', code: 'SUBSCRIPTION_REQUIRED' }, { status: 402 });
    }

    const prompt = buildDayPrompt(
      scenarioTitle || '', scenarioSummary || '', topicTitle, situationContext || '',
      targetLanguage, nativeLanguage, day, totalDays || 7
    );

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 2048, messages: [{ role: 'user', content: prompt }] }),
    });

    const aiData = await aiRes.json();
    const text = aiData?.content?.[0]?.text;
    if (!text) {
      throw new Error('No text returned from AI');
    }

    let content;
    try {
      content = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (parseErr) {
      console.error('Scenario day JSON parse failed:', text);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Cache the generated day content
    await fetch(dayDocUrl, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          day: { integerValue: day },
          content: { stringValue: JSON.stringify(content) },
          generatedAt: { timestampValue: new Date().toISOString() },
        },
      }),
    });

    return NextResponse.json({ day, content });
  } catch (error) {
    console.error('Scenario day generate error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
