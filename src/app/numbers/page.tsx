'use client';

import { useState, useEffect } from 'react';
import { audioEngine } from '@/lib/audio';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function LoadingSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1 container mx-auto max-w-4xl py-12 px-4">
        <Skeleton className="h-10 w-1/2 mx-auto" />
        <Skeleton className="h-6 w-3/4 mx-auto mt-4" />
        <div className="flex flex-wrap justify-center gap-4 mt-8">
            {Array.from({length: 14}).map((_, i) => (
                <Skeleton key={i} className="m-2 w-28 h-28" />
            ))}
        </div>
      </main>
    </div>
  );
}

export default function NumbersPage() {
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedLang = localStorage.getItem('targetLanguage');
    if (savedLang) {
      setTargetLanguage(savedLang);
    }
  }, []);

  if (!isMounted) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1 container mx-auto max-w-4xl py-12 px-4">
        
        <h1 className="text-4xl font-bold text-center mb-2">Numbers Path</h1>
        <p className="text-center text-muted-foreground mb-8">Click a number to hear its pronunciation in {targetLanguage}.</p>

        <div className="flex flex-wrap justify-center gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 50, 100, 1000].map((num) => {
              const word = String(num);

              return (
                <Button
                  key={num}
                  className="m-2 w-28 h-28 text-3xl font-bold"
                  variant="outline"
                  onClick={() => {
                    audioEngine.play(word, targetLanguage);
                  }}
                >
                  {word}
                </Button>
              );
            })}
        </div>
      </main>
    </div>
  );
}
