'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { UserProfile, UserWeekProgress } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { Lock, CheckCircle, Sparkles, Star, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { translations } from '@/lib/translations';

export default function SurvivalPathPage() {
  const [targetLanguage, setTargetLanguage] = useState('French');
  const [nativeLanguage, setNativeLanguage] = useState<keyof typeof translations>('English');
  const [isMounted, setIsMounted] = useState(false);

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const isSuperAdmin = user?.email === 'Pasan.lankathilakadpl@gmail.com';

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const adminUserRef = useMemoFirebase(() => {
    if (!user || !firestore || isSuperAdmin) return null;
    return doc(firestore, 'adminUsers', user.uid);
  }, [user, firestore, isSuperAdmin]);
  const { data: adminUserData, isLoading: isAdminLoading } = useDoc(adminUserRef);
  const isAdmin = isSuperAdmin || !!adminUserData;

  const progressCollectionRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'userProgress', user.uid, 'survival');
  }, [user, firestore]);
  const { data: progressData } = useCollection<UserWeekProgress>(progressCollectionRef);
  
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

  const totalWeeks = 12;

  const isPaid = userProfile?.subscriptionType === 'monthly' || userProfile?.subscriptionType === 'yearly';
  
  const completedDays = useMemo(() => {
    if (!progressData) return {};
    const completedDaysMap: { [week: number]: number[] } = {};
    progressData.forEach(weekProgress => {
      completedDaysMap[weekProgress.week] = weekProgress.daysCompleted;
    });
    return completedDaysMap;
  }, [progressData]);

  if (!isMounted || isUserLoading || isProfileLoading || isAdminLoading) {
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
              const completedDaysInWeek = completedDays[week] || [];
              const isWeekCompleted = completedDaysInWeek.length === 7;
              
              let isWeekUnlocked = false;
              if (isAdmin || isPaid || week === 1) {
                isWeekUnlocked = true;
              }

              return (
                <AccordionItem key={week} value={`item-${week}`} disabled={!isWeekUnlocked}>
                  <AccordionTrigger className={cn("text-lg hover:no-underline", !isWeekUnlocked && "cursor-not-allowed text-muted-foreground/50")}>
                    <div className="flex w-full items-center justify-between pr-4">
                      <span className="flex items-center gap-3">
                         {!isWeekUnlocked ? <Lock className="h-4 w-4 text-muted-foreground/50" /> : (isWeekCompleted ? <CheckCircle className="h-5 w-5 text-green-500" /> : (isAdmin ? <Sparkles className="h-5 w-5 text-yellow-400" /> : <Star className="h-5 w-5 text-blue-400" />)) }
                         {t.week} {week}
                      </span>
                      
                      {!isWeekUnlocked && <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{t.locked}</span>}
                      
                      {isWeekUnlocked && !isWeekCompleted && (
                         isSuperAdmin ? (
                            <span className="text-xs font-semibold uppercase tracking-wider text-yellow-400">SUPER ADMIN</span>
                        ) : (
                          isAdmin ? (
                              <span className="text-xs font-semibold uppercase tracking-wider text-yellow-400">ADMIN</span>
                          ) : (
                              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                                  {completedDaysInWeek.length} / 7 {t.days}
                              </span>
                          )
                        )
                      )}
                      {isWeekUnlocked && isWeekCompleted && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-green-500">{t.completed}</span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {Array.from({ length: 7 }, (_, j) => j + 1).map((day) => {
                        const isDayCompleted = completedDaysInWeek.includes(day);
                        const sequentialAccess = day <= (completedDaysInWeek.length || 0) + 1;
                        
                        let isDayUnlocked = false;
                        if(isSuperAdmin) {
                          isDayUnlocked = true;
                        } else if (isAdmin || isPaid) {
                          isDayUnlocked = sequentialAccess;
                        } else if (week === 1) { // Free and Trial users
                          isDayUnlocked = sequentialAccess;
                        }

                        return (
                          <Button asChild variant={isDayCompleted ? "default" : "secondary"} key={day} className={cn(isDayCompleted && "bg-green-600 hover:bg-green-700")} disabled={!isDayUnlocked}>
                            <Link href={isDayUnlocked ? `/lessons/${targetLanguage.toLowerCase()}/survival/${week}/${day}` : '#'}>
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
