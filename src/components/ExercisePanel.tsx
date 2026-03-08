'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Exercises } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { CheckCircle, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function ExercisePanel({ exercises, onExercisesComplete }: ExercisePanelProps) {
  const [fbAnswers, setFbAnswers] = useState<string[]>(Array(exercises.fillBlanks?.length ?? 0).fill(''));
  
  const matchingPairs = useMemo(() => exercises.matching ?? [], [exercises.matching]);
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

  useEffect(() => {
    if (selectedTarget && selectedNative) {
      const originalPair = matchingPairs.find(p => p.target === selectedTarget);
      if (originalPair && originalPair.native === selectedNative) {
        setMatches(prev => ({ ...prev, [selectedTarget]: selectedNative }));
        onExercisesComplete(true);
      } else {
        onExercisesComplete(false);
      }
      setTimeout(() => {
        setSelectedTarget(null);
        setSelectedNative(null);
      }, 300);
    }
  }, [selectedTarget, selectedNative, matchingPairs, onExercisesComplete]);

  const hasFillBlanks = Array.isArray(exercises.fillBlanks) && exercises.fillBlanks.length > 0;
  const hasMatching = Array.isArray(exercises.matching) && exercises.matching.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6"/>
            <span>Exercises</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={hasFillBlanks ? "fill-blanks" : "matching"} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fill-blanks" disabled={!hasFillBlanks}>Fill in the Blanks</TabsTrigger>
            <TabsTrigger value="matching" disabled={!hasMatching}>Matching</TabsTrigger>
          </TabsList>
          
          <TabsContent value="fill-blanks" className="mt-6">
            <div className="space-y-6">
              {exercises.fillBlanks?.map((ex, index) => (
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
                          onExercisesComplete(true);
                        }
                      }}
                    />
                  {fbAnswers[index] && fbAnswers[index].toLowerCase() === ex.answer.toLowerCase() && (
                     <p className="text-sm text-green-500 mt-1">Correct!</p>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="matching" className="mt-6">
              {matchingPairs.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <h4 className="font-semibold text-center text-muted-foreground">Target Language</h4>
                        {matchingTargets.map(target => (
                            <Button
                                key={target}
                                variant={matches[target] ? 'outline' : (selectedTarget === target ? 'default' : 'secondary')}
                                className={cn(matches[target] && "bg-green-500/20 border-green-500/50 text-foreground cursor-default", selectedTarget === target && "ring-2 ring-primary")}
                                disabled={!!matches[target]}
                                onClick={() => setSelectedTarget(target)}
                            >
                                {target}
                            </Button>
                        ))}
                    </div>
                    <div className="flex flex-col gap-2">
                         <h4 className="font-semibold text-center text-muted-foreground">Native Language</h4>
                        {matchingNatives.map(native => (
                            <Button
                                key={native}
                                variant={Object.values(matches).includes(native) ? 'outline' : (selectedNative === native ? 'default' : 'secondary')}
                                className={cn(Object.values(matches).includes(native) && "bg-green-500/20 border-green-500/50 text-foreground cursor-default", selectedNative === native && "ring-2 ring-primary")}
                                disabled={Object.values(matches).includes(native)}
                                onClick={() => setSelectedNative(native)}
                            >
                                {native}
                            </Button>
                        ))}
                    </div>
                </div>
              )}
              {Object.keys(matches).length === matchingPairs.length && matchingPairs.length > 0 && (
                <Alert className="mt-4 border-green-500/50 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  All pairs matched correctly!
                </Alert>
              )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
