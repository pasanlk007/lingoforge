

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
import { PathCard } from '@/components/PathCard';
import { PATHS } from '@/lib/constants';
import { cn } from "@/lib/utils";
import { nativeLanguages, translations, targetLanguages } from "@/lib/translations";
import { isLessonAvailable } from "@/lib/accessControl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReminderCard } from "@/components/ReminderCard";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
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

const SI_TRANSLATIONS = {
  'Explore Learning Paths': 'ඉගෙනීමේ මාර්ග',
  'Survival Bundle': 'පැවැත්මේ මාර්ගය',
  'Survival Path': '👉 මේ ඉගෙනීමේ මාර්ගය',
  'Alphabet Path': 'අකුරු හදුනාගනිමු',
  'Numbers Path': 'ඉලක්කම් ඉගනගමු',
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

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const { config, isLoading: isConfigLoading } = useAppConfig();
  const { trialDaysUsed, isTrialLoading } = useFreeTrial(userProfile);

  const [nativeLanguage, setNativeLanguage] = useState('English');
  const [targetLanguage, setTargetLanguage] = useState('French');

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
        
        // For weekly/course plan, force subscribed language
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

  const handleTargetLanguageChange = (newLang: string) => {
    // Weekly/course plan users locked to subscribed language
    if (userProfile?.subscriptionActive && 
        userProfile?.subscriptionLanguage && 
        (userProfile?.subscriptionPlan === 'weekly' || userProfile?.subscriptionPlan === 'course')) {
      const subLang = userProfile.subscriptionLanguage.charAt(0).toUpperCase() + userProfile.subscriptionLanguage.slice(1);
      if (newLang.toLowerCase() !== userProfile.subscriptionLanguage.toLowerCase()) {
        alert('ඔබේ subscription ' + subLang + ' language ෙදෙස` පමණි. Lifetime plan ෙදෙස` upgrade කරන්නකො!');
        return;
      }
    }
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
  
  const availableTargetLanguages = useMemo(() => {
    if (nativeLanguage === 'English') {
        return targetLanguages.filter(l => l.lang !== 'English' && isLessonAvailable(nativeLanguage, l.lang));
    }
    return targetLanguages.filter(l => isLessonAvailable(nativeLanguage, l.lang));
  }, [nativeLanguage]);

  const si_t = (englishText: string) => {
    if (nativeLanguage === 'Sinhala') {
      return (SI_TRANSLATIONS as any)[englishText] || englishText;
    }
    return englishText;
  };

  const toTitleCase = (str: string) => str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());

  // All logic and derived state is now calculated before any conditional returns
  const {
    displayName,
    currentStreak,
    xpPoints,
  } = userProfile || {};
  
  const langKey = targetLanguage.toLowerCase();
  const survivalProgress = userProfile?.languageProgress?.[langKey]?.['survival'];

  const lastWeek = survivalProgress?.lastWeek || 1;
  const lastDay = survivalProgress?.lastDay || 0;
  
  const nextDay = lastDay < 7 ? lastDay + 1 : 1;
  const nextWeek = lastDay < 7 ? lastWeek : lastWeek + 1;
  const nextLessonUrl = `/lessons/${langKey}/survival/${nextWeek}/${nextDay}`;

  const level = Math.floor((xpPoints || 0) / 1500) + 1;
  const xpToNextLevel = 1500 - ((xpPoints || 0) % 1500);

  const validNativeLanguage = (nativeLanguages.includes(nativeLanguage as string)) ? nativeLanguage : 'English';
  const t = translations[validNativeLanguage as keyof typeof translations].dashboard;
  const t_ui = translations[validNativeLanguage as keyof typeof translations].ui;
  
  const isRTL = ['Urdu'].includes(nativeLanguage as string);
  const dayNames = [t.days.mon, t.days.tue, t.days.wed, t.days.thu, t.days.fri, t.days.sat, t.days.sun];
  
  const completedDaysForWeek = useMemo(() => {
    const completedDays = survivalProgress?.completedDays || [];
    const weekPrefix = `${lastWeek}-`;
    return completedDays.filter(d => d.startsWith(weekPrefix)).map(d => parseInt(d.split('-')[1]));
  }, [survivalProgress, lastWeek]);

  const weeklyProgressBools = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => completedDaysForWeek.includes(i + 1));
  }, [completedDaysForWeek]);
  
  const hasAccessToNextWeek = useMemo(() => canAccessLesson({
    path: 'survival',
    week: nextWeek,
    day: 1,
    language: targetLanguage,
    userEmail: user?.email,
    profile: userProfile,
  }).allowed, [nextWeek, targetLanguage, user, userProfile]);

  if (!isMounted || isProfileLoading || !userProfile || isConfigLoading || isTrialLoading) {
      return <DashboardLoading />;
  }
  
  const availablePaths = ['Chinese', 'Tamil'].includes(targetLanguage)
    ? PATHS.filter(p => p.id !== 'alphabet')
    : PATHS;

  const proPathItems = [
    { icon: "🛂", title: "Citizenship Prep", desc: "Application guidance" },
    { icon: "📜", title: "Legal Framework", desc: "Rights & documents" },
    { icon: "🎓", title: "Exam Preparation", desc: "Language & civic tests" },
    { icon: "✍️", title: "Daily AI Lessons", desc: "Grammar & culture" },
  ];

  return (
    <div className={cn("flex min-h-dvh flex-col bg-background", isRTL ? 'font-sans' : 'font-body')} dir={isRTL ? 'rtl' : 'ltr'}>
      <VoiceInit />
      <Navigation />
      <main className="flex-1">
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
              <div className="rounded-2xl bg-gradient-to-br from-primary/50 via-accent/50 to-green-400/50 p-0.5 shadow-xl transition-all hover:shadow-primary/20">
                <div className="flex flex-col gap-3 rounded-[15px] bg-card/80 p-4 backdrop-blur-sm">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{si_t('I speak')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {nativeLanguages.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleNativeLanguageChange(lang)}
                        disabled={false}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed", 
                          nativeLanguage === lang 
                          ? "bg-primary text-primary-foreground border-primary/50 shadow-lg shadow-primary/20" 
                          : "bg-muted/40 border-transparent hover:bg-muted/80 hover:text-foreground"
                        )}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                  <div className="my-2 h-px w-full bg-border/30" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{si_t('I am learning')}</p>
                  <Select value={targetLanguage} onValueChange={handleTargetLanguageChange}>
                    <SelectTrigger className="w-full border-border/50 bg-muted/40 font-bold hover:bg-muted/80">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {availableTargetLanguages.map(lang => (
                        <SelectItem key={lang.lang} value={lang.lang}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{lang.flag}</span>
                            <span className="font-semibold">{lang.lang}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
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
                <div className="text-2xl font-bold capitalize">Survival</div>
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
                    {t.continueDesc.replace('{path}', 'Survival').replace('{language}', targetLanguage)}
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
                <h2 className="text-2xl font-bold tracking-tight mb-4">{si_t('Explore Learning Paths')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="flex flex-col border-2 border-green-500/50 bg-gradient-to-br from-green-900/20 to-card">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">🌱</span>
                        <div>
                          <CardTitle className="text-xl">{si_t('Survival Bundle')}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">10 minutes per day</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-2">
                      {availablePaths.map((path) => (
                        <Link key={path.id} href={`/${path.id}`} className="flex items-center gap-3 p-2 rounded-md transition-colors group hover:bg-muted/50">
                          <span className="text-xl">{path.icon}</span>
                          <div>
                            <p className="font-semibold text-sm transition-colors group-hover:text-primary">{si_t(toTitleCase(path.title))}</p>
                            <p className="text-xs text-muted-foreground">{path.description}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground transition-colors group-hover:text-primary" />
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="flex flex-col border-2 border-purple-500/30 bg-gradient-to-br from-purple-900/10 to-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">🏛️</span>
                          <div>
                            <CardTitle className="text-xl">{si_t('LingoForge Pro')}</CardTitle>
                            <p className="text-xs text-purple-400 mt-1">{si_t('Citizenship & Integration')}</p>
                          </div>
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30">{si_t('Coming Soon')}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-2">
                      {proPathItems.map((item) => (
                        <div key={item.title} className="flex items-center gap-3 p-2 rounded-md opacity-60">
                          <span className="text-xl">{item.icon}</span>
                          <div>
                            <p className="font-semibold text-sm">{si_t(item.title)}</p>
                            <p className="text-xs text-muted-foreground">{si_t(item.desc)}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                    <div className="p-4 pt-0">
                      <a href="/dashboard/lesson-map">
                        <button className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2">
                          🗺️ {si_t('Explore Lesson Map')}
                        </button>
                      </a>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <ReminderCard />
              <ReferralCard />
              {nativeLanguage === 'Sinhala' && (
                <div className='mt-4 p-3 rounded-lg bg-muted/50 border border-border/50 text-sm text-center'>
                  <p className='text-muted-foreground mb-2'>ගෙවීම් ගැටලු හෝ දෝෂ සඳහා අප හා සම්බන්ධ වන්න:</p><p className='text-xs text-yellow-500 mb-2'>👉 අඩුපාඩු හෝ නව අදහස් තියෙනවාද? 💬 ඔබේ අදහස් අපට අත්වැලක්</p>
                  <div className='flex gap-4 justify-center'>
                    <a href='https://wa.me/message/IWT3LGER4UOOO1' target='_blank' className='text-green-500 hover:underline font-medium'>📱 WhatsApp</a>
                    <a href='mailto:innovativehub1996@gmail.com' className='text-blue-500 hover:underline font-medium'>✉️ Email</a>
                  </div>
                </div>
              )}
              <VoiceSelector />
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
  const isUserLoading = hookLoading && directLoading;
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
