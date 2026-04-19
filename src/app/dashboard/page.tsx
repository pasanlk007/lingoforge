'use client';

import React, { useState, useEffect, useMemo } from "react";
import Link from 'next/link';
import { Home, Sprout, LayoutGrid, BookOpen, User as UserIcon, Flame, Star, Zap, CalendarDays, ChevronRight, Target, Globe, ShieldCheck, Landmark, BookText, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { cn } from "@/lib/utils";
import { nativeLanguages, translations, targetLanguages } from "@/lib/translations";
import { ReminderCard } from "@/components/ReminderCard";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserProfile } from "@/lib/types";
import { type User, onAuthStateChanged, getAuth } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { useAppConfig } from "@/hooks/useAppConfig";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import { canAccessLesson } from "@/lib/accessControl";
import { ReferralCard } from "@/components/ReferralCard";
import { TrialEndBanner } from "@/components/TrialEndBanner";
import { TrialEndModal } from "@/components/TrialEndModal";
import { differenceInCalendarDays } from 'date-fns';
import { VoiceSelector } from "@/components/VoiceSelector";
import VoiceInit from "@/components/VoiceInit";
import { proLessonTopics } from "@/lib/proLessonTopics";

const SI_TRANSLATIONS = {
  'Explore Learning Paths': 'ඉගෙනීමේ මාර්ග',
  'Survival Bundle': 'පැවැත්මේ මාර්ගය',
  'Survival Path': '👉 මේ ඉගෙනීමේ මාර්ගය',
  'Alphabet Path': 'අකුරු හදුනාගනිමු',
  'Numbers Path': 'ඉලක්කම් ඉගෙනගමු',
  'LingoForge Pro': 'LingoForge ප්‍රෝ',
  'Citizenship & Integration': 'පුරවැසිභාවය',
  'Coming Soon': 'ළඟදීම',
  'Citizenship Prep': 'පුරවැසිභාවය අයදුම් සූදානම',
  'Legal Framework': 'නීති රාමුව',
  'Exam Preparation': 'විභාග සූදානම',
  'Daily AI Lessons': 'දෛනික AI පාඩම්',
  'Explore Lesson Map': 'පාඩම් සිතියම',
  'Application guidance': 'ඉල්ලුම් මාර්ගෝපදේශය',
  'Rights & documents': 'අයිතිවාසිකම් සහ ලේඛන',
  'Language & civic tests': 'භාෂා සහ පුරවැසි පරීක්ෂණ',
  'Grammar & culture': 'ව්‍යාකරණ සහ සංස්කෘතිය',
  'Your 30-day journey': 'ඔබේ දින 30 ගමන',
  'Good morning': 'සුබ උදෑසනක්',
  'Good afternoon': 'සුබ දහවලක්',
  'Good evening': 'සුබ සන්ධ්‍යාවක්',
  'streak': 'දිනපෙළ',
  'days': 'දින',
  'week': 'සතිය',
  'I speak': 'ඔබේ භාෂාව',
  'I am learning': 'ඉලක්කගත භාෂාව තෝරන්න',
};

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
  const pathname = usePathname();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const { config, isLoading: isConfigLoading } = useAppConfig();
  const { trialDaysUsed, isTrialLoading } = useFreeTrial(userProfile);

  const [nativeLanguage, setNativeLanguage] = useState('English');
  const [targetLanguage, setTargetLanguage] = useState('French');

  const si_t = (englishText: string) => {
    if (nativeLanguage === 'Sinhala') {
      return (SI_TRANSLATIONS as any)[englishText] || englishText;
    }
    return englishText;
  };

  useEffect(() => {
    setIsMounted(true);
    if (!isProfileLoading && !userProfile && user && userProfileRef && firestore) {
      const createUserProfile = async () => {
        const now = new Date();
        const newUserProfile: UserProfile = {
            id: user.uid,
            displayName: user.displayName || 'New User',
            email: user.email!,
            photoURL: user.photoURL || null,
            nativeLanguage: localStorage.getItem('nativeLanguage') || 'English',
            selectedLanguage: localStorage.getItem('targetLanguage') || 'French',
            createdAt: now.toISOString(),
            subscriptionActive: false,
            subscriptionSource: 'none',
            subscriptionExpiry: null,
            xpPoints: 0,
            currentStreak: 0,
            lastActiveDate: now.toISOString().split('T')[0],
            aiPlanningEnabled: false,
        };
        setDoc(userProfileRef, newUserProfile, { merge: true }).catch(console.error);
      };
      createUserProfile();
    }
  }, [isProfileLoading, userProfile, user, userProfileRef, firestore]);

  useEffect(() => {
    setIsMounted(true);
    if (userProfile) {
        let initialNative = userProfile.nativeLanguage || 'English';
        let initialTarget = userProfile.selectedLanguage || 'French';
        if (!nativeLanguages.includes(initialNative)) initialNative = 'English';
        if (initialNative === 'English' && initialTarget === 'English') initialTarget = 'French';
        
        if (userProfile.subscriptionActive && 
            userProfile.subscriptionLanguage && 
            (userProfile.subscriptionPlan === 'weekly' || userProfile.subscriptionPlan === 'course')) {
          const subLang = userProfile.subscriptionLanguage.charAt(0).toUpperCase() + userProfile.subscriptionLanguage.slice(1);
          initialTarget = subLang;
        }
        
        setNativeLanguage(initialNative);
        setTargetLanguage(initialTarget);
        localStorage.setItem("nativeLanguage", initialNative);
        localStorage.setItem("targetLanguage", initialTarget);
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfileRef && userProfile && userProfile.currentStreak > 0) {
      const today = new Date();
      const lastActive = userProfile.lastActiveDate ? new Date(userProfile.lastActiveDate) : new Date();
      const daysSinceLastActive = differenceInCalendarDays(today, lastActive);
      if (daysSinceLastActive > 1) {
        updateDocumentNonBlocking(userProfileRef, { currentStreak: 0 });
      }
    }
  }, [userProfile, userProfileRef]);

  const {
    displayName,
    currentStreak,
    xpPoints,
  } = userProfile || {};
  
  const langKey = targetLanguage.toLowerCase();
  
  const survivalProgress = userProfile?.languageProgress?.[langKey]?.['survival'];
  const survivalLastWeek = survivalProgress?.lastWeek || 1;
  const survivalLastDay = survivalProgress?.lastDay || 0;
  const nextSurvivalDay = survivalLastDay < 7 ? survivalLastDay + 1 : 1;
  const nextSurvivalWeek = survivalLastDay < 7 ? survivalLastWeek : survivalLastWeek + 1;
  const nextSurvivalLessonUrl = `/lessons/${langKey}/survival/${nextSurvivalWeek}/${nextSurvivalDay}`;

  const proProgress = userProfile?.languageProgress?.[langKey]?.['pro'];
  const lastProAbsoluteDay = proProgress ? (proProgress.lastWeek - 1) * 7 + proProgress.lastDay : 0;
  const proPathFinished = lastProAbsoluteDay >= 30;
  const nextProAbsoluteDay = proPathFinished ? 30 : lastProAbsoluteDay + 1;
  const nextProWeekForTopic = Math.floor((nextProAbsoluteDay - 1) / 7) + 1;
  const nextProDayInWeekForTopic = ((nextProAbsoluteDay - 1) % 7) + 1;
  const nextProTopic = proLessonTopics[nextProWeekForTopic]?.[nextProDayInWeekForTopic] || 'Review';

  const nextProWeek = Math.floor((nextProAbsoluteDay - 1) / 7) + 1;
  const nextProDay = ((nextProAbsoluteDay - 1) % 7) + 1;
  const nextProLessonUrl = `/lessons/${langKey}/pro/${nextProWeek}/${nextProDay}`;

  const level = Math.floor((xpPoints || 0) / 1500) + 1;
  const xpToNextLevel = 1500 - ((xpPoints || 0) % 1500);

  const validNativeLanguage = (nativeLanguages.includes(nativeLanguage as string)) ? nativeLanguage : 'English';
  const t = translations[validNativeLanguage as keyof typeof translations].dashboard;
  const t_ui = translations[validNativeLanguage as keyof typeof translations].ui;
  
  const isRTL = ['Urdu'].includes(nativeLanguage as string);
  const dayNames = [t.days.mon, t.days.tue, t.days.wed, t.days.thu, t.days.fri, t.days.sat, t.days.sun];
  
  const completedDaysForWeek = useMemo(() => {
    const completedDays = survivalProgress?.completedDays || [];
    const weekPrefix = `${survivalLastWeek}-`;
    return completedDays.filter(d => d.startsWith(weekPrefix)).map(d => parseInt(d.split('-')[1]));
  }, [survivalProgress, survivalLastWeek]);

  const weeklyProgressBools = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => completedDaysForWeek.includes(i + 1));
  }, [completedDaysForWeek]);
  
  const hasAccessToNextWeek = useMemo(() => canAccessLesson({
    path: 'survival',
    week: nextSurvivalWeek,
    day: 1,
    language: targetLanguage,
    userEmail: user?.email,
    profile: userProfile,
  }).allowed, [nextSurvivalWeek, targetLanguage, user, userProfile]);

  const targetLanguageInfo = targetLanguages.find(l => l.lang === targetLanguage);
  const subscriptionPlan = userProfile?.subscriptionPlan || 'free';
  
  const bottomNavItems = [
    { href: '/dashboard', label: 'HOME', icon: Home },
    { href: '/survival', label: 'SURVIVAL', icon: Sprout },
    { href: '/dashboard/lesson-map', label: 'LESSON MAP', icon: LayoutGrid },
    { href: nextProLessonUrl, label: 'PRO', icon: BookOpen },
    { href: '/profile', label: 'PROFILE', icon: UserIcon },
  ];

  if (!isMounted || isProfileLoading || !userProfile || isConfigLoading || isTrialLoading) {
      return <DashboardLoading />;
  }

  return (
    <div className={cn("flex min-h-dvh flex-col bg-background", isRTL ? 'font-sans' : 'font-body')} dir={isRTL ? 'rtl' : 'ltr'}>
      <VoiceInit />
      <Navigation />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="container mx-auto py-8 sm:py-12 px-4">
          <TrialEndBanner trialDaysUsed={trialDaysUsed} subscriptionActive={userProfile?.subscriptionActive || false} userEmail={user.email} />
          <TrialEndModal trialDaysUsed={trialDaysUsed} subscriptionActive={userProfile?.subscriptionActive || false} userEmail={user.email} />
          <header className="mb-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  {t.welcome}, {displayName}!
                </h1>
                <p className="text-muted-foreground mt-2">{t.ready}</p>
              </div>
              <Card className="w-full sm:w-auto bg-card/80 backdrop-blur-sm border-primary/20">
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="text-5xl">{targetLanguageInfo?.flag}</div>
                        <div>
                            <p className="text-xs text-muted-foreground">Learning</p>
                            <p className="text-lg font-bold">{targetLanguage}</p>
                            <Badge variant={subscriptionPlan === 'free' ? 'secondary' : 'default'} className="capitalize mt-1">
                              {subscriptionPlan} Plan
                            </Badge>
                        </div>
                    </div>
                </CardContent>
              </Card>
            </div>
          </header>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <Card className="border-2 border-orange-500/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.currentStreak}</CardTitle>
                <Flame className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{currentStreak || 0} days</div><p className="text-xs text-muted-foreground">{t.keepFlame}</p></CardContent>
            </Card>
            <Card className="border-2 border-yellow-500/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.xpPoints}</CardTitle>
                <Star className="h-5 w-5 text-yellow-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{(xpPoints || 0).toLocaleString()}</div><p className="text-xs text-muted-foreground">{xpToNextLevel.toLocaleString()} {t.toNextLevel} {level + 1}</p></CardContent>
            </Card>
            <Card className="border-2 border-green-500/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.level}</CardTitle>
                <Zap className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{level}</div><p className="text-xs text-muted-foreground">{t.advancing}</p></CardContent>
            </Card>
            <Card className="border-2 border-blue-500/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t.currentPath}</CardTitle>
                <Target className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold capitalize">Survival</div><p className="text-xs text-muted-foreground">{t.language}: {targetLanguage}</p></CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              
              <Card className="flex flex-col border-2 border-green-500/50 bg-gradient-to-br from-green-900/20 to-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🌱</span>
                    <div>
                      <CardTitle className="text-xl">{si_t('Survival Bundle')}</CardTitle>
                      <CardDescription>Your first step to practical fluency.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                        <BookOpen className="h-8 w-8 text-primary" />
                        <div>
                            <p className="font-semibold text-lg">{t.nextLesson.replace('{week}', nextSurvivalWeek.toString()).replace('{day}', nextSurvivalDay.toString())}</p>
                            <p className="text-sm text-muted-foreground">{t.keepProgress}</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="grid gap-2 pt-2 p-4">
                  {hasAccessToNextWeek ? (
                    <Button asChild className="w-full">
                      <Link href={nextSurvivalLessonUrl}>
                        {t.goToNextLesson} <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                      <Link href="/pricing">{t_ui.upgradeToUnlock} <ChevronRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                      <Button asChild variant="outline" className="font-semibold">
                          <Link href="/alphabet">
                              🔤 {si_t('අකුරු හදුනාගනිමු')}
                          </Link>
                      </Button>
                      <Button asChild variant="outline" className="font-semibold">
                          <Link href="/numbers">
                              🔢 {si_t('ඉලක්කම් ඉගෙනගමු')}
                          </Link>
                      </Button>
                  </div>
                </CardFooter>
              </Card>

              <Card className="flex flex-col border-2 border-purple-500/30 bg-gradient-to-br from-purple-950/20 to-card p-6">
                <CardHeader className="p-0">
                  <Badge variant="outline" className="w-fit border-purple-400/50 bg-purple-900/30 text-purple-300 mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI ADVANCED PATH
                  </Badge>
                  <div className="flex items-center gap-4">
                    <Landmark className="h-8 w-8 text-purple-400" />
                    <div>
                      <CardTitle className="text-2xl font-bold">LingoForge Pro</CardTitle>
                      <CardDescription className="text-purple-300/80 mt-1">A specialized 30-day integration curriculum for migrant workers.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 mt-6 flex-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 rounded-lg bg-black/20 p-3"><ShieldCheck className="h-5 w-5 text-purple-400" /><span className="text-xs font-semibold">RIGHTS</span></div>
                      <div className="flex items-center gap-3 rounded-lg bg-black/20 p-3"><Landmark className="h-5 w-5 text-purple-400" /><span className="text-xs font-semibold">INTEGRATION</span></div>
                      <div className="flex items-center gap-3 rounded-lg bg-black/20 p-3"><BookText className="h-5 w-5 text-purple-400" /><span className="text-xs font-semibold">LEGAL VOCAB</span></div>
                      <div className="flex items-center gap-3 rounded-lg bg-black/20 p-3"><Sparkles className="h-5 w-5 text-purple-400" /><span className="text-xs font-semibold">AI TUTORS</span></div>
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-4 p-0 mt-6">
                    <div className="w-full rounded-lg bg-black/20 p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-900/50 border border-purple-500/50 text-2xl font-bold">
                                {nextProAbsoluteDay}
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-purple-400">Next Pro Lesson</p>
                                <p className="font-semibold">{nextProTopic}</p>
                            </div>
                        </div>
                        <Button asChild className="w-full mt-4 bg-purple-600 hover:bg-purple-500 font-bold" disabled={proPathFinished}>
                          <Link href={nextProLessonUrl}>
                            {proPathFinished ? 'Path Complete!' : 'Continue Lesson'} <ChevronRight className="ml-auto h-5 w-5" />
                          </Link>
                        </Button>
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/dashboard/lesson-map">Explore Lesson Map</Link>
                    </Button>
                </CardFooter>
              </Card>

            </div>

            <div className="space-y-8">
              <ReminderCard />
              <ReferralCard />
              <VoiceSelector />
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" />{t.weeklyProgress}</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex justify-between gap-1">
                    {dayNames.map((day, index) => (
                      <div key={day} className="flex flex-col items-center gap-2">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold", weeklyProgressBools[index] ? 'bg-green-500 text-white' : 'bg-muted')}>
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm">
        <div className="grid h-16 grid-cols-5">
          {bottomNavItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider",
                pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-primary/80"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user: hookUser, isUserLoading: hookLoading } = useUser();
  const [directUser, setDirectUser] = useState<User | null>(null);
  const [directLoading, setDirectLoading] = useState(true);
  
  useEffect(() => {
    import('firebase/app').then(({ initializeApp, getApps, getApp }) => {
      import('firebase/auth').then(({ getAuth, onAuthStateChanged }) => {
        const config = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };
        const app = getApps().length === 0 ? initializeApp(config) : getApp();
        const auth = getAuth(app);
        const unsub = onAuthStateChanged(auth, (u) => {
          setDirectUser(u);
          setDirectLoading(false);
        });
        return () => unsub();
      });
    }).catch(() => setDirectLoading(false));
  }, []);
  
  const user = hookUser || directUser;
  const isUserLoading = hookLoading || directLoading;
  const router = useRouter();

  useEffect(() => {
    if (directLoading) return; // Wait for direct auth check
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/dashboard');
    }
  }, [user, isUserLoading, router, directLoading]);

  if (isUserLoading || !user) {
    return <DashboardLoading />;
  }

  return <DashboardContent user={user} />;
}
