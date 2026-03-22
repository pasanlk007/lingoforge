'use client';

import { targetLanguages } from '@/lib/translations';

class AudioPlayer {
  private currentAudio: HTMLAudioElement | null = null;

  private getLangCode(languageName: string): string {
    const langInfo = targetLanguages.find(
      l => l.lang.toLowerCase() === languageName.toLowerCase()
    );
    return langInfo?.countries[0]?.split('-')[0] || 'en';
  }

  public async speak(text: string, languageName: string, rate: number = 1.0): Promise<void> {
    if (!text) return;
    this.cancel();

    const langCode = this.getLangCode(languageName);
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${langCode}&client=tw-ob`;

    try {
      const audio = new Audio(url);
      audio.playbackRate = rate;
      this.currentAudio = audio;
      await audio.play();
      audio.onended = () => { this.currentAudio = null; };
      audio.onerror = () => { this.currentAudio = null; };
    } catch (e) {
      console.warn('[AudioPlayer] Failed:', e);
    }
  }

  public cancel(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
  }
}

export const audioPlayer = new AudioPlayer();
