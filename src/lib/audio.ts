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
    OnVoiceReady?: () => void;
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

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window === 'undefined') {
      return;
    }

    // If the library is already loaded and supports voices, we are ready.
    if (window.responsiveVoice && window.responsiveVoice.voiceSupport()) {
      if (!this.isReady) {
          this.isReady = true;
          this.executeReadyCallbacks();
      }
      return;
    }

    // Set the official callback. The library will call this function when it's initialized.
    window.OnVoiceReady = () => {
      if (!this.isReady) {
        this.isReady = true;
        this.executeReadyCallbacks();
      }
    };
    
    // Fallback polling for scenarios where OnVoiceReady might have already fired.
    const pollForReady = () => {
        if (this.isReady) return;
        if (window.responsiveVoice && window.responsiveVoice.voiceSupport()) {
             if (!this.isReady) {
                this.isReady = true;
                this.executeReadyCallbacks();
            }
        } else {
            setTimeout(pollForReady, 150);
        }
    }
    
    // Start polling after a short delay to allow the script to load.
    setTimeout(pollForReady, 100);
  }

  private onReady(callback: () => void) {
    if (this.isReady) {
      callback();
    } else {
      this.readyCallbacks.push(callback);
    }
  }

  private executeReadyCallbacks() {
    while(this.readyCallbacks.length > 0) {
        const cb = this.readyCallbacks.shift();
        if (cb) {
          try {
            cb();
          } catch (e) {
            console.error("Error executing ready callback", e);
          }
        }
    }
  }

  play(text: string, languageName: string, rate = 1) {
    this.onReady(() => {
      if (!window.responsiveVoice) {
        console.error("AudioEngine: ResponsiveVoice is not available.");
        return;
      }
      
      const voice = voiceMap[languageName.toLowerCase()] || 'UK English Female';
      
      try {
        // Stop any currently playing audio to prevent overlap.
        window.responsiveVoice.cancel();
        
        // A short delay ensures the 'cancel' command is processed before 'speak' is called,
        // which is a common requirement for web audio APIs on mobile devices.
        setTimeout(() => {
          window.responsiveVoice.speak(text, voice, { rate });
        }, 100);

      } catch (e) {
        console.error("AudioEngine: ResponsiveVoice failed to speak.", e);
      }
    });
  }

  stop() {
    this.onReady(() => {
      if (window.responsiveVoice && window.responsiveVoice.isPlaying()) {
        window.responsiveVoice.cancel();
      }
    });
  }
}

export const audioEngine = new AudioEngine();
