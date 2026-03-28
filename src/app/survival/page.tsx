'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { UserProfile, UserWeekProgress } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { CheckCircle, Star, Lock, Construction, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { nativeLanguages, translations } from '@/lib/translations';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useFreeTrial } from '@/hooks/useFreeTrial';
import { canAccessLesson } from '@/lib/accessControl';

export default function SurvivalPathPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, "userProfiles", user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const progressCollectionRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'userProgress', user.uid, 'survival');
  }, [user, firestore]);

  const { data: progressData, isLoading: isProgressLoading } = useCollection<UserWeekProgress>(progressCollectionRef);
  
  const [isMounted, setIsMounted] = useState(false);
  const { config, isLoading: isConfigLoading } = useAppConfig();
  const { trialDaysUsed, isTrialLoading } = useFreeTrial(userProfile);

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

  if (isMounted && nativeLanguage === 'English' && targetLanguage === 'English') {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1 container mx-auto max-w-3xl py-12 px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight">Invalid Language Selection</h1>
            <p className="mt-4 text-lg text-muted-foreground">
                You cannot learn a language that is also set as your native language. Please select a different target language from your dashboard.
            </p>
            <Button asChild className="mt-6"><Link href="/dashboard">Back to Dashboard</Link></Button>
        </main>
      </div>
    );
  }

  if (!isMounted || isUserLoading || isProgressLoading || isProfileLoading || isConfigLoading || isTrialLoading) {
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

  if (config?.app_mode === 'maintenance') {
    return (
       <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1 container mx-auto max-w-3xl py-12 px-4 text-center">
            <Construction className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
            <h1 className="text-4xl font-bold tracking-tight">Under Maintenance</h1>
            <p className="mt-2 text-muted-foreground">LingoForge is currently undergoing maintenance. Please check back later.</p>
        </main>
      </div>
    )
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
              
              const weekIsEnabled = (config?.lessons_weeks_enabled as Record<string, boolean>)?.[`week${week}`] !== false;
              
              const accessResult = canAccessLesson({
                path: 'survival',
                week,
                day: 1, // Check access for the first day of the week
                language: targetLanguage,
                userEmail: user?.email,
                profile: userProfile || null,
                trialDaysUsed,
              });
              const hasAccess = accessResult.allowed;
              
              const isLocked = weekIsEnabled && !hasAccess;
              const isComingSoon = !weekIsEnabled;

              return (
                <AccordionItem key={week} value={`item-${week}`} disabled={isLocked || isComingSoon}>
                  <AccordionTrigger className="text-lg hover:no-underline data-[disabled]:cursor-not-allowed">
                    <div className="flex w-full items-center justify-between pr-4">
                      <span className="flex items-center gap-3">
                         {isLocked || isComingSoon ? <Lock className="h-5 w-5 text-muted-foreground" /> :
                          isWeekCompleted ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Star className="h-5 w-5 text-blue-400" />}
                         {t.week} {week}
                      </span>
                      
                      {!isLocked && !isComingSoon && !isWeekCompleted && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                            {completedDaysInWeek.length} / 7 {t.days}
                        </span>
                      )}
                      {!isLocked && !isComingSoon && isWeekCompleted && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-green-500">{t.completed}</span>
                      )}
                      {isLocked && (
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.locked}</span>
                      )}
                       {isComingSoon && (
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coming Soon</span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {isComingSoon ? (
                        <div className="text-center p-4 bg-muted/50 rounded-md">
                            <p className="font-semibold">Coming Soon!</p>
                            <p className="text-sm text-muted-foreground mb-4">New lessons for this week are being prepared.</p>
                        </div>
                    ) : isLocked ? (
                        <div className="text-center p-4 bg-muted/50 rounded-md">
                            <p className="font-semibold">{t.lessonsLocked}</p>
                            <p className="text-sm text-muted-foreground mb-4">{t.upgradeToUnlock}</p>
                            <Button asChild>
                                <Link href="/pricing">{t.upgradePlan}</Link>
                            </Button>
                        </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {Array.from({ length: 7 }, (_, j) => j + 1).map((day) => {
                          const isDayCompleted = completedDaysInWeek.includes(day);
                          return (
                            <Button asChild variant="secondary" key={day} className={cn(isDayCompleted && 'bg-green-600 text-white hover:bg-green-700')}>
                              <Link href={`/lessons/${targetLanguage.toLowerCase()}/survival/${week}/${day}`}>
                                {isDayCompleted && <Check className="mr-1 h-4 w-4" />}
                                {`${t.day} ${day}`}
                              </Link>
                            </Button>
                          )
                        })}
                      </div>
                    )}
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
