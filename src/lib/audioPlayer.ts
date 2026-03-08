'use client';

import { Howl } from 'howler';
import { generateSpeech } from '@/ai/flows/tts-flow';

class AudioPlayer {
  private audioCache = new Map<string, string>(); // Cache for text -> audioDataUri
  private currentSound: Howl | null = null;

  public async speak(text: string, languageName: string, rate: number = 1.0): Promise<void> {
    if (!text) {
      return;
    }

    // Stop any currently playing sound before starting a new one.
    if (this.currentSound) {
      this.currentSound.stop();
    }

    const cacheKey = `${languageName}|${text}`;

    let audioDataUri = this.audioCache.get(cacheKey);

    if (!audioDataUri) {
      try {
        console.log(`[AudioPlayer] Generating speech for: "${text}"`);
        const response = await generateSpeech({ text, languageName });
        audioDataUri = response.audioDataUri;
        this.audioCache.set(cacheKey, audioDataUri);
      } catch (error) {
        console.error('[AudioPlayer] Failed to generate speech:', error);
        return;
      }
    } else {
        console.log(`[AudioPlayer] Playing from cache: "${text}"`);
    }

    if (audioDataUri) {
      this.currentSound = new Howl({
        src: [audioDataUri],
        html5: true, // Important for base64 data URIs
        rate: rate,
      });
      this.currentSound.play();
    }
  }

  public cancel(): void {
    if (this.currentSound) {
      this.currentSound.stop();
    }
  }
}

export const audioPlayer = new AudioPlayer();
