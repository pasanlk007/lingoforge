'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Exercises } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExercisePanelProps {
  exercises: Exercises;
  onExercisesComplete: (isCorrect: boolean) => void;
}

// A helper function to shuffle arrays for the matching game
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function ExercisePanel({ exercises, onExercisesComplete }: ExercisePanelProps) {
  const [fbAnswers, setFbAnswers] = useState<string[]>(Array(exercises.fillBlanks.length).fill(''));
  const [mcAnswers, setMcAnswers] = useState<(number | null)[]>(Array(exercises.multipleChoice.length).fill(null));
  
  const [matchingTargets, setMatchingTargets] = useState<string[]>([]);
  const [matchingEnglishes, setMatchingEnglishes] = useState<string[]>([]);
  
  useEffect(() => {
    setMatchingTargets(shuffleArray(exercises.matching.map(p => p.target)));
    setMatchingEnglishes(shuffleArray(exercises.matching.map(p => p.english)));
  }, [exercises.matching]);

  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedEnglish, setSelectedEnglish] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedTarget && selectedEnglish) {
      const originalPair = exercises.matching.find(p => p.target === selectedTarget);
      if (originalPair && originalPair.english === selectedEnglish) {
        setMatches(prev => ({ ...prev, [selectedTarget]: selectedEnglish }));
        onExercisesComplete(true);
      } else {
        onExercisesComplete(false);
      }
      // Reset selection after a short delay to give feedback
      setTimeout(() => {
        setSelectedTarget(null);
        setSelectedEnglish(null);
      }, 300);
    }
  }, [selectedTarget, selectedEnglish, exercises.matching, onExercisesComplete]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6"/>
            <span>Exercises</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="fill-blanks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fill-blanks">Fill in the Blanks</TabsTrigger>
            <TabsTrigger value="multiple-choice">Multiple Choice</TabsTrigger>
            <TabsTrigger value="matching">Matching</TabsTrigger>
          </TabsList>
          
          <TabsContent value="fill-blanks" className="mt-6">
            <div className="space-y-6">
              {exercises.fillBlanks.map((ex, index) => (
                <div key={ex.id}>
                    <label className="text-sm text-muted-foreground" htmlFor={ex.id}>{ex.sentence.split('_____')[0]}<span className="font-bold text-foreground"> _____ </span>{ex.sentence.split('_____')[1]}</label>
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

          <TabsContent value="multiple-choice" className="mt-6">
            <div className="space-y-8">
              {exercises.multipleChoice.map((ex, index) => (
                <div key={ex.id}>
                  <p className="font-medium mb-3">{index + 1}. {ex.question}</p>
                  <RadioGroup
                    onValueChange={(val) => {
                      const newAnswers = [...mcAnswers];
                      const selectedIndex = parseInt(val, 10);
                      newAnswers[index] = selectedIndex;
                      setMcAnswers(newAnswers);
                      onExercisesComplete(selectedIndex === ex.correct);
                    }}
                    value={mcAnswers[index]?.toString()}
                  >
                    {ex.options.map((option, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <RadioGroupItem value={i.toString()} id={`${ex.id}-option-${i}`} />
                        <Label htmlFor={`${ex.id}-option-${i}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {mcAnswers[index] !== null && (
                     <Alert className={cn("mt-3 text-sm", mcAnswers[index] === ex.correct ? "border-green-500/50 text-green-700 dark:text-green-400" : "border-red-500/50 text-red-700 dark:text-red-500")}>
                       {mcAnswers[index] === ex.correct ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                       <AlertTitle className="font-bold">{mcAnswers[index] === ex.correct ? "Correct!" : "Not quite"}</AlertTitle>
                       <AlertDescription className="text-xs">
                        {ex.explanation}
                       </AlertDescription>
                     </Alert>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="matching" className="mt-6">
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
                       <h4 className="font-semibold text-center text-muted-foreground">English</h4>
                      {matchingEnglishes.map(english => (
                          <Button
                              key={english}
                              variant={Object.values(matches).includes(english) ? 'outline' : (selectedEnglish === english ? 'default' : 'secondary')}
                              className={cn(Object.values(matches).includes(english) && "bg-green-500/20 border-green-500/50 text-foreground cursor-default", selectedEnglish === english && "ring-2 ring-primary")}
                              disabled={Object.values(matches).includes(english)}
                              onClick={() => setSelectedEnglish(english)}
                          >
                              {english}
                          </Button>
                      ))}
                  </div>
              </div>
              {Object.keys(matches).length === exercises.matching.length && (
                <Alert className="mt-4 border-green-500/50 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle className="font-bold">Great job!</AlertTitle>
                  <AlertDescription className="text-xs">You've matched all the pairs.</AlertDescription>
                </Alert>
              )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
