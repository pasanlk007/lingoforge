'use client';

import { audioEngine } from '@/lib/audio';
import { getAudioUrl } from '@/lib/audioUrls';

// ⚠️ NOTE: Keep your existing imports below this line
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NumbersPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />

      <main className="flex-1 container mx-auto max-w-4xl py-12 px-4">
        
        <h1 className="text-4xl font-bold text-center mb-8">Numbers Path</h1>

        {/* 🔥 SAMPLE ITEMS (replace later with your real data) */}
        {[1,2,3,4,5,6,7,8,9,10].map((num) => {
          const word = String(num);

          return (
            <Button
              key={num}
              className="m-2"
              onClick={() => {
                const url = getAudioUrl('en', 1, 1, word);
                audioEngine.play(url);
              }}
            >
              {word}
            </Button>
          );
        })}

      </main>
    </div>
  );
}
