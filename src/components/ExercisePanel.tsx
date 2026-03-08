'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Exercises } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, BrainCircuit, Users, Puzzle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';

interface ExercisePanelProps {
  exercises: Exercises;
  onExercisesComplete: (isCorrect: boolean) => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function FillInTheBlanks({ exercises, onComplete }: { exercises: Exercises['fillBlanks'], onComplete: (isCorrect: boolean) => void }) {
  if (!exercises || exercises.length === 0) return null;

  const [fbAnswers, setFbAnswers] = useState<string[]>(Array(exercises.length).fill(''));

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Puzzle className="w-5 h-5" />Fill in the Blanks</h3>
      <div className="space-y-6">
        {exercises.map((ex, index) => (
          <div key={ex.id}>
              <label className="text-sm text-muted-foreground" htmlFor={ex.id}>{ex.sentence.split('___')[0]}<span className="font-bold text-foreground"> ___ </span>{ex.sentence.split('___')[1]}</label>
              <Input
                id={ex.id}
                placeholder={ex.hint}
                className="mt-2"
                value={fbAnswers[index]}
                onChange={(e) => {
                  const newAnswers = [...fbAnswers];
                  newAnswers[index] = e.target.value;
                  setFbAnswers(newAnswers);
                  if (e.target.value.toLowerCase() === ex.answer.toLowerCase()) {
                    onComplete(true);
                  }
                }}
              />
            {fbAnswers[index] && fbAnswers[index].toLowerCase() === ex.answer.toLowerCase() && (
                <p className="text-sm text-green-500 mt-1 flex items-center gap-1"><CheckCircle className="w-4 h-4"/>Correct!</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Matching({ exercises, onComplete }: { exercises: Exercises['matching'], onComplete: (isCorrect: boolean) => void }) {
    if (!exercises || exercises.length === 0) return null;

    const matchingPairs = useMemo(() => exercises ?? [], [exercises]);
    const [matchingTargets, setMatchingTargets] = useState<string[]>([]);
    const [matchingNatives, setMatchingNatives] = useState<string[]>([]);
    
    useEffect(() => {
        if (matchingPairs.length > 0) {
        setMatchingTargets(shuffleArray(matchingPairs.map(p => p.target)));
        setMatchingNatives(shuffleArray(matchingPairs.map(p => p.native)));
        }
    }, [matchingPairs]);

    const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
    const [selectedNative, setSelectedNative] = useState<string | null>(null);
    const [matches, setMatches] = useState<Record<string, string>>({});
    const [incorrectMatch, setIncorrectMatch] = useState(false);

    useEffect(() => {
        if (selectedTarget && selectedNative) {
        const originalPair = matchingPairs.find(p => p.target === selectedTarget);
        if (originalPair && originalPair.native === selectedNative) {
            setMatches(prev => ({ ...prev, [selectedTarget]: selectedNative }));
            onComplete(true);
            setIncorrectMatch(false);
        } else {
            onComplete(false);
            setIncorrectMatch(true);
        }
        setTimeout(() => {
            setSelectedTarget(null);
            setSelectedNative(null);
            setIncorrectMatch(false);
        }, 500); // give feedback for 500ms
        }
    }, [selectedTarget, selectedNative, matchingPairs, onComplete]);

    const allMatched = Object.keys(matches).length === matchingPairs.length;

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5"/>Matching Pairs</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    {matchingTargets.map(target => (
                        <Button
                            key={target}
                            variant={matches[target] ? 'outline' : (selectedTarget === target ? 'default' : 'secondary')}
                            className={cn(
                                matches[target] && "bg-green-500/20 border-green-500/50 text-foreground cursor-default", 
                                selectedTarget === target && "ring-2 ring-primary",
                                incorrectMatch && selectedTarget === target && "bg-destructive/80"
                            )}
                            disabled={!!matches[target]}
                            onClick={() => setSelectedTarget(target)}
                        >
                            {target}
                        </Button>
                    ))}
                </div>
                <div className="flex flex-col gap-2">
                    {matchingNatives.map(native => (
                        <Button
                            key={native}
                            variant={Object.values(matches).includes(native) ? 'outline' : (selectedNative === native ? 'default' : 'secondary')}
                            className={cn(
                                Object.values(matches).includes(native) && "bg-green-500/20 border-green-500/50 text-foreground cursor-default", 
                                selectedNative === native && "ring-2 ring-primary",
                                incorrectMatch && selectedNative === native && "bg-destructive/80"
                            )}
                            disabled={Object.values(matches).includes(native)}
                            onClick={() => setSelectedNative(native)}
                        >
                            {native}
                        </Button>
                    ))}
                </div>
            </div>
            {allMatched && matchingPairs.length > 0 && (
                <Alert className="mt-4 border-green-500/50 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Great job!</AlertTitle>
                  <AlertDescription>All pairs matched correctly!</AlertDescription>
                </Alert>
            )}
        </div>
    )
}

export function ExercisePanel({ exercises, onExercisesComplete }: ExercisePanelProps) {
  const hasFillBlanks = Array.isArray(exercises.fillBlanks) && exercises.fillBlanks.length > 0;
  const hasMatching = Array.isArray(exercises.matching) && exercises.matching.length > 0;

  if (!hasFillBlanks && !hasMatching) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6"/>
            <span>Practice Exercises</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {hasFillBlanks && (
            <FillInTheBlanks exercises={exercises.fillBlanks} onComplete={onExercisesComplete} />
        )}
        {hasFillBlanks && hasMatching && <Separator />}
        {hasMatching && (
            <Matching exercises={exercises.matching} onComplete={onExercisesComplete} />
        )}
      </CardContent>
    </Card>
  );
}
