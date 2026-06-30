'use client';

const langNameToCode: Record<string, string> = {
  'German': 'de-DE', 'French': 'fr-FR', 'Italian': 'it-IT',
  'Spanish': 'es-ES', 'Portuguese': 'pt-PT', 'Dutch': 'nl-NL',
  'Greek': 'el-GR', 'Polish': 'pl-PL', 'Romanian': 'ro-RO',
  'Serbian': 'sr-RS', 'Russian': 'ru-RU', 'Finnish': 'fi-FI',
  'Korean': 'ko-KR', 'Japanese': 'ja-JP', 'Arabic': 'ar-SA',
  'Hebrew': 'he-IL', 'English': 'en-US', 'Turkish': 'tr-TR',
  'Hindi': 'hi-IN', 'Tamil': 'ta-IN', 'Chinese': 'zh-CN',
};

// Some Android WebViews (including the one used by our Capacitor app on
// certain devices/OEMs) do not implement the Web Speech API at all. Every
// access to `speechSynthesis`/`SpeechSynthesisUtterance` below is guarded
// so a missing API degrades silently instead of throwing a ReferenceError
// that crashes the entire page (no error boundary catches it currently).
function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

function getSavedVoiceName(langCode: string) {
  if (typeof window === 'undefined') return null;
  const perLang = localStorage.getItem(`tts_voice_${langCode}`);
  if (perLang && perLang !== 'default') return perLang;
  return null;
}

function getSavedRate(fallbackRate: number) {
  if (typeof window === 'undefined') return fallbackRate;
  const saved = parseFloat(localStorage.getItem('tts_rate') || '');
  return isNaN(saved) ? fallbackRate : saved;
}

function getBestVoice(lang: string) {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const savedVoiceName = getSavedVoiceName(lang);
  if (savedVoiceName) {
    const saved = voices.find(v => v.name === savedVoiceName);
    if (saved) return saved;
  }
  
  // Try to find an exact match for the language code
  let voice = voices.find(v => v.lang === lang && v.localService);
  if (voice) return voice;
  voice = voices.find(v => v.lang === lang);
  if (voice) return voice;

  // Try to find a match for the language only (e.g., 'en' for 'en-US')
  const shortLang = lang.split('-')[0];
  voice = voices.find(v => v.lang.startsWith(shortLang) && v.localService);
  if (voice) return voice;
  voice = voices.find(v => v.lang.startsWith(shortLang));
  if (voice) return voice;

  return voices.find(v => v.default) || voices[0] || null;
}

function safeCancelAndSpeak(utterance: SpeechSynthesisUtterance) {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
  }, 50);
}

export function playAudio(text: string, languageName: string, rate: number) {
  if (!isSpeechSynthesisSupported()) {
    console.warn('playAudio: Web Speech API is not supported in this environment, skipping playback.');
    return;
  }

  try {
    const langCode = langNameToCode[languageName] || 'en-US';
    const effectiveRate = rate !== undefined ? rate : getSavedRate(1);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = effectiveRate;
    utterance.pitch = 1;

    const voice = getBestVoice(langCode);
    if (voice) {
        utterance.voice = voice;
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    safeCancelAndSpeak(utterance);
  } catch (e) {
    console.warn('playAudio failed:', e);
  }
}