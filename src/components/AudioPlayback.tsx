'use client';

import { audioEngine } from '@/lib/audio';
import { getAudioUrl } from '@/lib/audioUrls';

type Props = {
  url?: string;
  text?: string;
  languageName?: string;
  week?: number;
  day?: number;
};

export function AudioPlayback({ url, text, languageName, week = 1, day = 1 }: Props) {
  const handlePlay = () => {
    let finalUrl = url;

    // 🔥 fallback: build URL from text
    if (!finalUrl && text && languageName) {
      finalUrl = getAudioUrl(
        languageName.toLowerCase(),
        week,
        day,
        text
      );
    }

    if (finalUrl) {
      audioEngine.play(finalUrl);
    } else {
      console.warn('[AudioPlayback] No audio source');
    }
  };

  return (
    <button
      onClick={handlePlay}
      className="px-3 py-2 bg-blue-500 text-white rounded"
    >
      🔊 Play
    </button>
  );
}
