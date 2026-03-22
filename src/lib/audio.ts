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
    'serbian': 'Serbian Male',
    'finnish': 'Finnish Female',
    'hebrew': 'Hebrew Male',
    'tamil': 'Tamil Male',
    'sinhala': 'Sinhala',
    'bengali': 'Bengali Female',
    'nepali': 'Nepali Female',
};

let isVoiceReady = false;
const pendingPlayCalls: (() => void)[] = [];

// This function will be assigned to the window object.
// ResponsiveVoice will call it when its scripts are loaded and ready.
if (typeof window !== 'undefined') {
  window.OnVoiceReady = () => {
    isVoiceReady = true;
    // Execute any calls that were queued while the voice engine was loading.
    pendingPlayCalls.forEach(call => call());
    // Clear the queue
    pendingPlayCalls.length = 0;
  };
}

/**
 * A robust, event-driven audio engine for ResponsiveVoice.js.
 * It queues audio playback requests until the voice engine is fully initialized,
 * preventing race conditions and silent failures in WebViews.
 */
export const audioEngine = {
  /**
   * Plays the given text using the specified language.
   * If the voice engine is not ready, the request is queued.
   * @param text The text to speak.
   * @param languageName The name of the language (e.g., "French").
   * @param rate The speech rate (default is 1).
   */
  play: (text: string, languageName: string, rate = 1) => {
    const playLogic = () => {
      // Guard against calls made in a non-browser environment.
      if (typeof window === 'undefined' || typeof window.responsiveVoice === 'undefined') {
        console.error("Audio playback is only supported in the browser.");
        return;
      }
      
      const voice = voiceMap[languageName.toLowerCase()] || 'UK English Female';
      
      // Always cancel previous audio to prevent overlap.
      if (window.responsiveVoice.isPlaying()) {
        window.responsiveVoice.cancel();
      }

      // A tiny delay can help ensure the 'cancel' command is processed on all devices
      // before the new 'speak' command is issued.
      setTimeout(() => {
        window.responsiveVoice.speak(text, voice, { rate });
      }, 50);
    };

    if (isVoiceReady) {
      playLogic();
    } else {
      // If the voice engine isn't ready, queue the playback call.
      pendingPlayCalls.push(playLogic);
    }
  },

  /**
   * Stops any currently playing audio.
   */
  stop: () => {
    if (isVoiceReady && typeof window.responsiveVoice !== 'undefined' && window.responsiveVoice.isPlaying()) {
      window.responsiveVoice.cancel();
    }
  },
};
