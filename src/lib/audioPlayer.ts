"use client";

import { TARGET_LANGUAGES } from './constants';

/**
 * A utility class to handle text-to-speech using the Web Speech API.
 * This class is designed to be used on the client-side only.
 */
class AudioPlayer {
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded: boolean = false;

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
      const newVoices = this.synthesis.getVoices();
      if (newVoices.length > 0) {
        this.voices = newVoices;
        this.voicesLoaded = true;
        // console.log('Voices loaded:', this.voices.length);
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
      console.error("Speech synthesis is not supported or initialized.");
      return;
    }

    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
    
    if (!this.voicesLoaded) {
        this.loadVoices();
        if (!this.voicesLoaded) {
            console.error("No voices available for speech synthesis. Trying again shortly.");
            // We can try to speak anyway, as some browsers might pick it up.
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
      // We search with both 'fr-FR' and 'fr' style language codes.
      const voice = this.voices.find(v => v.lang === languageInfo.code) 
                    || this.voices.find(v => v.lang.startsWith(languageInfo.code.split('-')[0]));


      if (voice) {
        utterance.voice = voice;
      } else {
        // Fallback to the language code if a specific voice is not found.
        // This is important for some browsers/OS.
        utterance.lang = languageInfo.code;
        if(this.voicesLoaded) {
            console.warn(`No specific voice found for ${languageInfo.code}. Using language fallback.`);
        }
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
