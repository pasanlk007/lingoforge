
import { NextResponse } from 'next/server';

// Ensure you have the Anthropic API key in your .env.local file
// ANTHROPIC_API_KEY=your_api_key

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export async function POST(req: Request) {
  try {
    const { topic, day, nativeLanguage, targetLanguage } = await req.json();

    if (!topic || !day || !nativeLanguage || !targetLanguage) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key is not configured.' }, { status: 500 });
    }

    const systemPrompt = `You are an expert language learning assistant. Your task is to generate a JSON object containing exactly 3 multiple-choice questions. The entire response must be a single, valid JSON object and nothing else.

The required JSON structure is:
{
  "questions": [
    {
      "question": "string (in the specified native language)",
      "options": ["string", "string", "string", "string"],
      "correct": "number (0-based index of the correct option)",
      "explanation": "string (a brief explanation in the native language)"
    }
  ]
}`;

    const userPrompt = `Generate a quiz with 3 multiple-choice questions for a language learner.

Parameters:
- Topic: "${topic}"
- Day: ${day}
- Native Language: ${nativeLanguage}
- Target Language: ${targetLanguage}

Instructions:
1. The questions, options, and explanations must all be in ${nativeLanguage}.
2. The questions should test the user's knowledge of ${targetLanguage} vocabulary or grammar related to the topic.
3. The "correct" field must be the 0-based index of the correct option.
4. Ensure the JSON output is valid and strictly follows the required structure.`;

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', // Using Haiku as requested (mapping to latest version)
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        max_tokens: 1024,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Anthropic API error:', errorBody);
      return NextResponse.json({ error: `Anthropic API responded with status ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Invalid response structure from Anthropic API');
    }

    // The response is a JSON string, so we need to parse it.
    const quizJson = JSON.parse(data.content[0].text);

    return NextResponse.json(quizJson);

  } catch (error) {
    console.error('Error in /api/ai-quiz:', error);
    let message = 'An unknown error occurred.';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ error: 'Failed to generate quiz', details: message }, { status: 500 });
  }
}
