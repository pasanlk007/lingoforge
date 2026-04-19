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

function getSavedVoiceName(langCode: string) {
  const perLang = localStorage.getItem(`tts_voice_${langCode}`);
  if (perLang && perLang !== 'default') return perLang;
  return null;
}

function getSavedRate(fallbackRate: number) {
  const saved = parseFloat(localStorage.getItem('tts_rate') || '');
  return isNaN(saved) ? fallbackRate : saved;
}

function getBestVoice(lang: string) {
  const voices = speechSynthesis.getVoices();
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
  speechSynthesis.cancel();
  setTimeout(() => {
    speechSynthesis.speak(utterance);
  }, 50);
}

export function playAudio(text: string, languageName: string, rate: number) {

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

  if (speechSynthesis.paused) {
    speechSynthesis.resume();
  }

  safeCancelAndSpeak(utterance);
}