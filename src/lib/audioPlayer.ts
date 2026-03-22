'use client';

import { targetLanguages } from '@/lib/translations';

declare const responsiveVoice: any;

class AudioPlayer {

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

  public async speak(text: string, languageName: string, rate: number = 1.0): Promise<void> {
    if (!text) return;
    this.cancel();

    try {
      if (typeof responsiveVoice !== 'undefined') {
        const voice = this.getLangVoice(languageName);
        responsiveVoice.speak(text, voice, { rate: rate });
        return;
      }
    } catch (e) {}

    // Fallback: Web Speech API
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const langInfo = targetLanguages.find(
        l => l.lang.toLowerCase() === languageName.toLowerCase()
      );
      const langCode = langInfo?.countries[0] || 'en-US';
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    }
  }

  public cancel(): void {
    try {
      if (typeof responsiveVoice !== 'undefined') {
        responsiveVoice.cancel();
      }
    } catch (e) {}
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audioPlayer = new AudioPlayer();
