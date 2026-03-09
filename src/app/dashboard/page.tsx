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
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserProfile, UserWeekProgress } from "@/lib/types";
import type { User } from 'firebase/auth';

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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleNativeLanguageChange = (newLang: string) => {
    if (userProfileRef) {
        updateDocumentNonBlocking(userProfileRef, { nativeLanguage: newLang });
    }
    localStorage.setItem("nativeLanguage", newLang);
  };
  
  const handleTargetLanguageChange = (newLang: string) => {
    if (userProfileRef) {
        updateDocumentNonBlocking(userProfileRef, { selectedLanguage: newLang });
    }
    localStorage.setItem("targetLanguage", newLang);
  };

  const lastActiveWeek = userProfile?.lastLessonWeek || 1;
  const lastActivePath = userProfile?.activePath || 'survival';

  const weekProgressRef = useMemoFirebase(() => {
    if (!user || !firestore || !lastActivePath || !lastActiveWeek) return null;
    return doc(firestore, 'userProgress', user.uid, lastActivePath, `week_${lastActiveWeek}`);
  }, [user, firestore, lastActivePath, lastActiveWeek]);

  const { data: weekProgressData } = useDoc<UserWeekProgress>(weekProgressRef);


  if (!isMounted || isProfileLoading || !userProfile) {
      return <DashboardLoading />;
  }

  // Prioritize Firestore data, with fallback to localStorage for initial hydration.
  const nativeLanguage = userProfile.nativeLanguage || (isMounted && localStorage.getItem('nativeLanguage')) || 'English';
  const targetLanguage = userProfile.selectedLanguage || (isMounted && localStorage.getItem('targetLanguage')) || 'French';

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

  // Make sure the native language from profile/storage is valid before using it
  const validNativeLanguage = (nativeLanguages.includes(nativeLanguage)) ? nativeLanguage : 'English';
  const t = translations[validNativeLanguage as keyof typeof translations].dashboard;
  
  const isRTL = ['Urdu'].includes(nativeLanguage as string);
  const dayNames = [t.days.mon, t.days.tue, t.days.wed, t.days.thu, t.days.fri, t.days.sat, t.days.sun];
  const weeklyProgressBools = Array.from({ length: 7 }, (_, i) => weekProgressData?.daysCompleted?.includes(i + 1) || false);


  return (
    <div className={cn("flex min-h-dvh flex-col bg-background", isRTL ? 'font-sans' : 'font-body')} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto py-8 sm:py-12 px-4">
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
                  <Button asChild className="w-full sm:w-auto">
                    <Link href={nextLessonUrl}>
                      {t.goToNextLesson} <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  {t.explorePaths}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {PATHS.map((path) => (
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
                      {targetLanguages.map(lang => (
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

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/dashboard');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return <DashboardLoading />;
  }

  return <DashboardContent user={user} />;
}
