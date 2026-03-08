'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle, ChevronLeft, ChevronRight, Speaker, Languages as LanguagesIcon } from 'lucide-react';
import type { LanguageLesson, LessonDay } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WordCard } from '@/components/WordCard';
import { DialoguePanel } from '@/components/DialoguePanel';
import { ExercisePanel } from '@/components/ExercisePanel';
import { StreakCounter } from '@/components/StreakCounter';
import { ProgressBar } from '@/components/ProgressBar';
import Confetti from 'react-dom-confetti';
import { SentenceScramblePanel } from './SentenceScramblePanel';
import { Separator } from './ui/separator';
import { translations } from '@/lib/translations';

interface LessonClientPageProps {
    lesson: LanguageLesson;
    currentDay: number;
}

const confettiConfig = {
  angle: 90, spread: 360, startVelocity: 40, elementCount: 70, dragFriction: 0.12,
  duration: 3000, stagger: 3, width: "10px", height: "10px", perspective: "500px",
  colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
};

export function LessonClientPage({ lesson, currentDay }: LessonClientPageProps) {
    const [nativeLanguage, setNativeLanguage] = useState<keyof typeof translations>('English');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const savedNativeLang = localStorage.getItem("nativeLanguage") as keyof typeof translations;
        if (savedNativeLang && translations[savedNativeLang]) {
          setNativeLanguage(savedNativeLang);
        }
        setIsMounted(true);
    }, []);

    const t = (isMounted && translations[nativeLanguage]?.ui) ? translations[nativeLanguage].ui : translations.English.ui;

    const dayData: LessonDay | undefined = lesson?.days?.[0];
    
    if (!dayData || !isMounted) {
        return (
          <div className="container mx-auto py-10">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Lesson data for Day {currentDay} could not be found in the provided lesson object.</AlertDescription>
            </Alert>
          </div>
        )
    }
    
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [dayCompleted, setDayCompleted] = useState(false);
    const [exercisesCorrect, setExercisesCorrect] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);

    const { words, dialogues, exercises, cultural_note, pronunciation_tip, progress } = dayData;

    const hasWords = Array.isArray(words) && words.length > 0;
    const hasDialogues = Array.isArray(dialogues) && dialogues.length > 0;
    const hasCulturalNote = typeof cultural_note === 'string' && cultural_note.trim() !== '';
    const hasPronunciationTip = typeof pronunciation_tip === 'string' && pronunciation_tip.trim() !== '';

    const hasExercises = exercises && (
      (Array.isArray(exercises.fillBlanks) && exercises.fillBlanks.length > 0) ||
      (Array.isArray(exercises.matching) && exercises.matching.length > 0)
    );
    const hasSentenceScramble = exercises && Array.isArray(exercises.sentenceScramble) && exercises.sentenceScramble.length > 0;

    const handleNextWord = () => {
        if (!hasWords) return;
        setCurrentWordIndex(prev => (prev + 1) % (words.length || 1));
    }

    const handlePrevWord = () => {
        if (!hasWords) return;
        setCurrentWordIndex(prev => (prev - 1 + (words.length || 1)) % (words.length || 1));
    }

    const handleExercisesComplete = (isCorrect: boolean) => {
        if (isCorrect) {
          setExercisesCorrect(prev => prev + 1);
        }
    }
    
    const handleCompleteDay = () => {
        setDayCompleted(true);
        setShowConfetti(true);
    }

    const totalExercises = (exercises?.fillBlanks?.length ?? 0) + (exercises?.matching?.length ?? 0) + (exercises?.sentenceScramble?.length ?? 0);
    const exerciseProgress = totalExercises > 0 ? Math.min((exercisesCorrect / totalExercises) * 100, 100) : 0;
    const canCompleteDay = exerciseProgress >= 50; // User must complete at least 50% of exercises

    const weekProgress = (currentDay / 7) * 100;

    return (
        <div className="container mx-auto max-w-3xl py-8 px-4">
            <header className="mb-6">
                <div className="flex items-center justify-between mb-4">
                     <Button variant="ghost" asChild>
                       <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> {t.dashboard}</Link>
                     </Button>
                     <div className="text-center">
                        <h1 className="font-bold text-lg">{dayData.title}</h1>
                        <p className="text-sm text-muted-foreground">{dayData.theme}</p>
                     </div>
                     <StreakCounter count={5} />
                </div>
                 <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{t.weekProgress}</span>
                        <ProgressBar value={weekProgress} />
                        <span className="text-sm font-semibold text-muted-foreground">{currentDay}/7</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{t.dayProgress}</span>
                        <ProgressBar value={exerciseProgress} />
                        <span className="text-sm font-semibold text-muted-foreground">{Math.floor(exerciseProgress)}%</span>
                    </div>
                </div>
            </header>

            <main className="space-y-8">
                
                {/* Vocabulary Section */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-6 w-6"/>{t.vocabulary}</CardTitle></CardHeader>
                    <CardContent>
                       {hasWords ? (
                           <div className="flex flex-col items-center">
                               <WordCard item={words[currentWordIndex]} language={lesson.language} />
                               <div className="flex items-center justify-center mt-2 w-full max-w-sm">
                                    <Button variant="outline" size="icon" onClick={handlePrevWord}><ChevronLeft /></Button>
                                    <span className="flex-1 text-center text-sm font-medium text-muted-foreground">{currentWordIndex + 1} / {words.length}</span>
                                    <Button variant="outline" size="icon" onClick={handleNextWord}><ChevronRight /></Button>
                               </div>
                           </div>
                       ) : <p className="text-center text-muted-foreground py-8">{t.noVocabulary}</p>}
                    </CardContent>
                </Card>
                
                {/* Dialogues Section */}
                {hasDialogues && Array.isArray(dialogues) && (
                    <DialoguePanel dialogues={dialogues} language={lesson.language} t={t} />
                )}

                {/* Exercises Section (Fill-in-the-blank, Matching) */}
                {hasExercises && exercises && (
                    <ExercisePanel exercises={exercises} onExercisesComplete={handleExercisesComplete} t={t} />
                )}

                {/* Sentence Scramble Exercise Section */}
                {hasSentenceScramble && exercises?.sentenceScramble && (
                    <SentenceScramblePanel exercises={exercises.sentenceScramble} onComplete={handleExercisesComplete} t={t} />
                )}
                
                {/* Notes Section */}
                {(hasPronunciationTip || hasCulturalNote) && (
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><LanguagesIcon className="h-6 w-6"/>{t.tipsAndCulture}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {hasPronunciationTip && (
                        <div>
                          <h4 className="font-semibold text-md mb-1 flex items-center gap-2"><Speaker className="h-5 w-5"/>{t.pronunciationTip}</h4>
                          <p className="text-muted-foreground italic">"{pronunciation_tip}"</p>
                        </div>
                      )}
                      {hasPronunciationTip && hasCulturalNote && <Separator />}
                      {hasCulturalNote && (
                        <div>
                          <h4 className="font-semibold text-md mb-1 flex items-center gap-2">🌍 {t.culturalNote}</h4>
                          <p className="text-muted-foreground italic">"{cultural_note}"</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                <section className="text-center py-6 flex flex-col items-center">
                    <div className="relative">
                        <div className="absolute -inset-20"><Confetti active={showConfetti} config={confettiConfig} /></div>
                        {dayCompleted ? (
                             <Alert className="border-green-500/50 text-green-700 dark:text-green-400">
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle className="font-bold">{t.dayComplete}</AlertTitle>
                                <AlertDescription className="text-xs">
                                  {t.earnedXP
                                    .replace('{xp}', progress?.xp.toString() ?? '0')
                                    .replace('{streak_bonus}', progress?.streak_bonus.toString() ?? '0')}
                                </AlertDescription>
                            </Alert>
                        ) : (
                             <Button size="lg" onClick={handleCompleteDay} disabled={!canCompleteDay}>
                                <CheckCircle className="mr-2 h-5 w-5" /> {t.completeDay.replace('{xp}', progress?.xp.toString() ?? '0')}
                            </Button>
                        )}
                        {!dayCompleted && !canCompleteDay && <p className="text-xs text-muted-foreground mt-2">{t.complete50Percent}</p>}
                    </div>
                </section>
            </main>
        </div>
    );
}
