'use client';

// Cross-platform text-to-speech abstraction.
//
// Web: uses the browser's Web Speech API (speechSynthesis), same as before.
// Android (Capacitor native): uses @capacitor-community/text-to-speech,
// which calls the device's actual native TTS engine — this is reliable,
// unlike the WebView's speechSynthesis implementation, which is missing or
// broken on many Android devices/OEMs (the root cause of the earlier
// "Audio issue" reported on the Android app).
//
// Call sites should use AudioService.play(...) instead of calling
// speechSynthesis or the native plugin directly, so platform differences
// stay isolated to this one file.

import {
  isSpeechSynthesisSupported,
  getBestVoice,
  langNameToCode,
  getSavedRate,
} from './audioPlayer';

let nativeTtsModule: typeof import('@capacitor-community/text-to-speech') | null = null;
let capacitorCoreModule: typeof import('@capacitor/core') | null = null;

async function isNativePlatform(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!capacitorCoreModule) {
    capacitorCoreModule = await import('@capacitor/core');
  }
  return capacitorCoreModule.Capacitor.isNativePlatform();
}

async function playNative(text: string, langCode: string, rate: number) {
  if (!nativeTtsModule) {
    nativeTtsModule = await import('@capacitor-community/text-to-speech');
  }
  const { TextToSpeech } = nativeTtsModule;

  try {
    await TextToSpeech.stop();
  } catch {
    // stop() can reject if nothing is currently speaking — safe to ignore.
  }

  await TextToSpeech.speak({
    text,
    lang: langCode,
    rate: rate || 1,
    pitch: 1,
    volume: 1,
    category: 'ambient',
  });
}

function playWeb(text: string, langCode: string, rate: number) {
  if (!isSpeechSynthesisSupported()) {
    console.warn('AudioService: Web Speech API not supported, skipping playback.');
    return;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = rate;
    utterance.pitch = 1;

    const voice = getBestVoice(langCode);
    if (voice) {
      utterance.voice = voice;
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    window.speechSynthesis.cancel();
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50);
  } catch (e) {
    console.warn('AudioService: web playback failed:', e);
  }
}

export const AudioService = {
  /**
   * Speaks the given text aloud, using the native device TTS engine on
   * Android/iOS (Capacitor) and the browser's Web Speech API on web.
   * Matches the original playAudio(text, languageName, rate) signature.
   */
  async play(text: string, languageName: string, rate?: number) {
    // Callers pass languageName in mixed casing depending on the source
    // (some come straight from a lowercased URL route param, e.g.
    // "romanian", while others pass the display name, e.g. "Romanian").
    // langNameToCode's keys are capitalized, so do a case-insensitive
    // lookup here instead of requiring every call site to normalize —
    // a mismatch here used to silently fall back to en-US.
    const matchedKey = Object.keys(langNameToCode).find(
      (key) => key.toLowerCase() === languageName.toLowerCase()
    );
    const langCode = (matchedKey && langNameToCode[matchedKey]) || 'en-US';
    const effectiveRate = rate !== undefined ? rate : getSavedRate(1);

    try {
      if (await isNativePlatform()) {
        await playNative(text, langCode, effectiveRate);
      } else {
        playWeb(text, langCode, effectiveRate);
      }
    } catch (e) {
      console.warn('AudioService.play failed:', e);
    }
  },

  async stop() {
    try {
      if (await isNativePlatform()) {
        if (!nativeTtsModule) {
          nativeTtsModule = await import('@capacitor-community/text-to-speech');
        }
        await nativeTtsModule.TextToSpeech.stop();
      } else if (isSpeechSynthesisSupported()) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {
      console.warn('AudioService.stop failed:', e);
    }
  },
};
