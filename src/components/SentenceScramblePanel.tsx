'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';
import { Shuffle, Lightbulb, CheckCircle, XCircle } from 'lucide-react';
import type { SentenceScrambleExercise as SentenceScrambleExerciseType } from '@/lib/types';
import { Separator } from './ui/separator';

interface SentenceScramblePanelProps {
  exercises: SentenceScrambleExerciseType[];
  onComplete: (isCorrect: boolean) => void;
}

type WordOption = {
  text: string;
  originalIndex: number;
}

const ScrambleExercise = ({ exercise, onComplete }: { exercise: SentenceScrambleExerciseType, onComplete: (isCorrect: boolean) => void }) => {
  const initialWords = useMemo(() => exercise.scrambled.map((text, originalIndex) => ({ text, originalIndex })), [exercise.scrambled]);
  
  const [availableWords, setAvailableWords] = useState<WordOption[]>(initialWords);
  const [chosenWords, setChosenWords] = useState<WordOption[]>([]);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);

  useEffect(() => {
    // Reset state if exercise changes
    setAvailableWords(initialWords);
    setChosenWords([]);
    setResult(null);
  }, [exercise, initialWords]);

  const handleChooseWord = (word: WordOption) => {
    if (result) return;
    setChosenWords([...chosenWords, word]);
    setAvailableWords(availableWords.filter(w => w.originalIndex !== word.originalIndex));
  };
  
  const handleUnchooseWord = (word: WordOption) => {
    if (result) return;
    setChosenWords(chosenWords.filter(w => w.originalIndex !== word.originalIndex));
    setAvailableWords([...availableWords, word].sort((a, b) => a.originalIndex - b.originalIndex));
  };
  
  const handleCheck = () => {
    const constructedSentence = chosenWords.map(w => w.text).join(' ');
    if (constructedSentence === exercise.correct) {
      setResult('correct');
      onComplete(true);
    } else {
      setResult('incorrect');
      onComplete(false);
    }
  };
  
  const handleReset = () => {
    setAvailableWords(initialWords);
    setChosenWords([]);
    setResult(null);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground italic">
        <Lightbulb className="inline-block h-4 w-4 mr-2" />
        {`Translate: "${exercise.nativeHint}"`}
      </p>

      {/* The box for the user's sentence */}
      <div className={cn("min-h-[4.5rem] rounded-lg border-2 border-dashed bg-muted p-3 flex flex-wrap gap-2 items-center", result === 'incorrect' && 'border-destructive')}>
        {chosenWords.map((word) => (
          <Button key={word.originalIndex} variant="secondary" onClick={() => handleUnchooseWord(word)}>
            {word.text}
          </Button>
        ))}
      </div>

      {/* The word bank */}
      <div className="flex flex-wrap gap-2">
        {availableWords.map((word) => (
            <Button
                key={word.originalIndex}
                variant="outline"
                onClick={() => handleChooseWord(word)}
            >
              {word.text}
            </Button>
        ))}
      </div>

       <div className="flex items-center gap-4 mt-4">
            <Button onClick={handleCheck} disabled={chosenWords.length === 0 || !!result}>Check</Button>
            <Button variant="ghost" onClick={handleReset}>Reset</Button>
       </div>
       {result === 'correct' && (
        <p className="text-green-500 font-semibold flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Correct! The sentence is: "{exercise.correct}"</p>
       )}
       {result === 'incorrect' && (
        <p className="text-destructive font-semibold flex items-center gap-2"><XCircle className="h-5 w-5" /> Not quite. Try again!</p>
       )}
    </div>
  )
}

export function SentenceScramblePanel({ exercises, onComplete }: SentenceScramblePanelProps) {
  if (!exercises || exercises.length === 0) {
    return null;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shuffle className="h-6 w-6" />
          <span>Arrange the Words</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {exercises.map((ex, index) => (
            <div key={ex.id}>
                <ScrambleExercise exercise={ex} onComplete={onComplete} />
                {index < exercises.length - 1 && <Separator className="my-6" />}
            </div>
        ))}
      </CardContent>
    </Card>
  );
}
