'use client';

class AudioEngine {
  private audio: HTMLAudioElement | null = null;

  play(url: string) {
    if (!url) return;

    try {
      if (this.audio) {
        this.audio.pause();
        this.audio.currentTime = 0;
      }

      this.audio = new Audio(url);
      this.audio.preload = 'auto';

      this.audio.play().catch((err) => {
        console.warn('[AudioEngine] Play failed:', err);
      });

    } catch (e) {
      console.warn('[AudioEngine] Error:', e);
    }
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }
}

export const audioEngine = new AudioEngine();
