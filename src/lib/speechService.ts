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
  // Request microphone via @capacitor/core Permissions API (Option A)
  // Works correctly on MIUI and other Android skins
  try {
    const { Permissions } = await import('@capacitor/core');
    const status = await (Permissions as any).request({ name: 'microphone' });
    console.log('[STT] Permission status:', JSON.stringify(status));
    if (status?.microphone === 'denied') {
      throw new Error('PERMISSION_DENIED');
    }
  } catch (permErr: any) {
    if (permErr.message === 'PERMISSION_DENIED') throw new Error('Microphone permission denied');
    console.warn('[STT] Permissions API unavailable, proceeding:', permErr.message);
  }

  const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
  const result = await SpeechRecognition.start({
    language: lang,
    maxResults: 1,
    prompt: 'Speak now...',
    partialResults: false,
    popup: false,
  });
  if (result?.matches && result.matches.length > 0) return result.matches[0];
  // Recognizer ran fine but caught no speech (silence, too quiet, spoke too
  // late) — distinct from a permission or plugin failure, so the caller can
  // show an honest "didn't catch that" message instead of a permissions error.
  throw new Error('NO_SPEECH_DETECTED');
}

export async function stopNativeSpeech(): Promise<void> {
  try {
    const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
    await SpeechRecognition.stop();
  } catch { }
}
