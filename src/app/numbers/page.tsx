'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { UserProfile, UserWeekProgress } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { CheckCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { nativeLanguages, translations } from '@/lib/translations';

export default function NumbersPathPage() {
  const { user, isUserLoading: isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, "userProfiles", user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const progressCollectionRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'userProgress', user.uid, 'numbers');
  }, [user, firestore]);

  const { data: progressData, isLoading: isProgressLoading } = useCollection<UserWeekProgress>(progressCollectionRef);
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const nativeLanguage = userProfile?.nativeLanguage || (isMounted && localStorage.getItem('nativeLanguage')) || 'English';
  const targetLanguage = userProfile?.selectedLanguage || (isMounted && localStorage.getItem('targetLanguage')) || 'French';
  const validNativeLanguage = (nativeLanguages.includes(nativeLanguage as string)) ? nativeLanguage : 'English';
  const t = translations[validNativeLanguage as keyof typeof translations].ui || translations.English.ui;

  const totalWeeks = 12;

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
            <p className="mt-2 text-muted-foreground">A 12-week journey to master counting, time, and money.</p>
          </header>

          <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => {
              const completedDaysInWeek = completedDays[week] || [];
              const isWeekCompleted = completedDaysInWeek.length === 7;
              
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
                        return (
                          <Button asChild variant="secondary" key={day}>
                            <Link href={`/lessons/${targetLanguage.toLowerCase()}/numbers/${week}/${day}`}>
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
