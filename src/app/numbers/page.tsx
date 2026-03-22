'use client';

import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';

export default function NumbersPage() {
  const numbers = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />

      <main className="flex-1 container mx-auto max-w-4xl py-12 px-4">
        <h1 className="text-4xl font-bold text-center mb-8">
          Numbers Path
        </h1>

        <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
          {numbers.map((num) => {
            const week = Math.ceil(num / 7);
            const day = ((num - 1) % 7) + 1;

            return (
              <Link
                key={num}
                href={`/lessons/english/numbers/${week}/${day}`}
              >
                <Button className="w-full h-16 text-lg font-bold">
                  {num}
                </Button>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
