let isSpeaking = false;

function getBestVoice(lang) {
  const voices = speechSynthesis.getVoices();

  if (!voices.length) return null;

  let voice = voices.find(v => v.lang === lang);

  if (!voice) {
    const short = lang.split("-")[0];
    voice = voices.find(v => v.lang.startsWith(short));
  }

  if (!voice) {
    voice = voices[0];
  }

  return voice || null;
}

export function playAudio(text, lang = "en-US", rate = 1) {
  if (!text) return;

  if (isSpeaking) {
    speechSynthesis.cancel();
    isSpeaking = false;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  utterance.pitch = 1;

  const voice = getBestVoice(lang);
  if (voice) {
    utterance.voice = voice;
  }

  utterance.onstart = () => (isSpeaking = true);
  utterance.onend = () => (isSpeaking = false);
  utterance.onerror = () => (isSpeaking = false);

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}
