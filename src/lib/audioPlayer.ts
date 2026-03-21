'use client';

import { targetLanguages } from '@/lib/translations';
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';


class AudioPlayer {
  private utteranceRef: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isUnlocked = false;

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
      // Unlock audio on first user interaction for web
      document.addEventListener('touchstart', () => this.unlockAudio(), { once: true });
      document.addEventListener('click', () => this.unlockAudio(), { once: true });
    }
  }

  private unlockAudio() {
    if (this.isUnlocked || Capacitor.isNativePlatform()) return;
    try {
      const utterance = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.cancel();
      this.isUnlocked = true;
    } catch (e) {
      console.warn('Could not unlock audio context:', e)
    }
  }

  private loadVoices() {
    this.voices = window.speechSynthesis.getVoices();
  }

  private getVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise(resolve => {
      this.loadVoices();
      if (this.voices.length > 0) return resolve(this.voices);

      const voiceLoadInterval = setInterval(() => {
        this.loadVoices();
        if (this.voices.length > 0) {
          clearInterval(voiceLoadInterval);
          resolve(this.voices);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(voiceLoadInterval);
        resolve(this.voices);
      }, 3000);
    });
  }

  public async speak(text: string, languageName: string, rate: number = 1.0): Promise<void> {
    if (!text) return;

    const langInfo = targetLanguages.find(l => l.lang.toLowerCase() === languageName.toLowerCase());
    const langCode = langInfo?.countries[0] || 'en-US';

    // NATIVE PLATFORM (ANDROID/IOS)
    if (Capacitor.isNativePlatform()) {
      try {
        await TextToSpeech.speak({
          text: text,
          lang: langCode,
          rate: rate,
        });
      } catch (e) {
        console.error('[AudioPlayer] Capacitor TextToSpeech error:', e);
      }
      return;
    }

    // WEB PLATFORM
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const voices = await this.getVoices();
    const utterance = new SpeechSynthesisUtterance(text);
    this.utteranceRef = utterance;
    utterance.lang = langCode;
    utterance.rate = rate;

    let voice = voices.find(v => v.lang === langCode);
    if (!voice) {
      const primaryLang = langCode.split('-')[0];
      voice = voices.find(v => v.lang.startsWith(primaryLang));
    }
    if (voice) utterance.voice = voice;

    utterance.onend = () => { this.utteranceRef = null; };
    utterance.onerror = (event) => {
      console.warn('[AudioPlayer] Web Speech API error', event);
      this.utteranceRef = null;
    };

    window.speechSynthesis.speak(utterance);

    // Android Chrome browser fix (not WebView)
    const androidFix = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(androidFix);
        return;
      }
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 100);
  }

  public cancel(): void {
    if (Capacitor.isNativePlatform()) {
      TextToSpeech.stop();
    } else if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      this.utteranceRef = null;
    }
  }
}

export const audioPlayer = new AudioPlayer();
