'use client';

import { targetLanguages } from '@/lib/translations';

// Augment the window object with the responsiveVoice property
declare global {
  interface Window {
    responsiveVoice?: {
      speak: (text: string, voice: string, options: { rate: number; onend?: () => void; onerror?: (e: any) => void }) => void;
      cancel: () => void;
      voiceSupport: () => boolean;
      getVoices: () => any[];
    };
  }
}

class AudioPlayer {
  private isSpeaking: boolean = false;
  private voiceReady: boolean = false;
  private readyInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // ResponsiveVoice can take a moment to load. We need to check for it.
    if (typeof window !== 'undefined') {
      if (window.responsiveVoice && window.responsiveVoice.voiceSupport()) {
        this.voiceReady = true;
      } else {
        // Poll every 100ms for the library to become available.
        this.readyInterval = setInterval(() => {
          if (window.responsiveVoice && window.responsiveVoice.voiceSupport()) {
            this.voiceReady = true;
            if (this.readyInterval) {
              clearInterval(this.readyInterval);
              this.readyInterval = null;
            }
          }
        }, 100);
      }
    }
  }

  private getVoiceName(languageName: string): string {
    const langInfo = targetLanguages.find(
      l => l.lang.toLowerCase() === languageName.toLowerCase()
    );

    switch (langInfo?.lang) {
        case 'French': return 'French Female';
        case 'German': return 'German Female';
        case 'Italian': return 'Italian Female';
        case 'Spanish': return 'Spanish Female';
        case 'Portuguese': return 'Portuguese Female';
        case 'Dutch': return 'Dutch Female';
        case 'Polish': return 'Polish Female';
        case 'Russian': return 'Russian Female';
        case 'Korean': return 'Korean Female';
        case 'Japanese': return 'Japanese Female';
        case 'Chinese': return 'Chinese Female';
        case 'Hindi': return 'Hindi Female';
        default: return 'US English Female';
    }
  }

  public async speak(text: string, languageName: string, rate: number = 1.0): Promise<void> {
    if (!text || typeof window === 'undefined') return;

    this.cancel();

    // Wait for the voice library to be ready
    if (!this.voiceReady) {
      await new Promise(resolve => {
        const check = () => {
          if (this.voiceReady) {
            resolve(true);
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    }

    if (!window.responsiveVoice) {
      console.warn('[AudioPlayer] ResponsiveVoice not available.');
      return;
    }
    
    const voice = this.getVoiceName(languageName);

    try {
      this.isSpeaking = true;
      window.responsiveVoice.speak(text, voice, {
        rate: Math.max(0.7, Math.min(1.2, rate)), // Clamp rate to what RV supports
        onend: () => { this.isSpeaking = false; },
        onerror: (e) => {
          console.warn('[AudioPlayer] ResponsiveVoice Error:', e);
          this.isSpeaking = false;
        }
      });
    } catch (e) {
      console.warn('[AudioPlayer] Failed to play:', e);
      this.isSpeaking = false;
    }
  }

  public cancel(): void {
    if (this.isSpeaking && typeof window !== 'undefined' && window.responsiveVoice) {
      window.responsiveVoice.cancel();
      this.isSpeaking = false;
    }
  }
}

export const audioPlayer = new AudioPlayer();
