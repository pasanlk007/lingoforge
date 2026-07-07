'use client';

export async function isNativePlatform(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function nativeSpeechRecognize(lang: string): Promise<string | null> {
  try {
    const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
    const { speechRecognition } = await SpeechRecognition.requestPermission();
    if (speechRecognition !== 'granted') throw new Error('Permission denied');
    const result = await SpeechRecognition.start({
      language: lang,
      maxResults: 1,
      prompt: 'Speak now...',
      partialResults: false,
      popup: false,
    });
    if (result?.matches && result.matches.length > 0) return result.matches[0];
    return null;
  } catch (e) {
    console.error('Native speech recognition failed:', e);
    throw e;
  }
}

export async function stopNativeSpeech(): Promise<void> {
  try {
    const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
    await SpeechRecognition.stop();
  } catch { }
}