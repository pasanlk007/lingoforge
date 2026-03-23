'use client';

// A mapping from full language names to their primary language codes
const langNameToCode: { [key: string]: string } = {
    "German": "de-DE",
    "French": "fr-FR",
    "Italian": "it-IT",
    "Spanish": "es-ES",
    "Portuguese": "pt-PT",
    "Dutch": "nl-NL",
    "Greek": "el-GR",
    "Polish": "pl-PL",
    "Romanian": "ro-RO",
    "Serbian": "sr-RS",
    "Russian": "ru-RU",
    "Finnish": "fi-FI",
    "Korean": "ko-KR",
    "Japanese": "ja-JP",
    "Arabic": "ar-SA",
    "Hebrew": "he-IL",
    "English": "en-US",
    "Turkish": "tr-TR",
    "Hindi": "hi-IN",
    "Tamil": "ta-IN",
    "Chinese": "zh-CN",
};

let isSpeaking = false;

/**
 * Finds the best available voice for a given language code.
 * Prioritizes a user-saved voice, then the exact language code,
 * then a generic match for the language.
 * @param lang The BCP 47 language code (e.g., "fr-FR").
 * @returns The best available SpeechSynthesisVoice object or null.
 */
function getBestVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;

  const savedVoiceName = localStorage.getItem("tts_voice");

  // 1. Try to find the user's saved voice preference
  if (savedVoiceName) {
    const savedVoice = voices.find(v => v.name === savedVoiceName);
    if (savedVoice) return savedVoice;
  }

  // 2. Find a voice that exactly matches the language code (e.g., "fr-FR")
  let voice = voices.find(v => v.lang === lang);
  if (voice) return voice;

  // 3. Fallback: Find a voice that matches the generic language (e.g., "fr")
  const shortLang = lang.split("-")[0];
  voice = voices.find(v => v.lang.startsWith(shortLang));
  if (voice) return voice;

  // 4. If all else fails, return the first available voice as a last resort
  return voices[0] || null;
}

/**
 * Plays the given text using the Web Speech API.
 * @param text The text to be spoken.
 * @param languageName The full name of the language (e.g., "French").
 * @param rate The speed of the speech (e.g., 1 for normal, 0.7 for slow).
 */
export function playAudio(text: string, languageName: string, rate = 1) {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;

  // Cancel any currently playing speech to avoid overlap
  if (isSpeaking) {
    speechSynthesis.cancel();
    isSpeaking = false;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const langCode = langNameToCode[languageName] || "en-US";
  utterance.lang = langCode;
  utterance.rate = rate;
  utterance.pitch = 1;

  const voice = getBestVoice(langCode);
  if (voice) {
    utterance.voice = voice;
  }

  utterance.onstart = () => { isSpeaking = true; };
  utterance.onend = () => { isSpeaking = false; };
  utterance.onerror = () => { isSpeaking = false; };

  speechSynthesis.speak(utterance);
}
