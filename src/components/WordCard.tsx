'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { AudioPlayback } from './AudioPlayback';
import type { LessonItem } from '@/lib/types';
import { translations } from '@/lib/translations';

interface WordCardProps {
  item: LessonItem;
  language: string; // This is the target language
}

export function WordCard({ item, language }: WordCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [uiLang, setUiLang] = useState<keyof typeof translations>('English');

  useEffect(() => {
    // This effect runs on the client after hydration
    const savedLang = localStorage.getItem("nativeLanguage") as keyof typeof translations | null;
    if (savedLang && translations[savedLang]) {
      setUiLang(savedLang);
    }
  }, []);

  const labels = translations[uiLang]?.wordCard || translations['English'].wordCard;

  const cardContainerStyle = {
    perspective: '1000px',
  };

  const cardStyle = {
    transformStyle: 'preserve-3d' as const,
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
          <Card className="flex h-full flex-col items-center justify-center p-6 text-center shadow-lg space-y-4">
            <h2 className="text-5xl font-bold">{item.target}</h2>
            
            <div className="text-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{labels.phonetic}</p>
                <p className="text-2xl text-foreground">{item.phonetic}</p>
            </div>

            <AudioPlayback text={item.target} languageName={language} />

            <p className="absolute bottom-4 text-xs text-muted-foreground">Click to flip</p>
          </Card>
        </div>

        {/* Back of the card */}
        <div style={{...cardFaceStyle, transform: 'rotateY(180deg)'}} className="absolute w-full h-full">
           <Card className="flex h-full flex-col items-center justify-center p-6 text-center shadow-lg space-y-4">
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{labels.meaning}</p>
              <h3 className="text-3xl font-bold">{item.native_meaning}</h3>
            </div>
             
             {item.example_sentence_target && (
                <div className="border-t pt-4 text-sm w-full">
                    <p className="font-semibold text-foreground">Example:</p>
                    <div className="italic mt-1">
                      <p>"{item.example_sentence_target}"</p>
                      <p className="text-muted-foreground">"{item.example_sentence_native}"</p>
                    </div>
                </div>
             )}
           </Card>
        </div>
      </div>
    </div>
  );
}
