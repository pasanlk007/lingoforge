
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Volume2, CheckCircle, XCircle, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { TARGET_LANGUAGES } from '@/lib/constants';

type Exercise = {
  fillBlanks: any[];
  multipleChoice: any[];
  matching: any[];
  pronunciation: {
    listenAndRepeat: any[];
  }
};

interface AlphabetExercisePanelProps {
  exercises: Exercise;
  language: string;
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

export function AlphabetExercisePanel({ exercises, language, onExercisesComplete }: AlphabetExercisePanelProps) {
  const [fbAnswers, setFbAnswers] = useState<string[]>(Array(exercises.fillBlanks.length).fill(''));
  const [mcAnswers, setMcAnswers] = useState<(number | null)[]>(Array(exercises.multipleChoice.length).fill(null));
  
  const [matchingWords, setMatchingWords] = useState<any[]>([]);
  const [matchingMeanings, setMatchingMeanings] = useState<any[]>([]);
  
  useEffect(() => {
    setMatchingWords(shuffleArray(exercises.matching));
    setMatchingMeanings(shuffleArray(exercises.matching));
  }, [exercises.matching]);

  const [selectedWord, setSelectedWord] = useState<any | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<any | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});

  const langCode = TARGET_LANGUAGES.find(l => l.name === language)?.code || 'en-US';

  const speak = (text: string) => {
    if (typeof window.speechSynthesis === 'undefined') return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (selectedWord && selectedMeaning) {
      if (selectedWord.word === selectedMeaning.word) {
        setMatches(prev => ({ ...prev, [selectedWord.word]: selectedMeaning.meaning }));
        onExercisesComplete(true);
      } else {
        onExercisesComplete(false);
      }
      setTimeout(() => {
        setSelectedWord(null);
        setSelectedMeaning(null);
      }, 300);
    }
  }, [selectedWord, selectedMeaning, onExercisesComplete]);

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="fill-blanks">Fill Blanks</TabsTrigger>
            <TabsTrigger value="multiple-choice">Multiple Choice</TabsTrigger>
            <TabsTrigger value="matching">Matching</TabsTrigger>
            <TabsTrigger value="pronunciation">Pronunciation</TabsTrigger>
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
                    {ex.options.map((option: string, i: number) => (
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
                      <h4 className="font-semibold text-center text-muted-foreground">Word</h4>
                      {matchingWords.map(item => (
                          <Button
                              key={item.word}
                              variant={matches[item.word] ? 'outline' : (selectedWord?.word === item.word ? 'default' : 'secondary')}
                              className={cn(matches[item.word] && "bg-green-500/20 border-green-500/50 text-foreground cursor-default", selectedWord?.word === item.word && "ring-2 ring-primary")}
                              disabled={!!matches[item.word]}
                              onClick={() => setSelectedWord(item)}
                          >
                              {item.visual} {item.word}
                          </Button>
                      ))}
                  </div>
                  <div className="flex flex-col gap-2">
                       <h4 className="font-semibold text-center text-muted-foreground">Meaning</h4>
                      {matchingMeanings.map(item => (
                          <Button
                              key={item.meaning}
                              variant={Object.values(matches).includes(item.meaning) ? 'outline' : (selectedMeaning?.meaning === item.meaning ? 'default' : 'secondary')}
                              className={cn(Object.values(matches).includes(item.meaning) && "bg-green-500/20 border-green-500/50 text-foreground cursor-default", selectedMeaning?.meaning === item.meaning && "ring-2 ring-primary")}
                              disabled={Object.values(matches).includes(item.meaning)}
                              onClick={() => setSelectedMeaning(item)}
                          >
                              {item.meaning}
                          </Button>
                      ))}
                  </div>
              </div>
          </TabsContent>

          <TabsContent value="pronunciation" className="mt-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Listen & Repeat</h4>
              {exercises.pronunciation.listenAndRepeat.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold">{item.text}</p>
                      <p className="text-sm text-muted-foreground">{item.instruction}</p>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => speak(item.audioText)}>
                      <Volume2 />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
