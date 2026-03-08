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
      // It can take a moment for voices to load, especially on first visit.
      // We must listen for the 'voiceschanged' event.
      this.synthesis.onvoiceschanged = this.loadVoices;
      this.loadVoices(); // Also try to load them immediately.
    } else {
      console.warn("Web Speech API (TTS) is not supported in this browser.");
    }
  }

  private loadVoices = () => {
    if (this.synthesis) {
      const newVoices = this.synthesis.getVoices();
      if (newVoices.length > 0) {
        this.voices = newVoices;
        this.voicesLoaded = true;
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
      console.warn("[AudioPlayer] Speech synthesis is not supported or initialized.");
      return;
    }

    // Cancel any ongoing or queued speech. This is crucial to prevent errors on rapid clicks.
    this.synthesis.cancel();

    // If voices haven't loaded yet, try one more time.
    if (!this.voicesLoaded) {
      this.loadVoices();
    }

    if (text) {
      const languageInfo = TARGET_LANGUAGES.find(lang => lang.name === languageName);
      if (!languageInfo) {
        console.warn(`[AudioPlayer] Language code not found for language name: "${languageName}"`);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.onend = () => {};
      
      // The `onerror` event can be cryptic. Log the `error` property for more details.
      utterance.onerror = (event) => {
        console.warn(`[AudioPlayer] A speech synthesis error occurred: ${event.error}`);
      };

      // Find the best available voice for the language code (e.g., 'fr-FR')
      let voice = this.voices.find(v => v.lang === languageInfo.code);
      
      // If not found, try finding a voice for the base language (e.g., 'fr')
      if (!voice) {
        const baseLang = languageInfo.code.split('-')[0];
        voice = this.voices.find(v => v.lang.startsWith(baseLang));
      }

      if (voice) {
        utterance.voice = voice;
      } else {
        // As a final fallback, set the lang property. The browser will use its default.
        utterance.lang = languageInfo.code;
        if (this.voicesLoaded) {
          console.warn(`[AudioPlayer] No specific voice found for ${languageInfo.code}. Using browser default.`);
        }
      }

      utterance.pitch = 1;
      utterance.rate = rate;
      
      // Speak the utterance directly. The cancel() call above should prevent most race conditions.
      this.synthesis.speak(utterance);
    }
  }

  public cancel(): void {
    if (this.synthesis && (this.synthesis.speaking || this.synthesis.pending)) {
      this.synthesis.cancel();
    }
  }
}

// Export a singleton instance of the AudioPlayer
export const audioPlayer = new AudioPlayer();
