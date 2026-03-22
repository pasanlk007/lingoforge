export async function playAudio(text: string) {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();

    if (!data.audioUrl) {
      throw new Error("No audio returned");
    }

    const audio = new Audio(data.audioUrl);
    await audio.play();

  } catch (err) {
    console.error("TTS ERROR:", err);
  }
}
