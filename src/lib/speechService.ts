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

    // Request RECORD_AUDIO at runtime via getUserMedia first.
    // SpeechRecognition.requestPermission() is not implemented on this plugin
    // version, so getUserMedia triggers the Android OS permission dialog instead.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      console.log('[STT] RECORD_AUDIO granted via getUserMedia');
    } catch (permErr) {
      console.warn('[STT] Permission failed:', permErr);
      throw new Error('Microphone permission denied');
    }

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
    console.error('[STT] failed:', e);
    throw e;
  }
}

export async function stopNativeSpeech(): Promise<void> {
  try {
    const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
    await SpeechRecognition.stop();
  } catch { }
}
