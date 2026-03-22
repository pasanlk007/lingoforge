'use client';

// This file contains all translation data and language constants for the app.

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

/**
 * A simple, direct-play function that checks for readiness.
 * It includes a single retry mechanism to handle initialization race conditions.
 */
function playAudio(text: string, languageName: string, rate: number) {
  // Guard against server-side rendering
  if (typeof window === 'undefined' || typeof window.responsiveVoice === 'undefined') {
    console.error("AudioEngine: Environment is not ready for audio playback.");
    return;
  }

  // Check if the library is loaded and has voices.
  if (window.responsiveVoice.voiceSupport()) {
    const voice = voiceMap[languageName.toLowerCase()] || 'UK English Female';
    window.responsiveVoice.cancel(); // Stop any currently playing audio.
    window.responsiveVoice.speak(text, voice, { rate });
  } else {
    // If not ready, wait a bit and try one more time.
    // This is a simple way to handle the race condition where the `play`
    // function is called before the `OnVoiceReady` event has fired.
    console.warn("ResponsiveVoice not ready. Retrying in 250ms.");
    setTimeout(() => {
        if (window.responsiveVoice && window.responsiveVoice.voiceSupport()) {
            const voice = voiceMap[languageName.toLowerCase()] || 'UK English Female';
            window.responsiveVoice.cancel();
            window.responsiveVoice.speak(text, voice, { rate });
        } else {
            console.error("AudioEngine: ResponsiveVoice failed to initialize in time.");
        }
    }, 250);
  }
}

export const audioEngine = {
  /**
   * Plays the given text using the specified language.
   * @param text The text to speak.
   * @param languageName The name of the language (e.g., "French").
   * @param rate The speech rate (default is 1).
   */
  play: (text: string, languageName: string, rate = 1) => {
    playAudio(text, languageName, rate);
  },

  /**
   * Stops any currently playing audio.
   */
  stop: () => {
    if (typeof window !== 'undefined' && window.responsiveVoice && window.responsiveVoice.isPlaying()) {
      window.responsiveVoice.cancel();
    }
  },
};
