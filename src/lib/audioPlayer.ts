let isSpeaking = false;

export function playAudio(
  text: string,
  lang: string = "en-US",
  rate: number = 1
) {
  if (!text) return;

  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  utterance.pitch = 1;

  utterance.onstart = () => (isSpeaking = true);
  utterance.onend = () => (isSpeaking = false);
  utterance.onerror = () => (isSpeaking = false);

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
