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

/**
 * A simpler, more direct audio engine for ResponsiveVoice.js.
 * It checks for support on every call, making it more robust for WebViews.
 */
export const audioEngine = {
  /**
   * Plays the given text using the specified language.
   * @param text The text to speak.
   * @param languageName The name of the language (e.g., "French").
   * @param rate The speech rate (default is 1).
   */
  play: (text: string, languageName: string, rate = 1) => {
    // Guard against calls made in a non-browser environment or where the library isn't ready.
    if (typeof window === 'undefined' || !window.responsiveVoice || typeof window.responsiveVoice.speak !== 'function') {
      console.error("ResponsiveVoice not available or not ready.");
      // In a real app, you might want to show a toast message to the user.
      return;
    }
    
    const voice = voiceMap[languageName.toLowerCase()] || 'UK English Female';
    
    // Always cancel previous audio to prevent overlap, which is a common issue.
    if (window.responsiveVoice.isPlaying()) {
      window.responsiveVoice.cancel();
    }

    // A small delay helps ensure the 'cancel' command is processed on all devices
    // before the new 'speak' command is issued. This improves reliability.
    setTimeout(() => {
      window.responsiveVoice.speak(text, voice, { rate });
    }, 50);
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
