
'use client';

import { useState } from 'react';
import { Volume2, Play, Pause, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { TARGET_LANGUAGES } from '@/lib/constants';

interface AlphabetAudioCardProps {
  letter: string;
  pronunciation: {
    phonetic: string;
    description: {
      english: string;
      [key: string]: string;
    };
    mouthPosition: string;
    audioText: string;
  };
  language: string;
  nativeLanguage: string;
}

export function AlphabetAudioCard({ letter, pronunciation, language, nativeLanguage }: AlphabetAudioCardProps) {
  const [rate, setRate] = useState(0.8);

  const langCode = TARGET_LANGUAGES.find(l => l.name === language)?.code || 'en-US';

  const speak = (text: string, currentRate: number) => {
    if (typeof window.speechSynthesis === 'undefined') {
      alert('Sorry, your browser does not support text-to-speech.');
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = currentRate;
    utterance.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 text-center">
        <div className="bg-muted rounded-lg p-8 mb-6">
          <h1 className="text-8xl font-bold font-serif">{letter}</h1>
        </div>
        
        <Button onClick={() => speak(pronunciation.audioText, rate)} size="lg" className="w-full">
          <Volume2 className="mr-2 h-6 w-6" />
          Hear Pronunciation: "{pronunciation.phonetic}"
        </Button>

        <div className="my-4 text-left">
            <p className="font-semibold">{pronunciation.description.english}</p>
            {nativeLanguage !== 'English' && <p className="text-muted-foreground">{pronunciation.description[nativeLanguage.toLowerCase()]}</p>}
            <p className="text-sm text-muted-foreground mt-1">
                <strong>Mouth:</strong> {pronunciation.mouthPosition}
            </p>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <span className="text-sm font-medium text-muted-foreground">Speed</span>
          <Slider
            defaultValue={[rate]}
            min={0.2}
            max={1.5}
            step={0.1}
            onValueChange={(value) => setRate(value[0])}
          />
        </div>
      </CardContent>
    </Card>
  );
}
