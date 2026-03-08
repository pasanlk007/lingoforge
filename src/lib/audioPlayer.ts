"use client";

import { TARGET_LANGUAGES } from './constants';

/**
 * A utility class to handle text-to-speech using the Web Speech API.
 * This class is designed to be used on the client-side only.
 */
class AudioPlayer {
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = this.loadVoices;
      }
    } else {
      console.warn("Web Speech API is not supported in this browser.");
    }
  }

  private loadVoices = () => {
    if (this.synthesis) {
      this.voices = this.synthesis.getVoices();
    }
  };

  /**
   * Speaks a given text in a specified language.
   * @param text The text to be spoken.
   * @param languageName The name of the target language (e.g., "French").
   * @param rate The speed of the speech. Defaults to 1.0 (normal).
   */
  public speak(text: string, languageName: string, rate: number = 1.0): void {
    if (!this.synthesis) {
      alert("Sorry, your browser does not support text-to-speech.");
      return;
    }

    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }

    if (text !== "") {
      const languageInfo = TARGET_LANGUAGES.find(lang => lang.name === languageName);
      if (!languageInfo) {
        console.error(`Language code not found for ${languageName}`);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.onend = () => {
        // console.log("SpeechSynthesisUtterance.onend");
      };

      utterance.onerror = (event) => {
        console.error("SpeechSynthesisUtterance.onerror", event);
      };

      const voice = this.voices.find(v => v.lang === languageInfo.code);

      if (voice) {
        utterance.voice = voice;
      } else {
        // Fallback to the language code if a specific voice is not found
        utterance.lang = languageInfo.code;
        console.warn(`No specific voice found for ${languageInfo.code}. Using language fallback.`);
      }

      utterance.pitch = 1;
      utterance.rate = rate;
      this.synthesis.speak(utterance);
    }
  }

  public cancel(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
}

// Export a singleton instance of the AudioPlayer
export const audioPlayer = new AudioPlayer();
