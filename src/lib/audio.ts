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
    'sinhala': 'Sinhala', // This is a custom voice name, assuming it's supported
    'bengali': 'Bengali Female',
    'nepali': 'Nepali Female',
};

class AudioEngine {
  private isReady = false;
  private readyCallbacks: (() => void)[] = [];

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window === 'undefined') return;

    // Check if the library is already loaded
    if (window.responsiveVoice && typeof window.responsiveVoice.speak === 'function') {
      this.isReady = true;
      return;
    }

    // Wait for the library to load. It's included via a <script> tag.
    const interval = setInterval(() => {
      if (window.responsiveVoice && typeof window.responsiveVoice.speak === 'function') {
        this.isReady = true;
        clearInterval(interval);
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
    this.readyCallbacks.forEach(cb => cb());
    this.readyCallbacks = [];
  }

  play(text: string, languageName: string, rate = 1) {
    this.onReady(() => {
      const voice = voiceMap[languageName.toLowerCase()] || 'UK English Female';
      
      if (window.responsiveVoice.isPlaying()) {
        window.responsiveVoice.cancel();
      }
      
      // Add a small delay to ensure cancel has taken effect on all platforms
      setTimeout(() => {
        window.responsiveVoice.speak(text, voice, { rate });
      }, 50);
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
