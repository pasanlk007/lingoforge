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
      // The 'voiceschanged' event is crucial for loading voices, especially on mobile.
      this.synthesis.onvoiceschanged = this.loadVoices;
      this.loadVoices(); // Initial attempt to load voices.
    } else {
      console.warn("Web Speech API is not supported in this browser.");
    }
  }

  private loadVoices = () => {
    if (this.synthesis) {
      this.voices = this.synthesis.getVoices();
       if (this.voices.length === 0 && this.synthesis.getVoices().length > 0) {
        this.voices = this.synthesis.getVoices();
      }
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
      // Alerting can be intrusive, let's just log an error.
      console.error("Speech synthesis is not supported or initialized.");
      return;
    }

    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
    
    if (this.voices.length === 0) {
        this.loadVoices();
        if (this.voices.length === 0) {
            console.error("No voices available for speech synthesis.");
            // Optionally, alert the user that TTS is not ready.
            alert("Text-to-speech is not ready. Please try again in a moment.");
            return;
        }
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

      // Find the best voice for the language code.
      const voice = this.voices.find(v => v.lang === languageInfo.code);

      if (voice) {
        utterance.voice = voice;
      } else {
        // Fallback to the language code if a specific voice is not found.
        // This is important for some browsers/OS.
        utterance.lang = languageInfo.code;
        console.warn(`No specific voice found for ${languageInfo.code}. Using language fallback.`);
      }

      utterance.pitch = 1;
      utterance.rate = rate;
      this.synthesis.speak(utterance);
    }
  }

  public cancel(): void {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.cancel();
    }
  }
}

// Export a singleton instance of the AudioPlayer
export const audioPlayer = new AudioPlayer();
