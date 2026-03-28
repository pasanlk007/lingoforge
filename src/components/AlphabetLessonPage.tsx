'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import type { LessonDay, UserProfile, UserWeekProgress } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WordCard } from '@/components/WordCard';
import { StreakCounter } from '@/components/StreakCounter';
import Confetti from 'react-dom-confetti';
import { translations, targetLanguages } from '@/lib/translations';
import { differenceInCalendarDays } from 'date-fns';
import { WritingPractice } from './WritingPractice';
import { AudioPlayback } from './AudioPlayback';
import { Alert, AlertTitle } from './ui/alert';
import { TooltipProvider } from './ui/tooltip';

interface AlphabetLessonPageProps {
  dayData: LessonDay;
  targetLanguage: string;
}

const confettiConfig = {
  angle: 90, spread: 360, startVelocity: 40, elementCount: 70, dragFriction: 0.12,
  duration: 3000, stagger: 3, width: "10px", height: "10px", perspective: "500px",
  colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
};

export function AlphabetLessonPage({ dayData, targetLanguage }: AlphabetLessonPageProps) {
  const [nativeLanguage, setNativeLanguage] = useState<keyof typeof translations>('English');
  const [isMounted, setIsMounted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const weekProgressRef = useMemoFirebase(() => {
    if (!user || !firestore || !dayData) return null;
    return doc(firestore, 'userProgress', user.uid, dayData.path, `week_${dayData.week}`);
  }, [user, firestore, dayData]);
  const { data: weekProgressData } = useDoc<UserWeekProgress>(weekProgressRef);

  const isDayCompleted = weekProgressData?.daysCompleted?.includes(dayData.day) || false;

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
    if (!user || !firestore || !dayData || !weekProgressRef || !userProfileRef || !userProfile || isDayCompleted) return;

    setIsComplete(true);

    const xpToAdd = (dayData.progress?.xp || 0) + (dayData.progress?.streak_bonus || 0);
    const newXp = (userProfile.xpPoints || 0) + xpToAdd;

    let newStreak = userProfile.currentStreak || 0;
    const today = new Date();
    const lastActiveDate = new Date(userProfile.lastActiveDate);
    const daysSinceLastActive = differenceInCalendarDays(today, lastActiveDate);

    if (daysSinceLastActive > 0) {
        if (daysSinceLastActive === 1) {
            newStreak++;
        } else {
            newStreak = 1;
        }
    } else if (newStreak === 0) {
        newStreak = 1;
    }

    // Update User Profile
    updateDocumentNonBlocking(userProfileRef, {
      xpPoints: newXp,
      currentStreak: newStreak,
      lastActiveDate: today.toISOString().split('T')[0],
      activePath: dayData.path,
      lastLessonWeek: dayData.week,
      lastLessonDay: dayData.day
    });

    // Update Week Progress
    const currentCompletedDays = weekProgressData?.daysCompleted || [];
    const newCompletedDays = [...new Set([...currentCompletedDays, dayData.day])];
    const weekData: Partial<UserWeekProgress> = {
      daysCompleted: newCompletedDays,
      path: dayData.path,
      week: dayData.week,
      weekCompleted: newCompletedDays.length === 7, // This might need adjustment for alphabet path
    };
    setDocumentNonBlocking(weekProgressRef, weekData, { merge: true });
  }
  
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
              <h1 className="font-bold text-lg">{dayData.title}</h1>
              <p className="text-sm text-muted-foreground">{dayData.theme}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">{flag}</span>
              <StreakCounter count={userProfile?.currentStreak || 0} />
            </div>
          </div>
        </header>

        <main className="space-y-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-8xl font-bold">{dayData.letter}</CardTitle>
                {dayData.letter && <AudioPlayback text={dayData.letter} languageName={targetLanguage} />}
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
                  <div className="absolute -inset-20"><Confetti active={isComplete} config={confettiConfig} /></div>
                  {isComplete ? (
                      <Alert className="border-green-500/50 text-green-700 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <AlertTitle className="font-bold">{t.dayComplete}</AlertTitle>
                      </Alert>
                  ) : (
                      <Button size="lg" onClick={handleCompleteDay} disabled={!userProfile}>
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
