'use client';
import VoiceInit from "@/components/VoiceInit";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle, ChevronLeft, ChevronRight, Speaker, Languages as LanguagesIcon } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import type { LanguageLesson, LessonDay, UserProfile, UserWeekProgress } from '@/lib/types';
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
import { translations, targetLanguages } from '@/lib/translations';
import { TooltipProvider } from './ui/tooltip';
import { differenceInCalendarDays } from 'date-fns';

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
    const [nativeLanguage, setNativeLanguage] = useState<keyof typeof translations>('English'
);
    const [isMounted, setIsMounted] = useState(false);
);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
);
    const [exercisesCorrect, setExercisesCorrect] = useState(0);
);
    const [isComplete, setIsComplete] = useState(false);
);

    const { user } = useUser(
);
    const firestore = useFirestore(
);

    const dayData: LessonDay | undefined = lesson?.days?.[0];

    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'userProfiles', user.uid
);
    }, [user, firestore]
);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef
);

    const weekProgressRef = useMemoFirebase(() => {
        if (!user || !firestore || !dayData) return null;
        return doc(firestore, 'userProgress', user.uid, dayData.path, `week_${dayData.week}`
);
    }, [user, firestore, dayData]
);
    const { data: weekProgressData } = useDoc<UserWeekProgress>(weekProgressRef
);

    const isDayCompleted = useMemo(() => {
        return weekProgressData?.daysCompleted?.includes(currentDay) || false;
    }, [weekProgressData, currentDay]
);


    useEffect(() => {
        const savedNativeLang = localStorage.getItem("nativeLanguage") as keyof typeof translations;
        if (savedNativeLang && translations[savedNativeLang]) {
          setNativeLanguage(savedNativeLang
);
        }
        setIsMounted(true
);
        setIsComplete(isDayCompleted
);
    }, [isDayCompleted]
);

    const handleExercisesComplete = useCallback((isCorrect: boolean) => {
        if (isCorrect) {
          setExercisesCorrect(prev => prev + 1
);
        }
    }, []
);

    const t = (isMounted && translations[nativeLanguage]?.ui) ? translations[nativeLanguage].ui : translations.English.ui;
    
    if (!dayData || !isMounted) {
        return (<>
  <VoiceInit />

          <div className="container mx-auto py-10">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Lesson data for Day {currentDay} could not be found in the provided lesson object.</AlertDescription>
            </Alert>
          </div>
        )
    }
    
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
        setCurrentWordIndex(prev => (prev + 1) % (words.length || 1)
);
    }

    const handlePrevWord = () => {
        if (!hasWords) return;
        setCurrentWordIndex(prev => (prev - 1 + (words.length || 1)) % (words.length || 1)
);
    }
    
    const handleCompleteDay = () => {
        if (!user || !firestore || !dayData || !weekProgressRef || !userProfileRef || !userProfile || isDayCompleted) return;

        setIsComplete(true
);

        // 1. Update week progress
        const currentCompletedDays = weekProgressData?.daysCompleted || [];
        const newCompletedDays = [...new Set([...currentCompletedDays, currentDay])];
        const weekData: Partial<UserWeekProgress> = {
            daysCompleted: newCompletedDays,
            path: dayData.path,
            week: dayData.week,
            weekCompleted: newCompletedDays.length === 7,
        };
        setDocumentNonBlocking(weekProgressRef, weekData, { merge: true }
);

        // 2. Update user profile (XP and Streak)
        const xpToAdd = (progress?.xp || 0) + (progress?.streak_bonus || 0
);
        const newXp = (userProfile.xpPoints || 0) + xpToAdd;
        
        let newStreak = userProfile.currentStreak || 0;
        const today = new Date(
);
        const lastActiveDate = new Date(userProfile.lastActiveDate
);
        const daysSinceLastActive = differenceInCalendarDays(today, lastActiveDate
);

        if (daysSinceLastActive > 0) {
            if (daysSinceLastActive === 1) {
                newStreak++;
            } else {
                newStreak = 1;
            }
        } else if (newStreak === 0) {
            newStreak = 1;
        }

        updateDocumentNonBlocking(userProfileRef, {
            xpPoints: newXp,
            currentStreak: newStreak,
            lastActiveDate: today.toISOString().split('T')[0],
            activePath: dayData.path,
            lastLessonWeek: dayData.week,
            lastLessonDay: currentDay
        }
);
    }

    const totalExercises = (exercises?.fillBlanks?.length ?? 0) + (exercises?.matching?.length ?? 0) + (exercises?.sentenceScramble?.length ?? 0
);
    const exerciseProgress = totalExercises > 0 ? Math.min((exercisesCorrect / totalExercises) * 100, 100) : 100; // default to 100 if no exercises
    const canCompleteDay = exerciseProgress >= 50;

    const weekProgress = (currentDay / 7) * 100;
    const streakCount = userProfile?.currentStreak || 0;
    
    const langInfo = targetLanguages.find(l => l.lang.toLowerCase() === lesson.language.toLowerCase()
);
    const flag = langInfo ? langInfo.flag : '🌍';

    return (<>
  <VoiceInit />

        <TooltipProvider>
            <div className="container mx-auto max-w-3xl py-8 px-4">
                <header className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                         <Button variant="ghost" asChild>
                           <Link href={`/${dayData.path}`}><ArrowLeft className="mr-2 h-4 w-4" /> {t.backToDashboard}</Link>
                         </Button>
                         <div className="text-center">
                            <h1 className="font-bold text-lg">{dayData.title}</h1>
                            <p className="text-sm text-muted-foreground">{dayData.theme}</p>
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="text-3xl">{flag}</span>
                           <StreakCounter count={streakCount} />
                         </div>
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
                    {hasWords && (
                      <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-6 w-6"/>{t.vocabulary}</CardTitle></CardHeader>
                        <CardContent>
                          <div className="flex flex-col items-center">
                              <WordCard item={words[currentWordIndex]} language={lesson.language} />
                              <div className="flex items-center justify-center mt-2 w-full max-w-sm">
                                    <Button variant="outline" size="icon" onClick={handlePrevWord}><ChevronLeft /></Button>
                                    <span className="flex-1 text-center text-sm font-medium text-muted-foreground">{currentWordIndex + 1} / {words.length}</span>
                                    <Button variant="outline" size="icon" onClick={handleNextWord}><ChevronRight /></Button>
                              </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
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
                            <div className="absolute -inset-20"><Confetti active={isComplete} config={confettiConfig} /></div>
                            {isComplete ? (
                                <div>
                                 <Alert className="border-green-500/50 text-green-700 dark:text-green-400">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertTitle className="font-bold">{t.dayComplete}</AlertTitle>
                                    <AlertDescription className="text-xs">
                                      {t.earnedXP
                                        .replace('{xp}', progress?.xp.toString() ?? '0')
                                        .replace('{streak_bonus}', progress?.streak_bonus.toString() ?? '0')}
                                    </AlertDescription>
                                </Alert>
                                <Button className="w-full mt-3" onClick={() => (window.location.href = "/dashboard")}>
                                  Go to Dashboard
                                </Button>
                                </div>
                            ) : (
                                 <Button size="lg" onClick={handleCompleteDay} disabled={!canCompleteDay || !userProfile}>
                                    <CheckCircle className="mr-2 h-5 w-5" /> {t.completeDay.replace('{xp}', progress?.xp.toString() ?? '0')}
                                 </Button>
                            )}
                            {!isComplete && !canCompleteDay && <p className="text-xs text-muted-foreground mt-2">{t.complete50Percent}</p>}
                        </div>
                    </section>
                </main>
            </div>
        </TooltipProvider>
    
);
}
