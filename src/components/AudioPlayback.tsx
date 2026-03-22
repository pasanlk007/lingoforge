'use client';

import { audioEngine } from '@/lib/audio';
import { getAudioUrl } from '@/lib/audioUrls';

type Props = {
  text?: string;
  languageName?: string;
  week?: number;
  day?: number;
};

export function AudioPlayback({ text, languageName, week = 1, day = 1 }: Props) {

  const play = (rate: number) => {
    if (!text || !languageName) return;

    const url = getAudioUrl(
      languageName.toLowerCase(),
      week,
      day,
      text
    );

    audioEngine.play(url, rate);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => play(0.7)}
        className="px-2 py-1 bg-gray-500 text-white rounded"
      >
        🐢 Slow
      </button>

      <button
        onClick={() => play(1)}
        className="px-2 py-1 bg-blue-500 text-white rounded"
      >
        🔊 Play
      </button>
    </div>
  );
}
