'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { AudioButton } from './AudioButton';
import type { LessonItem } from '@/lib/types';
import { Separator } from './ui/separator';

interface WordCardProps {
  item: LessonItem;
  language: string;
}

export function WordCard({ item, language }: WordCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const cardContainerStyle = {
    perspective: '1000px',
  };

  const cardStyle = {
    transformStyle: 'preserve-3d',
    transition: 'transform 0.6s',
    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  };

  const cardFaceStyle = {
    backfaceVisibility: 'hidden' as const,
    WebkitBackfaceVisibility: 'hidden' as const,
  };

  return (
    <div style={cardContainerStyle} className="w-full max-w-sm h-[22rem]">
      <div style={cardStyle} className="relative w-full h-full cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        {/* Front of the card */}
        <div style={cardFaceStyle} className="absolute w-full h-full">
          <Card className="flex h-full flex-col items-center justify-center p-6 text-center shadow-lg">
            <h2 className="text-5xl font-bold">{item.target}</h2>
            <p className="mt-2 text-2xl text-muted-foreground">{item.phonetic}</p>
            <div className="mt-4" onClick={(e) => e.stopPropagation()}>
              <AudioButton text={item.audioText} languageName={language} />
            </div>
             <p className="absolute bottom-4 text-xs text-muted-foreground">Click to flip</p>
          </Card>
        </div>

        {/* Back of the card */}
        <div style={{...cardFaceStyle, transform: 'rotateY(180deg)'}} className="absolute w-full h-full">
           <Card className="flex h-full flex-col justify-center p-6 text-center shadow-lg">
             <h3 className="text-3xl font-bold">{item.english}</h3>
             {item.exampleSentence && (
                <div className="mt-4 border-t pt-3 text-sm">
                    <p className="font-semibold text-foreground">Example:</p>
                    <p className="italic">"{item.exampleSentence.target}"</p>
                    <p className="text-muted-foreground">"{item.exampleSentence.english}"</p>
                </div>
             )}
           </Card>
        </div>
      </div>
    </div>
  );
}
