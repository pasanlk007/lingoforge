'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { UserWeekProgress } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { Lock, CheckCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { translations } from '@/lib/translations';

export default function NumbersPathPage() {
  const [targetLanguage, setTargetLanguage] = useState('French');
  const [nativeLanguage, setNativeLanguage] = useState<keyof typeof translations>('English');
  const [isMounted, setIsMounted] = useState(false);

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const progressCollectionRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'userProgress', user.uid, 'numbers');
  }, [user, firestore]);

  const { data: progressData, isLoading: isProgressLoading } = useCollection<UserWeekProgress>(progressCollectionRef);

  useEffect(() => {
    const savedTargetLang = localStorage.getItem('targetLanguage');
    if (savedTargetLang) {
      setTargetLanguage(savedTargetLang);
    }
    const savedNativeLang = localStorage.getItem('nativeLanguage') as keyof typeof translations;
    if (savedNativeLang && translations[savedNativeLang]) {
      setNativeLanguage(savedNativeLang);
    }
    setIsMounted(true);
  }, []);

  const t = (isMounted && translations[nativeLanguage]?.ui) ? translations[nativeLanguage].ui : translations.English.ui;

  const totalWeeks = 48;

  const completedDays = useMemo(() => {
    if (!progressData) return {};
    const completedDaysMap: { [week: number]: number[] } = {};
    progressData.forEach(weekProgress => {
      completedDaysMap[weekProgress.week] = weekProgress.daysCompleted;
    });
    return completedDaysMap;
  }, [progressData]);


  if (!isMounted || isUserLoading || isProgressLoading) {
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
            <h1 className="text-4xl font-bold tracking-tight">Numbers Path</h1>
            <p className="mt-2 text-muted-foreground">A 48-week journey to master counting, time, and money.</p>
          </header>

          <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => {
              const completedDaysInWeek = completedDays[week] || [];
              const isWeekCompleted = completedDaysInWeek.length === 7;
              
              const canOpenAccordion = true; // All lessons are unlocked

              return (
                <AccordionItem key={week} value={`item-${week}`}>
                  <AccordionTrigger className="text-lg hover:no-underline">
                    <div className="flex w-full items-center justify-between pr-4">
                      <span className="flex items-center gap-3">
                        {isWeekCompleted ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Star className="h-5 w-5 text-blue-400" />}
                        {t.week} {week}
                      </span>
                      
                      {!isWeekCompleted && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                            {completedDaysInWeek.length} / 7 {t.days}
                        </span>
                      )}
                      {isWeekCompleted && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-green-500">{t.completed}</span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {Array.from({ length: 7 }, (_, j) => j + 1).map((day) => {
                        const isDayCompleted = completedDaysInWeek.includes(day);
                        
                        // Simplified logic: Day is unlocked if previous day is completed.
                        const lastCompletedDay = Math.max(0, ...completedDaysInWeek);
                        const isDayUnlocked = day <= lastCompletedDay + 1;
                        
                        return (
                          <Button asChild variant={isDayCompleted ? "default" : "secondary"} key={day} className={cn(isDayCompleted && "bg-green-600 hover:bg-green-700")} disabled={!isDayUnlocked}>
                            <Link href={isDayUnlocked ? `/lessons/${targetLanguage.toLowerCase()}/numbers/${week}/${day}` : '#'}>
                              {isDayCompleted ? <CheckCircle className="mr-2 h-4 w-4"/> : (!isDayUnlocked && <Lock className="mr-2 h-4 w-4"/>)}
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
