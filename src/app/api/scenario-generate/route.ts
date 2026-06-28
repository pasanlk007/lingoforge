import { NextResponse } from 'next/server';
import { getScenarioFirebaseToken, scenarioFirestoreBaseUrl } from '@/lib/scenarioFirestoreAdmin';

// Generates only the lightweight scenario MAP — day titles + situation context.
// Full per-day content (vocab/dialogue/prompts) is generated on-demand by
// /api/scenario-day-generate when the user actually taps into a day. This
// keeps this route's output small and fast, well within platform timeouts
// even for 14-day plans.

function buildMapPrompt(userInputRaw: string, targetLanguage: string, nativeLanguage: string, totalDays: number) {
  return `You are designing a personalized daily-conversation outline for a language learner preparing for a real, specific life situation.

User's situation (raw, may mix Sinhala/English): "${userInputRaw}"

- Target Language: ${targetLanguage}
- Native Language: ${nativeLanguage}

Infer the user's specific real-world goal (e.g. job interview, workplace communication, embassy interview, daily survival in a new role) and design a ${totalDays}-day topic outline that builds toward handling that situation confidently. Each day should escalate slightly in complexity, with the final day closely simulating the real interaction described.

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
      "situation_context": "string (${nativeLanguage}, 1 sentence describing the moment in the day's scenario)"
    }
  ]
}

Rules:
- Produce all ${totalDays} day entries in "daily_topics" — titles and context only, no vocabulary or dialogue (that comes later, per-day).
- Keep every field short and concrete.
- All native-language fields must be in ${nativeLanguage}.
- Properly escape all JSON strings: backslashes as \\\\, double quotes as \\", and control characters (newlines as \\n, etc).`;
}

export async function POST(req: Request) {
  try {
    const { userId, sessionId, userInputRaw, targetLanguage, nativeLanguage, totalDays } = await req.json();

    if (!userId || !sessionId || !userInputRaw || !targetLanguage || !nativeLanguage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const days = totalDays === 14 ? 14 : 7;
    const token = await getScenarioFirebaseToken();
    const docUrl = `${scenarioFirestoreBaseUrl()}/scenarioSessions/${sessionId}`;

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

    // Generate the lightweight map with Claude Sonnet — small output, fast.
    const prompt = buildMapPrompt(userInputRaw, targetLanguage, nativeLanguage, days);
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

    let plan;
    try {
      plan = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (parseErr) {
      console.error('Scenario map JSON parse failed:', text);
      await fetch(docUrl, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { status: { stringValue: 'error' } } }),
      });
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Save the map + mark active
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
