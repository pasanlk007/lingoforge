import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text;

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    return NextResponse.json({
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    });

  } catch (error) {
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
