'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AudioPlayback } from './AudioPlayback';
import type { LessonItem } from '@/lib/types';
import { translations } from '@/lib/translations';
import { Separator } from './ui/separator';

interface WordCardProps {
  item: LessonItem;
  language: string; // This is the target language
}

export function WordCard({ item, language }: WordCardProps) {
  const [uiLang, setUiLang] = useState<keyof typeof translations>('English');

  useEffect(() => {
    // This effect runs on the client after hydration
    const savedLang = localStorage.getItem("nativeLanguage") as keyof typeof translations | null;
    if (savedLang && translations[savedLang]) {
      setUiLang(savedLang);
    }
  }, []);

  const labels = translations[uiLang]?.wordCard || translations['English'].wordCard;

  return (
    <div className="w-full max-w-sm">
      <Card className="flex h-full flex-col p-6 text-center shadow-lg">
        
        {/* Target Word */}
        <h2 className="text-5xl font-bold">{item.target}</h2>
        
        {/* Audio Playback */}
        <div className="my-4 flex justify-center">
            <AudioPlayback text={item.target} languageName={language} />
        </div>
        
        <Separator className="my-2"/>

        {/* Phonetic and Meaning */}
        <div className="grid grid-cols-2 gap-4 my-4">
            <div className="text-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{labels.phonetic}</p>
                <p className="text-xl text-foreground">{item.phonetic}</p>
            </div>
            <div className="text-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{labels.meaning}</p>
                <h3 className="text-xl font-bold">{item.native_meaning}</h3>
            </div>
        </div>
        
        {/* Example Sentences */}
        {item.example_sentence_target && (
            <div className="border-t pt-4 text-sm w-full bg-muted/50 rounded-lg p-3">
                <p className="font-semibold text-foreground text-left mb-1">Example:</p>
                <div className="italic text-left space-y-1">
                    <p>"{item.example_sentence_target}"</p>
                    <p className="text-muted-foreground">"{item.example_sentence_native}"</p>
                </div>
            </div>
        )}
      </Card>
    </div>
  );
}
