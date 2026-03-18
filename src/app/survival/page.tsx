'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { UserProfile, UserWeekProgress } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { CheckCircle, Star, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { nativeLanguages, translations } from '@/lib/translations';
import { differenceInCalendarWeeks } from 'date-fns';

export default function SurvivalPathPage() {
  const { user, isUserLoading: isUserLoading } = useUser();
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

  const { unlockedWeeks, showUpgradeButton } = useMemo(() => {
    // Admin check
    if (user?.email === 'Pasan.lankathilakadpl@gmail.com') {
      return { unlockedWeeks: 12, showUpgradeButton: false };
    }

    let unlockedWeeks = 1;
    let showUpgradeButton = true;
    const now = new Date();

    if (userProfile) {
        const { subscriptionType, subscriptionStartDate, subscriptionExpiry } = userProfile;

        switch (subscriptionType) {
            case 'lifetime':
                unlockedWeeks = 12;
                showUpgradeButton = false; // No upgrade from lifetime
                break;
            case 'course':
                unlockedWeeks = 12;
                showUpgradeButton = true; // Can upgrade to lifetime
                break;
            case 'weekly':
                const startDate = subscriptionStartDate ? new Date(subscriptionStartDate) : null;
                const expiryDate = subscriptionExpiry ? new Date(subscriptionExpiry) : null;

                if (startDate && (!expiryDate || now < expiryDate)) {
                    // Active weekly subscription
                    const weeksPassed = differenceInCalendarWeeks(now, startDate, { weekStartsOn: 1 });
                    unlockedWeeks = Math.min(weeksPassed + 1, 12);
                }
                // If expired or invalid, defaults to 1 week
                break;
            case 'free':
            default:
                // Defaults to 1 week
                break;
        }
    }
    return { unlockedWeeks, showUpgradeButton };
  }, [userProfile, user]);

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

  if (!isMounted || isUserLoading || isProgressLoading || isProfileLoading) {
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
              const isLocked = week > unlockedWeeks;

              return (
                <AccordionItem key={week} value={`item-${week}`} disabled={isLocked}>
                  <AccordionTrigger className="text-lg hover:no-underline data-[disabled]:cursor-not-allowed">
                    <div className="flex w-full items-center justify-between pr-4">
                      <span className="flex items-center gap-3">
                         {isLocked ? <Lock className="h-5 w-5 text-muted-foreground" /> :
                          isWeekCompleted ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Star className="h-5 w-5 text-blue-400" />}
                         {t.week} {week}
                      </span>
                      
                      {!isLocked && !isWeekCompleted && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                            {completedDaysInWeek.length} / 7 {t.days}
                        </span>
                      )}
                      {!isLocked && isWeekCompleted && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-green-500">{t.completed}</span>
                      )}
                      {isLocked && (
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.locked}</span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {isLocked ? (
                        <div className="text-center p-4 bg-muted/50 rounded-md">
                            <p className="font-semibold">{t.lessonsLocked}</p>
                            <p className="text-sm text-muted-foreground mb-4">{t.upgradeToUnlock}</p>
                            {showUpgradeButton && (
                                <Button asChild>
                                    <Link href="/pricing">{t.upgradePlan}</Link>
                                </Button>
                            )}
                        </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {Array.from({ length: 7 }, (_, j) => j + 1).map((day) => {
                          return (
                            <Button asChild variant="secondary" key={day}>
                              <Link href={`/lessons/${targetLanguage.toLowerCase()}/survival/${week}/${day}`}>
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
