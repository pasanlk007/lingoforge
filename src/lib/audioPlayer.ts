'use client';

import { targetLanguages } from '@/lib/translations';

declare const responsiveVoice: any;

class AudioPlayer {
  private isReady = false;
  private readyInterval: NodeJS.Timeout | null = null;
  private currentAudio: any = null; // To hold the audio instance

  constructor() {
    this.initialize();
  }

  /**
   * Polls until the ResponsiveVoice script is loaded and ready.
   */
  private initialize() {
    // This check is for server-side rendering, where `window` is not available.
    if (typeof window === 'undefined') return;

    if (typeof responsiveVoice === 'undefined' || !responsiveVoice.voiceSupport()) {
      this.readyInterval = setInterval(() => {
        if (typeof responsiveVoice !== 'undefined' && responsiveVoice.voiceSupport()) {
          this.isReady = true;
          if(this.readyInterval) clearInterval(this.readyInterval);
          this.readyInterval = null;
          console.log("ResponsiveVoice is ready.");
        }
      }, 250);
    } else {
      this.isReady = true;
      console.log("ResponsiveVoice was ready immediately.");
    }
  }

  /**
   * Maps a language name to the corresponding voice name for ResponsiveVoice.
   */
  private getLangVoice(languageName: string): string {
    const voiceMap: Record<string, string> = {
      'French': 'French Female',
      'German': 'Deutsch Female',
      'Spanish': 'Spanish Female',
      'Italian': 'Italian Female',
      'Portuguese': 'Portuguese Female',
      'Romanian': 'Romanian Female',
      'Dutch': 'Dutch Female',
      'Polish': 'Polish Female',
      'Russian': 'Russian Female',
      'Arabic': 'Arabic Female',
      'Japanese': 'Japanese Female',
      'Korean': 'Korean Female',
      'Chinese': 'Chinese Female',
      'Turkish': 'Turkish Female',
      'Greek': 'Greek Female',
      'Hindi': 'Hindi Female',
      'Hebrew': 'Hebrew Female',
      'Finnish': 'Finnish Female',
      'Serbian': 'Serbian Male',
      'Tamil': 'Tamil Female',
      'English': 'UK English Female',
    };
    return voiceMap[languageName] || 'UK English Female';
  }

  /**
   * Returns a promise that resolves when ResponsiveVoice is ready, or rejects on timeout.
   */
  private async waitForReady(timeout = 5000): Promise<void> {
    if (this.isReady) return Promise.resolve();

    return new Promise((resolve, reject) => {
      let waited = 0;
      const interval = setInterval(() => {
        if (this.isReady) {
          clearInterval(interval);
          resolve();
        } else {
          waited += 100;
          if (waited >= timeout) {
            clearInterval(interval);
            reject(new Error("ResponsiveVoice not ready after timeout."));
          }
        }
      }, 100);
    });
  }

  /**
   * Speaks the given text using the appropriate voice. It waits for the library
   * to be ready before attempting to speak.
   */
  public async speak(text: string, languageName: string, rate: number = 1.0): Promise<void> {
    if (!text || typeof window === 'undefined') return;
    
    this.cancel();

    try {
      await this.waitForReady();
      const voice = this.getLangVoice(languageName);
      responsiveVoice.speak(text, voice, { rate });
    } catch (e) {
      console.error("Audio playback failed:", e);
      // Optional: You could add a user-facing notification here (e.g., using a toast)
    }
  }

  /**
   * Cancels any currently playing audio.
   */
  public cancel(): void {
    if (typeof responsiveVoice !== 'undefined' && responsiveVoice.isPlaying()) {
      responsiveVoice.cancel();
    }
  }
}

export const audioPlayer = new AudioPlayer();
