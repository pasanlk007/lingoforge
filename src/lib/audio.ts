'use client';

// Define the ResponsiveVoice interface for TypeScript
declare global {
  interface Window {
    responsiveVoice: {
      speak: (text: string, voice?: string, params?: any) => void;
      getVoices: () => any[];
      voiceSupport: () => boolean;
      cancel: () => void;
      isPlaying: () => boolean;
    };
  }
}

// Map app language names to ResponsiveVoice voice names
const voiceMap: { [key: string]: string } = {
    'english': 'UK English Female',
    'french': 'French Female',
    'german': 'Deutsch Female',
    'spanish': 'Spanish Female',
    'italian': 'Italian Female',
    'portuguese': 'Portuguese Female',
    'dutch': 'Dutch Female',
    'polish': 'Polish Female',
    'romanian': 'Romanian Female',
    'russian': 'Russian Female',
    'japanese': 'Japanese Female',
    'korean': 'Korean Female',
    'chinese': 'Chinese Female',
    'hindi': 'Hindi Female',
    'arabic': 'Arabic Female',
    'turkish': 'Turkish Female',
    'greek': 'Greek Female',
    'serbian': 'Serbian Male', // Female voice not available
    'finnish': 'Finnish Female',
    'hebrew': 'Hebrew Male', // Female voice not available
    'tamil': 'Tamil Male',
    'sinhala': 'Sinhala',
    'bengali': 'Bengali Female',
    'nepali': 'Nepali Female',
};

class AudioEngine {
  private isReady = false;
  private readyCallbacks: (() => void)[] = [];
  private readyCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window === 'undefined') return;

    if (this.readyCheckInterval) {
        clearInterval(this.readyCheckInterval);
    }
    
    // Check if the library is already loaded and supported
    if (window.responsiveVoice && window.responsiveVoice.voiceSupport()) {
      this.isReady = true;
      return;
    }

    // Poll until the library is loaded and supported.
    this.readyCheckInterval = setInterval(() => {
      // The `voiceSupport()` check is more reliable than just checking for `speak`.
      if (window.responsiveVoice && window.responsiveVoice.voiceSupport()) {
        this.isReady = true;
        if(this.readyCheckInterval) clearInterval(this.readyCheckInterval);
        this.executeReadyCallbacks();
      }
    }, 100);
  }

  private onReady(callback: () => void) {
    if (this.isReady) {
      callback();
    } else {
      this.readyCallbacks.push(callback);
    }
  }

  private executeReadyCallbacks() {
    while(this.readyCallbacks.length) {
        const cb = this.readyCallbacks.shift();
        if (cb) cb();
    }
  }

  play(text: string, languageName: string, rate = 1) {
    this.onReady(() => {
      try {
        const voice = voiceMap[languageName.toLowerCase()] || 'UK English Female';
        // A new speak call should interrupt the previous one.
        window.responsiveVoice.speak(text, voice, { rate });
      } catch (e) {
        console.error("ResponsiveVoice failed to speak. Re-initializing.", e);
        // If speaking fails, the library might be in a bad state. Re-init.
        this.isReady = false;
        this.initialize();
      }
    });
  }

  stop() {
    this.onReady(() => {
      if (window.responsiveVoice.isPlaying()) {
        window.responsiveVoice.cancel();
      }
    });
  }
}

export const audioEngine = new AudioEngine();
