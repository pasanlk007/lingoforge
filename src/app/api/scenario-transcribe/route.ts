import { NextResponse } from 'next/server';

// Isolated route. Used only by Scenario Mode's conversation screen.
// Requires OPENAI_API_KEY env var (Whisper API) — separate from ANTHROPIC_API_KEY.

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured on server' },
        { status: 500 }
      );
    }

    const whisperForm = new FormData();
    whisperForm.append('file', audioFile, 'recording.webm');
    whisperForm.append('model', 'whisper-1');

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: whisperForm,
    });

    if (!whisperRes.ok) {
      const errText = await whisperRes.text();
      console.error('Whisper API error:', errText);
      return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
    }

    const data = await whisperRes.json();
    return NextResponse.json({ text: data.text || '' });
  } catch (error) {
    console.error('Scenario transcribe error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
