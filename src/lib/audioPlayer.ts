'use client';

import { targetLanguages } from '@/lib/translations';

class AudioPlayer {
  private utteranceRef: SpeechSynthesisUtterance | null = null; // Keep a reference to prevent garbage collection
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.loadVoices();
      // onvoiceschanged is not always reliable, so we also poll.
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    this.voices = window.speechSynthesis.getVoices();
  }
  
  private getVoices(): Promise<SpeechSynthesisVoice[]> {
      return new Promise(resolve => {
          this.loadVoices();
          if (this.voices.length > 0) {
              return resolve(this.voices);
          }
          
          const voiceLoadInterval = setInterval(() => {
            this.loadVoices();
            if (this.voices.length > 0) {
                clearInterval(voiceLoadInterval);
                resolve(this.voices);
            }
          }, 100);

          window.speechSynthesis.onvoiceschanged = () => {
              this.loadVoices();
              clearInterval(voiceLoadInterval);
              resolve(this.voices);
          };
      });
  }

  public async speak(text: string, languageName: string, rate: number = 1.0): Promise<void> {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) {
      return;
    }

    // Always cancel previous speech to prevent overlap and errors
    window.speechSynthesis.cancel();
    
    const voices = await this.getVoices();
    const langInfo = targetLanguages.find(l => l.lang.toLowerCase() === languageName.toLowerCase());
    
    // Find a matching voice code from the translations file, e.g., "fr-FR", "de-DE".
    const langCode = langInfo ? targetLanguages.find(l => l.lang === langInfo.lang)?.countries[0] || 'en-US' : 'en-US';

    const utterance = new SpeechSynthesisUtterance(text);
    this.utteranceRef = utterance; // Keep reference

    utterance.lang = langCode;
    utterance.rate = rate;

    // Find the best available voice for the language code (e.g., 'fr-FR')
    let voice = voices.find(v => v.lang === langCode);
    if (!voice) {
      const primaryLang = langCode.split('-')[0];
      voice = voices.find(v => v.lang.startsWith(primaryLang));
    }

    if (voice) {
      utterance.voice = voice;
    } else {
        console.warn(`[AudioPlayer] No specific voice found for lang '${langCode}'. Using browser default.`);
    }

    utterance.onend = () => {
      this.utteranceRef = null;
    };
    utterance.onerror = (event) => {
      console.warn("[AudioPlayer] SpeechSynthesisUtterance.onerror", event);
      this.utteranceRef = null;
    };

    window.speechSynthesis.speak(utterance);
  }

  public cancel(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      this.utteranceRef = null;
    }
  }
}

export const audioPlayer = new AudioPlayer();
