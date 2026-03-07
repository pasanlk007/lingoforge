
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';
import { TARGET_LANGUAGES } from '@/lib/constants';

interface WordListProps {
  items: any[];
  language: string;
  nativeLanguage: string;
}

export function AlphabetWordList({ items, language, nativeLanguage }: WordListProps) {
  const langCode = TARGET_LANGUAGES.find(l => l.name === language)?.code || 'en-US';
  const nativeLangKey = nativeLanguage.toLowerCase();

  const speak = (text: string, isSentence: boolean) => {
    if (typeof window.speechSynthesis === 'undefined') return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = isSentence ? 0.8 : 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📚</span>
          <span>5 Words with this Letter</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map(item => (
          <Card key={item.id} className="p-4 bg-muted/50">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold">{item.visual} {item.word}</p>
                <p className="text-muted-foreground">{item.phonetic}</p>
                <p>{item.meaning.english} / {item.meaning[nativeLangKey]}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => speak(item.audioText, false)}>
                  <Volume2 />
                </Button>
              </div>
            </div>
            <div className="mt-2 border-t pt-2">
              <p className="text-sm font-semibold">Example:</p>
              <p className="italic">"{item.exampleSentence.target}"</p>
              <p className="text-sm text-muted-foreground">"{item.exampleSentence.meaning.english}"</p>
               <p className="text-sm text-muted-foreground">"{item.exampleSentence.meaning[nativeLangKey]}"</p>
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
