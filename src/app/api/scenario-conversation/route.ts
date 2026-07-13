import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getScenarioFirebaseToken, scenarioFirestoreBaseUrl } from '@/lib/scenarioFirestoreAdmin';

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const {
      userId, sessionId, day, targetLanguage, nativeLanguage,
      topicTitle, situationContext, scenarioTitle,
      conversationHistory, isFirstTurn,
    } = await req.json();

    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify subscription
    const token = await getScenarioFirebaseToken();
    const profileRes = await fetch(`${scenarioFirestoreBaseUrl()}/userProfiles/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!profileRes.ok) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const profileData = await profileRes.json();
    const isActive = profileData?.fields?.scenarioSubscriptionActive?.booleanValue === true;
    const expiryStr = profileData?.fields?.scenarioSubscriptionExpiry?.stringValue;
    const GRACE_MS = 24 * 60 * 60 * 1000;
    const notExpired = !expiryStr || (new Date(expiryStr).getTime() + GRACE_MS) > Date.now();
    if (!isActive || !notExpired) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 402 });
    }

    const systemPrompt = `You are a language tutor playing the role of a native ${targetLanguage} speaker in a realistic conversation scenario.

Scenario: ${scenarioTitle}
Topic today: ${topicTitle}
Context: ${situationContext}

Your role: Play the other person in this scenario (customer, colleague, official, etc.) — NOT the user.
The user is learning ${targetLanguage}. Their native language is ${nativeLanguage}.

Rules:
- Respond ONLY in ${targetLanguage} — every single word in "text" must be in ${targetLanguage}, with NO English words, phrases, or proper nouns left untranslated
- If you need a loanword, brand name, or foreign-origin term (e.g. "email", "hotel", "Wi-Fi"), spell it using ${targetLanguage}'s own orthography/spelling conventions, the way a native speaker would naturally write it, instead of the raw English spelling — this is critical because the text is read aloud by text-to-speech, and any English-spelled word breaks the ${targetLanguage} pronunciation mid-sentence
- Keep each response SHORT — 1-2 sentences maximum
- Be natural and realistic for the scenario
- Gently advance the conversation forward each turn
- Do NOT correct the user's grammar — just respond naturally as your character would
- Do NOT add commentary, greetings to the "teacher", or meta-comments

Respond in this EXACT JSON format (no markdown, no extra text):
{
  "text": "Your ${targetLanguage} response here",
  "phonetic": "Phonetic pronunciation guide using simple English sounds",
  "hint": "Translation in ${nativeLanguage}"
}`;

    const messages: { role: 'user' | 'assistant'; content: string }[] = [];

    if (isFirstTurn) {
      messages.push({
        role: 'user',
        content: 'Start the conversation. Open with a natural first line as your character in this scenario. Respond in JSON format only.',
      });
    } else {
      for (const turn of conversationHistory) {
        if (turn.role === 'ai') {
          messages.push({
            role: 'assistant',
            content: JSON.stringify({ text: turn.text, phonetic: turn.phonetic, hint: turn.hint }),
          });
        } else {
          messages.push({
            role: 'user',
            content: turn.recognizedText || turn.text || '[no response]',
          });
        }
      }
      messages.push({
        role: 'user',
        content: 'Continue the conversation naturally. Respond in JSON format only.',
      });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: systemPrompt,
      messages,
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

    let parsed;
    try {
      const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = { text: rawText.trim(), phonetic: '', hint: '' };
    }

    return NextResponse.json({
      text: parsed.text || '',
      phonetic: parsed.phonetic || '',
      hint: parsed.hint || '',
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

  } catch (error: any) {
    console.error('Scenario conversation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}