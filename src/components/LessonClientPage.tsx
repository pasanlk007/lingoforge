
'use client';
import VoiceInit from "@/components/VoiceInit";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle, ChevronLeft, ChevronRight, Speaker, Languages as LanguagesIcon } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { arrayUnion, type DocumentData, type DocumentReference, increment } from 'firebase/firestore';
import type { LanguageLesson, LessonDay, UserProfile } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WordCard } from '@/components/WordCard';
import { DialoguePanel } from '@/components/DialoguePanel';
import { ExercisePanel } from '@/components/ExercisePanel';
import { StreakCounter } from '@/components/StreakCounter';
import { ProgressBar } from '@/components/ProgressBar';
import dynamic from 'next/dynamic';
import { SentenceScramblePanel } from './SentenceScramblePanel';
import { Separator } from './ui/separator';
import { translations, targetLanguages } from '@/lib/translations';
import { TooltipProvider } from './ui/tooltip';
import { format as formatDate } from 'date-fns';

const Confetti = dynamic(() => import('react-dom-confetti'), { ssr: false });

interface LessonClientPageProps {
    lesson: LanguageLesson;
    currentDay: number;
    userProfile: UserProfile | null;
    userProfileRef: DocumentReference<DocumentData> | null;
}

const confettiConfig = {
  angle: 90, spread: 360, startVelocity: 40, elementCount: 70, dragFriction: 0.12,
  duration: 3000, stagger: 3, width: "10px", height: "10px", perspective: "500px",
  colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
};

export function LessonClientPage({ lesson, currentDay, userProfile, userProfileRef }: LessonClientPageProps) {
    const [nativeLanguage, setNativeLanguage] = useState<keyof typeof translations>('English');
    const [isMounted, setIsMounted] = useState(false);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    const dayData: LessonDay | undefined = lesson?.days?.[0];

    const dayKey = useMemo(() => dayData ? `${dayData.week}-${currentDay}` : '', [dayData, currentDay]);
    
    const isDayCompleted = useMemo(() => {
        if (!userProfile || !dayData) return false;
        const langKey = lesson.language.toLowerCase();
        const pathKey = dayData.path;
        return userProfile.languageProgress?.[langKey]?.[pathKey]?.completedDays?.includes(dayKey) || false;
    }, [userProfile, dayData, dayKey, lesson.language]);


    useEffect(() => {
      const savedNativeLang = localStorage.getItem("nativeLanguage") as keyof typeof translations;
      if (savedNativeLang && translations[savedNativeLang]) {
        setNativeLanguage(savedNativeLang);
      }
      setIsMounted(true);
      if (isDayCompleted) {
        setIsComplete(true);
      }
    }, [isDayCompleted]);

    const t = (isMounted && translations[nativeLanguage]?.ui)
      ? translations[nativeLanguage].ui
      : translations.English.ui;
    
    const t_dashboard = (isMounted && translations[nativeLanguage]?.dashboard)
      ? translations[nativeLanguage].dashboard
      : translations.English.dashboard;

    
    if (!dayData || !isMounted) {
      return (
        <div>
          <VoiceInit />
          <div className="container mx-auto py-10">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Lesson data for Day {currentDay} could not be found in the provided lesson object.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
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
        setCurrentWordIndex(prev => (prev + 1) % (words.length || 1));
    };

    const handlePrevWord = () => {
        if (!hasWords) return;
        setCurrentWordIndex(prev => (prev - 1 + (words.length || 1)) % (words.length || 1));
    };
    
    const handleCompleteDay = () => {
        if (!userProfileRef || !dayData || isComplete) return;

        setIsComplete(true);

        const langKey = lesson.language.toLowerCase();
        const pathKey = dayData.path;
        const dayKeyToSave = `${dayData.week}-${currentDay}`;
        const todayKey = formatDate(new Date(), 'yyyy-MM-dd');

        const updateData: any = {
          [`languageProgress.${langKey}.${pathKey}.completedDays`]: arrayUnion(dayKeyToSave),
          [`languageProgress.${langKey}.${pathKey}.lastWeek`]: dayData.week,
          [`languageProgress.${langKey}.${pathKey}.lastDay`]: currentDay,
          xpPoints: increment(100),
          [`dailyXpLog.${todayKey}`]: increment(100),
          lastActiveDate: todayKey,
          activePath: pathKey,
        };

        // Award streak if first lesson of the day
        if (userProfile?.lastActiveDate !== todayKey) {
            updateData.currentStreak = increment(1);
        }

        // Permanent week unlock logic for Course plan users
        if (currentDay === 7 && userProfile?.subscriptionPlan === 'course') {
            const contentKey = `${langKey}_${pathKey}`; 
            const nextWeekNum = dayData.week + 1;
            updateData[`unlockedContent.${contentKey}`] = arrayUnion(nextWeekNum);
        }

        console.log('[XP] Writing update:', JSON.stringify(Object.keys(updateData)));
        updateDocumentNonBlocking(userProfileRef, updateData);
        console.log('[XP] Update dispatched for user:', userProfileRef?.id);
    };
    
    const weekProgress = (currentDay / 7) * 100;
    const streakCount = userProfile?.currentStreak || 0;
    
    const langInfo = targetLanguages.find(l => l.lang.toLowerCase() === lesson.language.toLowerCase());
    const flag = langInfo ? langInfo.flag : '🌍';

    const nextDay = currentDay < 7 ? currentDay + 1 : 1;
    const nextWeek = currentDay < 7 ? dayData.week : dayData.week + 1;
    const nextLessonUrl = `/lessons/${lesson.language.toLowerCase()}/${lesson.path}/${nextWeek}/${nextDay}`;

    return (
      <>
        <VoiceInit />
        <TooltipProvider>
            <div className="container mx-auto max-w-3xl py-8 px-4 pb-24">
                <header className="mb-6">
                    <div className="flex items-center justify-between mb-4 gap-2 overflow-hidden">
                         <Button variant="outline" size="icon" asChild className="shrink-0">
                           <Link href={`/${dayData.path}`}><ArrowLeft className="h-4 w-4" /></Link>
                         </Button>
                         <div className="text-center flex-1 min-w-0">
                            <h1 className="font-bold text-sm leading-tight text-center line-clamp-1">
                              {dayData.title}
                              {isComplete && <CheckCircle className="h-5 w-5 text-green-500" />}
                            </h1>
                            <p className="text-sm text-muted-foreground">{dayData.theme}</p>
                         </div>

                    </div>
                     <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{t.weekProgress}</span>
                            <ProgressBar value={weekProgress} />
                            <span className="text-sm font-semibold text-muted-foreground">{currentDay}/7</span>
                        </div>
                    </div>
                </header>

                <main className="space-y-8">
                    
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
                    
                    {hasDialogues && Array.isArray(dialogues) && (
                        <DialoguePanel dialogues={dialogues} language={lesson.language} t={t} />
                    )}

                    {hasExercises && exercises && (
                        <ExercisePanel exercises={exercises} onExercisesComplete={() => {}} t={t} />
                    )}

                    {hasSentenceScramble && exercises?.sentenceScramble && (
                        <SentenceScramblePanel exercises={exercises.sentenceScramble} onComplete={() => {}} t={t} />
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
                            <div className="absolute -inset-20 pointer-events-none"><Confetti active={isComplete} config={confettiConfig} /></div>
                            {isComplete ? (
                                <div className="w-full max-w-xs">
                                    <Alert className="border-green-500/50 text-green-700 dark:text-green-400">
                                        <CheckCircle className="h-4 w-4" />
                                        <AlertTitle className="font-bold">{t.dayComplete}</AlertTitle>
                                    </Alert>
                                    <div className="mt-4 grid grid-cols-1 gap-2">
                                        <Button asChild className="w-full">
                                            <Link href={nextLessonUrl}>
                                                {t_dashboard.goToNextLesson} <ChevronRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button variant="outline" asChild className="w-full">
                                            <Link href="/dashboard">
                                                {t.backToDashboard}
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                 <Button size="lg" onClick={handleCompleteDay}>
                                    <CheckCircle className="mr-2 h-5 w-5" /> Complete Day
                                 </Button>
                            )}
                        </div>
                    </section>
                </main>
            </div>
        </TooltipProvider>
      </>
    );
}
