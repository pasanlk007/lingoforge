'use client';

import React, { useState, useEffect, useMemo } from "react";
import Link from 'next/link';
import {
  Flame,
  Star,
  Zap,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Target,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { PathCard } from '@/components/PathCard';
import { PATHS } from '@/lib/constants';
import { cn } from "@/lib/utils";
import { nativeLanguages, translations, targetLanguages } from "@/lib/translations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReminderCard } from "@/components/ReminderCard";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, useCollection } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserProfile, UserWeekProgress } from "@/lib/types";
import type { User } from 'firebase/auth';
import { useAppConfig } from "@/hooks/useAppConfig";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import { canAccessWeek } from "@/lib/accessControl";
import { ReferralCard } from "@/components/ReferralCard";
import { TrialEndBanner } from "@/components/TrialEndBanner";
import { TrialEndModal } from "@/components/TrialEndModal";
import { differenceInCalendarDays } from 'date-fns';


function DashboardLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto py-8 sm:py-12 px-4">
          <header className="mb-8">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </header>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-8">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function DashboardContent({ user }: { user: User }) {
  const [isMounted, setIsMounted] = useState(false);
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const { config, isLoading: isConfigLoading } = useAppConfig();
  const { trialDaysUsed, isTrialLoading } = useFreeTrial();

  const [nativeLanguage, setNativeLanguage] = useState('English');
  const [targetLanguage, setTargetLanguage] = useState('French');

  useEffect(() => {
    setIsMounted(true);

    // When the user profile loads, it becomes the source of truth
    if (userProfile) {
        let initialNative = userProfile.nativeLanguage || 'English';
        let initialTarget = userProfile.selectedLanguage || 'French';

        // Ensure language combinations are valid
        if (!nativeLanguages.includes(initialNative)) {
            initialNative = 'English';
        }
        if (initialNative === 'English' && initialTarget === 'English') {
            initialTarget = 'French'; // Prevent learning English in English
        }

        // Set component state
        setNativeLanguage(initialNative);
        setTargetLanguage(initialTarget);

        // Sync to localStorage
        localStorage.setItem("nativeLanguage", initialNative);
        localStorage.setItem("targetLanguage", initialTarget);
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfileRef && userProfile && userProfile.currentStreak > 0) {
      const today = new Date();
      // Ensure lastActiveDate is a valid date string before creating a Date object
      const lastActive = userProfile.lastActiveDate ? new Date(userProfile.lastActiveDate) : new Date();
      const daysSinceLastActive = differenceInCalendarDays(today, lastActive);

      // If it's been more than 1 day since the last activity, the streak is broken.
      if (daysSinceLastActive > 1) {
        updateDocumentNonBlocking(userProfileRef, { currentStreak: 0 });
      }
    }
  }, [userProfile, userProfileRef]);


  const handleTargetLanguageChange = (newLang: string) => {
    setTargetLanguage(newLang);
    if (userProfileRef) {
        updateDocumentNonBlocking(userProfileRef, { selectedLanguage: newLang });
    }
    localStorage.setItem("targetLanguage", newLang);
  };

  const handleNativeLanguageChange = (newLang: string) => {
    setNativeLanguage(newLang);
    localStorage.setItem("nativeLanguage", newLang);

    if (newLang === 'English' && targetLanguage === 'English') {
      handleTargetLanguageChange('French');
    } else {
       if (userProfileRef) {
        updateDocumentNonBlocking(userProfileRef, { nativeLanguage: newLang });
       }
    }
  };

  const activePathForQuery = userProfile?.activePath || 'survival';
  const lastActiveWeek = userProfile?.lastLessonWeek || 1;

  const weekProgressRef = useMemoFirebase(() => {
    if (!user || !firestore || !activePathForQuery || !lastActiveWeek) return null;
    return doc(firestore, 'userProgress', user.uid, activePathForQuery, `week_${lastActiveWeek}`);
  }, [user, firestore, activePathForQuery, lastActiveWeek]);

  const { data: weekProgressData } = useDoc<UserWeekProgress>(weekProgressRef);
  
  const allProgressForActivePathRef = useMemoFirebase(() => {
    if (!user || !firestore || !activePathForQuery) return null;
    return collection(firestore, 'userProgress', user.uid, activePathForQuery);
  }, [user, firestore, activePathForQuery]);

  const { data: allProgressData, isLoading: isProgressLoading } = useCollection<UserWeekProgress>(allProgressForActivePathRef);

  const availableTargetLanguages = useMemo(() => {
    if (nativeLanguage === 'English') {
        return targetLanguages.filter(l => l.lang !== 'English');
    }
    return targetLanguages;
  }, [nativeLanguage]);


  if (!isMounted || isProfileLoading || !userProfile || isConfigLoading || isTrialLoading || isProgressLoading) {
      return <DashboardLoading />;
  }
  
  const {
    displayName,
    currentStreak,
    xpPoints,
    activePath,
    lastLessonWeek,
    lastLessonDay
  } = userProfile;
  
  const level = Math.floor((xpPoints || 0) / 1500) + 1;
  const xpToNextLevel = 1500 - (xpPoints % 1500);

  const lastWeek = lastLessonWeek || 1;
  const lastDay = lastLessonDay || 0;
  
  const nextDay = lastDay < 7 ? lastDay + 1 : 1;
  const nextWeek = lastDay < 7 ? lastWeek : lastWeek + 1;
  const nextLessonUrl = `/lessons/${(targetLanguage).toLowerCase()}/${(activePath || 'survival').toLowerCase()}/${nextWeek}/${nextDay}`;

  const validNativeLanguage = (nativeLanguages.includes(nativeLanguage)) ? nativeLanguage : 'English';
  const t = translations[validNativeLanguage as keyof typeof translations].dashboard;
  const t_ui = translations[validNativeLanguage as keyof typeof translations].ui;
  
  const isRTL = ['Urdu'].includes(nativeLanguage as string);
  const dayNames = [t.days.mon, t.days.tue, t.days.wed, t.days.thu, t.days.fri, t.days.sat, t.days.sun];
  const weeklyProgressBools = Array.from({ length: 7 }, (_, i) => weekProgressData?.daysCompleted?.includes(i + 1) || false);

  const availablePaths = ['Chinese', 'Tamil'].includes(targetLanguage)
    ? PATHS.filter(p => p.id !== 'alphabet')
    : PATHS;

  const hasAccessToNextWeek = canAccessWeek(nextWeek, {
    profile: userProfile,
    progress: allProgressData,
    trialDaysUsed: trialDaysUsed,
    userEmail: user.email,
  }, config);

  return (
    <div className={cn("flex min-h-dvh flex-col bg-background", isRTL ? 'font-sans' : 'font-body')} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto py-8 sm:py-12 px-4">
          <TrialEndBanner trialDaysUsed={trialDaysUsed} subscriptionActive={userProfile?.subscriptionActive || false} />
          <TrialEndModal trialDaysUsed={trialDaysUsed} subscriptionActive={userProfile?.subscriptionActive || false} />
          <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {t.welcome}, {displayName}!
            </h1>
            <p className="text-muted-foreground mt-2">
              {t.ready}
            </p>
          </header>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t.currentStreak}
                </CardTitle>
                <Flame className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentStreak || 0} days</div>
                <p className="text-xs text-muted-foreground">{t.keepFlame}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.xpPoints}</CardTitle>
                <Star className="h-5 w-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(xpPoints || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {xpToNextLevel.toLocaleString()} {t.toNextLevel} {level + 1}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.level}</CardTitle>
                <Zap className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{level}</div>
                <p className="text-xs text-muted-foreground">{t.advancing}</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.currentPath}</CardTitle>
                <Target className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{activePath || 'Survival'}</div>
                <p className="text-xs text-muted-foreground">{t.language}: {targetLanguage}</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              
              <Card className="border-2 border-primary shadow-lg shadow-primary/10">
                <CardHeader>
                  <CardTitle>{t.continueJourney}</CardTitle>
                  <CardDescription>
                    {t.continueDesc.replace('{path}', activePath || 'Survival').replace('{language}', targetLanguage)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                        <BookOpen className="h-8 w-8 text-primary" />
                        <div>
                            <p className="font-semibold text-lg">{t.nextLesson.replace('{week}', nextWeek.toString()).replace('{day}', nextDay.toString())}</p>
                            <p className="text-sm text-muted-foreground">{t.keepProgress}</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                  {hasAccessToNextWeek ? (
                    <Button asChild className="w-full sm:w-auto">
                      <Link href={nextLessonUrl}>
                        {t.goToNextLesson} <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                      <Link href="/pricing">
                        {t_ui.upgradeToUnlock} <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>

              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  {t.explorePaths}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {availablePaths.map((path) => (
                    <PathCard
                      key={path.id}
                      id={path.id}
                      icon={path.icon}
                      title={path.title}
                      description={path.description}
                      details={path.details}
                      language={targetLanguage}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
               <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {t.siteLanguage}
                  </CardTitle>
                  <CardDescription>
                    {t.siteLanguageDesc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {nativeLanguages.map((lang) => (
                      <Button
                        key={lang}
                        onClick={() => handleNativeLanguageChange(lang)}
                        variant={nativeLanguage === lang ? "default" : "outline"}
                        size="sm"
                        disabled={['Hindi', 'Bengali', 'Nepali', 'Urdu'].includes(lang)}
                      >
                        {lang}
                      </Button>
                    ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5"/>
                        {t.targetLanguage}
                    </CardTitle>
                    <CardDescription>
                        {t.targetLanguageDesc}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <Select value={targetLanguage} onValueChange={handleTargetLanguageChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={t.selectTargetLanguage} />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {availableTargetLanguages.map(lang => (
                        <SelectItem key={lang.lang} value={lang.lang}>
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{lang.flag}</span>
                            <span>{lang.lang}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              <ReminderCard />
              <ReferralCard />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    {t.weeklyProgress}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between gap-1">
                    {dayNames.map((day, index) => (
                      <div key={day} className="flex flex-col items-center gap-2">
                        <div
                          className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold",
                            weeklyProgressBools[index]
                              ? 'bg-green-500 text-white'
                              : 'bg-muted'
                          )}
                        >
                          {weeklyProgressBools[index] ? '✓' : ''}
                        </div>
                        <p className="text-xs text-muted-foreground">{day}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [waitedForAuth, setWaitedForAuth] = useState(false);

  useEffect(() => {
    // Wait at least 2 seconds before redirecting to allow Firebase to initialize
    const timer = setTimeout(() => setWaitedForAuth(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (waitedForAuth && !isUserLoading && !user) {
      router.push('/login?redirect=/dashboard');
    }
  }, [user, isUserLoading, router, waitedForAuth]);

  if (isUserLoading || !user || !waitedForAuth) {
    return <DashboardLoading />;
  }

  return <DashboardContent user={user} />;
}
