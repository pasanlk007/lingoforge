'use client';

const langNameToCode = {
  'German': 'de-DE', 'French': 'fr-FR', 'Italian': 'it-IT',
  'Spanish': 'es-ES', 'Portuguese': 'pt-PT', 'Dutch': 'nl-NL',
  'Greek': 'el-GR', 'Polish': 'pl-PL', 'Romanian': 'ro-RO',
  'Serbian': 'sr-RS', 'Russian': 'ru-RU', 'Finnish': 'fi-FI',
  'Korean': 'ko-KR', 'Japanese': 'ja-JP', 'Arabic': 'ar-SA',
  'Hebrew': 'he-IL', 'English': 'en-US', 'Turkish': 'tr-TR',
  'Hindi': 'hi-IN', 'Tamil': 'ta-IN', 'Chinese': 'zh-CN',
};

function getSavedVoiceName(langCode) {
  const perLang = localStorage.getItem(`tts_voice_${langCode}`);
  if (perLang) return perLang;
  return localStorage.getItem('tts_voice');
}

function getSavedRate(fallbackRate) {
  const saved = parseFloat(localStorage.getItem('tts_rate') || '');
  return isNaN(saved) ? fallbackRate : saved;
}

function getBestVoice(lang) {
  const voices = speechSynthesis.getVoices();
  const savedVoiceName = getSavedVoiceName(lang);
  if (savedVoiceName) {
    const saved = voices.find(v => v.name === savedVoiceName);
    if (saved) return saved;
  }
  let voice = voices.find(v => v.lang === lang);
  if (voice) return voice;
  const shortLang = lang.split('-')[0];
  voice = voices.find(v => v.lang.startsWith(shortLang));
  if (voice) return voice;
  return voices[0] || null;
}

function safeCancelAndSpeak(utterance) {
  // Always cancel first
  speechSynthesis.cancel();
  // Small delay lets the browser fully reset before speaking
  setTimeout(() => {
    speechSynthesis.speak(utterance);
  }, 50);
}

export function playAudio(text, languageName, rate) {

  const langCode = langNameToCode[languageName] || 'en-US';
  const effectiveRate = rate !== undefined ? rate : getSavedRate(1);

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  utterance.rate = effectiveRate;
  utterance.pitch = 1;

  const voice = getBestVoice(langCode);
  if (voice) utterance.voice = voice;

  // Chrome bug fix: speechSynthesis can get stuck — resume before speaking
  if (speechSynthesis.paused) speechSynthesis.resume();

  safeCancelAndSpeak(utterance);
}
