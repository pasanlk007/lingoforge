'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle } from 'lucide-react';
import { updateDocumentNonBlocking } from '@/firebase';
import { arrayUnion, type DocumentData, type DocumentReference } from 'firebase/firestore';
import type { LessonDay, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WordCard } from '@/components/WordCard';
import { StreakCounter } from '@/components/StreakCounter';
import dynamic from 'next/dynamic';
import { translations, targetLanguages } from '@/lib/translations';
import { WritingPractice } from './WritingPractice';
import { AudioPlayback } from './AudioPlayback';
import { Alert, AlertTitle } from './ui/alert';
import { TooltipProvider } from './ui/tooltip';
import { cn } from '@/lib/utils';

const Confetti = dynamic(() => import('react-dom-confetti'), { ssr: false });

interface AlphabetLessonPageProps {
  dayData: LessonDay;
  targetLanguage: string;
  userProfile: UserProfile | null;
  userProfileRef: DocumentReference<DocumentData> | null;
}

const confettiConfig = {
  angle: 90, spread: 360, startVelocity: 40, elementCount: 70, dragFriction: 0.12,
  duration: 3000, stagger: 3, width: "10px", height: "10px", perspective: "500px",
  colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
};

export function AlphabetLessonPage({ dayData, targetLanguage, userProfile, userProfileRef }: AlphabetLessonPageProps) {
  const [nativeLanguage, setNativeLanguage] = useState<keyof typeof translations>('English');
  const [isMounted, setIsMounted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const dayKey = useMemo(() => `${dayData.week}-${dayData.day}`, [dayData]);

  const isDayCompleted = useMemo(() => {
    if (!userProfile) return false;
    const langKey = targetLanguage.toLowerCase();
    const pathKey = dayData.path;
    return userProfile.languageProgress?.[langKey]?.[pathKey]?.completedDays?.includes(dayKey) || false;
  }, [userProfile, targetLanguage, dayData, dayKey]);

  useEffect(() => {
    const savedNativeLang = localStorage.getItem("nativeLanguage") as keyof typeof translations;
    if (savedNativeLang && translations[savedNativeLang]) {
      setNativeLanguage(savedNativeLang);
    }
    setIsMounted(true);
    if(isDayCompleted) {
      setIsComplete(true);
    }
  }, [isDayCompleted]);

  const t = (isMounted && translations[nativeLanguage]?.ui) ? translations[nativeLanguage].ui : translations.English.ui;

  const handleCompleteDay = () => {
    if (isComplete) return;

    setIsComplete(true);
    
    const langKey = targetLanguage.toLowerCase();
    const pathKey = dayData.path;
    const dayKeyToSave = `${dayData.week}-${dayData.day}`;

    updateDocumentNonBlocking(userProfileRef, {
        [`languageProgress.${langKey}.${pathKey}.completedDays`]: arrayUnion(dayKeyToSave),
        [`languageProgress.${langKey}.${pathKey}.lastWeek`]: dayData.week,
        [`languageProgress.${langKey}.${pathKey}.lastDay`]: dayData.day,
    });
  };
  
  if (!dayData || !isMounted) {
    return null;
  }
  
  const writingExercise = dayData.exercises.writingPractice?.[0];

  const langInfo = targetLanguages.find(l => l.lang.toLowerCase() === targetLanguage.toLowerCase());
  const flag = langInfo ? langInfo.flag : '🌍';

  return (
    <TooltipProvider>
      <div className="container mx-auto max-w-3xl py-8 px-4">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" asChild>
              <Link href={`/${dayData.path}`}><ArrowLeft className="mr-2 h-4 w-4" /> {t.backToDashboard}</Link>
            </Button>
            <div className="text-center">
              <h1 className="font-bold text-lg flex items-center gap-2">
                {dayData.title}
                {isComplete && <CheckCircle className="h-5 w-5 text-green-500" />}
              </h1>
              <p className="text-sm text-muted-foreground">{dayData.theme}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">{flag}</span>
              <StreakCounter count={userProfile?.currentStreak || 0} />
            </div>
          </div>
        </header>

        <main className="space-y-8">
          <Card className={cn(isComplete && "border-2 border-green-500/50 bg-green-900/20")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-8xl font-bold">{dayData.letter}</CardTitle>
                 {isComplete ? (
                    <CheckCircle className="h-12 w-12 text-green-500" />
                ) : (
                    dayData.letter && <AudioPlayback text={dayData.letter} languageName={targetLanguage} />
                )}
              </div>
            </CardHeader>
            {dayData.pronunciation_tip && (
              <CardContent>
                  <p className="text-muted-foreground italic">"{dayData.pronunciation_tip}"</p>
              </CardContent>
            )}
          </Card>

          {dayData.words && dayData.words.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-6 w-6"/>Example Word</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <WordCard item={dayData.words[0]} language={targetLanguage} />
                </div>
              </CardContent>
            </Card>
          )}
          
          {writingExercise && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2">✍️ Writing Practice</CardTitle></CardHeader>
              <CardContent>
                  <p className="text-center text-muted-foreground mb-4">Trace the letter below</p>
                  <WritingPractice letter={writingExercise.letter} />
              </CardContent>
            </Card>
          )}

          <section className="text-center py-6 flex flex-col items-center">
              <div className="relative">
                  <div className="absolute -inset-20 pointer-events-none"><Confetti active={isComplete} config={confettiConfig} /></div>
                  {isComplete ? (
                      <Alert className="border-green-500/50 text-green-700 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <AlertTitle className="font-bold">{t.dayComplete}</AlertTitle>
                      </Alert>
                  ) : (
                      <Button size="lg" onPointerUp={handleCompleteDay} onTouchEnd={(e) => { e.preventDefault(); handleCompleteDay(); }}>
                          <CheckCircle className="mr-2 h-5 w-5" /> Complete Letter
                      </Button>
                  )}
              </div>
          </section>

        </main>
      </div>
    </TooltipProvider>
  )
}
