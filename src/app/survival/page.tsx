'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { UserWeekProgress } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { Lock, CheckCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { translations } from '@/lib/translations';

export default function SurvivalPathPage() {
  const [targetLanguage, setTargetLanguage] = useState('french');
  const [nativeLanguage, setNativeLanguage] = useState<keyof typeof translations>('English');
  const [isMounted, setIsMounted] = useState(false);

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Check for admin privileges
  const adminUserRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'adminUsers', user.uid);
  }, [user, firestore]);
  const { data: adminUserData, isLoading: isAdminLoading } = useDoc(adminUserRef);
  const isAdmin = !!adminUserData;

  const progressCollectionRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'userProgress', user.uid, 'survival');
  }, [user, firestore]);

  const { data: progressData, isLoading: isProgressLoading } = useCollection<UserWeekProgress>(progressCollectionRef);

  useEffect(() => {
    const savedTargetLang = localStorage.getItem('targetLanguage');
    if (savedTargetLang) {
      setTargetLanguage(savedTargetLang.toLowerCase());
    }
    const savedNativeLang = localStorage.getItem('nativeLanguage') as keyof typeof translations;
    if (savedNativeLang && translations[savedNativeLang]) {
      setNativeLanguage(savedNativeLang);
    }
    setIsMounted(true);
  }, []);

  const t = (isMounted && translations[nativeLanguage]?.ui) ? translations[nativeLanguage].ui : translations.English.ui;

  const totalWeeks = 12;

  // Determine unlocked weeks and completed days from Firestore data
  const { unlockedWeeks, completedDays } = useMemo(() => {
    if (!progressData) {
      return { unlockedWeeks: 1, completedDays: {} };
    }
    const completedDaysMap: { [week: number]: number[] } = {};
    let maxUnlockedWeek = 1;

    progressData.forEach(weekProgress => {
      completedDaysMap[weekProgress.week] = weekProgress.daysCompleted;
      if (weekProgress.daysCompleted.length === 7) { // Only unlock next week if current is fully complete
        maxUnlockedWeek = Math.max(maxUnlockedWeek, weekProgress.week + 1);
      } else if (weekProgress.daysCompleted.length > 0) {
        maxUnlockedWeek = Math.max(maxUnlockedWeek, weekProgress.week);
      }
    });

    return { unlockedWeeks: maxUnlockedWeek, completedDays: completedDaysMap };
  }, [progressData]);

  if (!isMounted || isUserLoading || isProgressLoading || isAdminLoading) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1 container mx-auto max-w-3xl py-12 px-4 space-y-4">
            <Skeleton className="h-10 w-1/2 mx-auto" />
            <Skeleton className="h-6 w-3/4 mx-auto" />
            <div className="mt-8 space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full opacity-70" />
                <Skeleton className="h-14 w-full opacity-70" />
                <Skeleton className="h-14 w-full opacity-70" />
            </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl py-12 px-4">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight">{t.survivalPath}</h1>
            <p className="mt-2 text-muted-foreground">{t.survivalPathDesc}</p>
          </header>

          <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => {
              const isUnlocked = isAdmin || week <= unlockedWeeks;
              const completedDaysInWeek = completedDays[week] || [];
              const isCompleted = completedDaysInWeek.length === 7;
              
              return (
                <AccordionItem key={week} value={`item-${week}`} disabled={!isUnlocked}>
                  <AccordionTrigger className={cn("text-lg hover:no-underline", !isUnlocked && "cursor-not-allowed text-muted-foreground/50")}>
                    <div className="flex w-full items-center justify-between pr-4">
                      <span className="flex items-center gap-3">
                         {!isUnlocked ? <Lock className="h-4 w-4 text-muted-foreground/50" /> : (isCompleted ? <CheckCircle className="h-5 w-5 text-green-500" /> : (isAdmin ? <Sparkles className="h-5 w-5 text-yellow-400" /> : <div className="w-5 h-5" />)) }
                         {t.week} {week}
                      </span>
                      {!isUnlocked && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                          {t.locked}
                        </span>
                      )}
                       {isUnlocked && !isCompleted && (
                        isAdmin ? (
                            <span className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
                                ADMIN
                            </span>
                        ) : (
                            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                                {completedDaysInWeek.length} / 7 {t.days}
                            </span>
                        )
                      )}
                      {isUnlocked && isCompleted && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-green-500">
                          {t.completed}
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {Array.from({ length: 7 }, (_, j) => j + 1).map((day) => {
                        const isDayCompleted = completedDaysInWeek.includes(day);
                        return (
                          <Button asChild variant={isDayCompleted ? "default" : "secondary"} key={day} className={cn(isDayCompleted && "bg-green-600 hover:bg-green-700")}>
                            <Link href={`/lessons/${targetLanguage}/survival/${week}/${day}`}>
                              {isDayCompleted && <CheckCircle className="mr-2 h-4 w-4"/>}
                              {`${t.day} ${day}`}
                            </Link>
                          </Button>
                        )
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </main>
    </div>
  );
}
