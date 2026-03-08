"use client";

import { TARGET_LANGUAGES } from './constants';

/**
 * A utility class to handle text-to-speech using the Web Speech API.
 * This class is designed to be used on the client-side only.
 * It includes workarounds for common browser bugs and inconsistencies.
 */
class AudioPlayer {
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  // Keep a reference to utterances to prevent them from being garbage-collected prematurely.
  private utteranceInstances: SpeechSynthesisUtterance[] = [];

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
      
      // The 'voiceschanged' event is the primary mechanism for loading voices.
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = this.loadVoices;
      }
      // Some browsers (like older Chrome versions) don't fire onvoiceschanged,
      // so we check if voices are loaded immediately.
      if (this.synthesis.getVoices().length > 0) {
        this.loadVoices();
      }

    } else {
      console.warn("Web Speech API (TTS) is not supported in this browser.");
    }
  }

  // Populates the voices array.
  private loadVoices = () => {
    if (this.synthesis) {
        const newVoices = this.synthesis.getVoices();
        if (newVoices.length > 0) {
            this.voices = newVoices;
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
    if (!this.synthesis || !text) {
      return;
    }

    // Always cancel any previous speech. This is a crucial step to prevent
    // errors from rapid clicks or queued utterances.
    this.synthesis.cancel();

    // If voices haven't loaded, try loading them again. This is a fallback.
    if (this.voices.length === 0) {
        this.loadVoices();
    }

    const languageInfo = TARGET_LANGUAGES.find(lang => lang.name === languageName);
    if (!languageInfo) {
      console.warn(`[AudioPlayer] Language code not found for: "${languageName}"`);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find the best available voice for the language code (e.g., 'fr-FR')
    let voice = this.voices.find(v => v.lang === languageInfo.code);
    
    // If a region-specific voice isn't found, try finding one for the base language (e.g., 'fr')
    if (!voice) {
      const baseLang = languageInfo.code.split('-')[0];
      voice = this.voices.find(v => v.lang.startsWith(baseLang));
    }

    if (voice) {
      utterance.voice = voice;
    } else {
      // As a fallback, set the lang property. The browser will use its default.
      utterance.lang = languageInfo.code;
      if (this.voices.length > 0) {
          console.warn(`[AudioPlayer] No specific voice for ${languageInfo.code}. Using browser default.`);
      }
    }

    utterance.pitch = 1;
    utterance.rate = rate;

    // When the utterance ends or errors, remove it from our reference array.
    utterance.onend = () => {
        this.utteranceInstances = this.utteranceInstances.filter(u => u !== utterance);
    };
    utterance.onerror = (event) => {
        console.warn(`[AudioPlayer] A speech synthesis error occurred: ${event.error}`);
        this.utteranceInstances = this.utteranceInstances.filter(u => u !== utterance);
    };

    // Add the utterance to an array to prevent it from being garbage collected.
    this.utteranceInstances.push(utterance);
    
    this.synthesis.speak(utterance);
  }

  /**
   * Cancels any speech that is currently speaking or in the queue.
   */
  public cancel(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
}

// Export a singleton instance of the AudioPlayer
export const audioPlayer = new AudioPlayer();
