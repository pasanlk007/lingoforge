'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { LanguageLesson, LearningPath, UserProfile } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Terminal, Wrench, Lock } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { LessonClientPage } from '@/components/LessonClientPage';
import { Button } from '@/components/ui/button';
import { nativeLanguages, translations } from '@/lib/translations';
import { getOrGenerateLesson } from '@/lib/lessonCache';
import { AlphabetLessonPage } from '@/components/AlphabetLessonPage';
import { canAccessLesson } from '@/lib/accessControl';

const LoadingSkeleton = () => (
    <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1 container mx-auto py-12 max-w-3xl">
            <div className="space-y-4">
                <Skeleton className="h-10 w-2/3 mx-auto" />
                <Skeleton className="h-4 w-1/3 mx-auto" />
                <Skeleton className="h-8 w-full mt-4" />
                <div className="mt-8 space-y-6">
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </main>
    </div>
);

export default function LessonPage() {
  const params = useParams();
  const { language, path, week, day } = params;
  
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const [lesson, setLesson] = useState<LanguageLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayNumber, setDayNumber] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const weekNumber = parseInt(week as string, 10);
  const dayNum2 = parseInt(day as string, 10);
  
  const accessResult = canAccessLesson({
    path: path as LearningPath,
    week: weekNumber,
    day: dayNum2,
    language: language as string,
    userEmail: user?.email,
    profile: userProfile || null,
  });
  const hasAccess = accessResult.allowed;

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const nativeLanguage = (isMounted && (userProfile?.nativeLanguage || localStorage.getItem('nativeLanguage'))) || 'English';
  const validNativeLanguage = (nativeLanguages.includes(nativeLanguage as string)) ? nativeLanguage : 'English';
  const t = translations[validNativeLanguage as keyof typeof translations].ui || translations.English.ui;

  useEffect(() => {
    if (!isMounted || !hasAccess) {
      setIsLoading(false);
      return;
    }
    
    if (
      typeof language !== 'string' ||
      typeof path !== 'string' ||
      typeof week !== 'string' ||
      typeof day !== 'string'
    ) {
      setIsLoading(true);
      return;
    }
    
    const dayNum = parseInt(day, 10);
    if (isNaN(dayNum)) {
        setError(t.errorInvalidDay.replace('{day}', day));
        setIsLoading(false);
        return;
    }
    setDayNumber(dayNum);

    const fetchLesson = async () => {
      setIsLoading(true);
      setError(null);
      
      const weeklyLessonData = await getOrGenerateLesson(
        language,
        path as LearningPath,
        parseInt(week, 10),
        validNativeLanguage,
        dayNum
      );

      if (weeklyLessonData) {
        const dayData = weeklyLessonData.days.find(d => d.day === dayNum);
        if (dayData) {
          const singleDayLesson: LanguageLesson = {
            ...weeklyLessonData,
            days: [dayData],
          };
          setLesson(singleDayLesson);
        } else {
          setError(t.errorDayNotFound
              .replace('{day}', dayNum.toString())
              .replace('{lessonPath}', `week_${week}.json`)
          );
        }
      } else {
        const native = validNativeLanguage.toLowerCase();
        const target = language.toLowerCase();
        const weekPadded = String(week).padStart(2, '0');
        const lessonPath = `/lessons/${native}_${target}/${path}/week_${weekPadded}.json`;
        setError(t.errorWeekNotFound
            .replace('{week}', week as string)
            .replace('{path}', path as string)
            .replace('{lessonPath}', lessonPath)
        );
      }
      setIsLoading(false);
    };

    fetchLesson();

  }, [language, path, week, day, isMounted, validNativeLanguage, t, hasAccess]);


  if (isLoading || dayNumber === null || !isMounted || isProfileLoading) {
    return <LoadingSkeleton />;
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1 container mx-auto py-12 max-w-3xl text-center">
          <div className="text-6xl mb-6"><Lock /></div>
          <h1 className="text-2xl font-bold">Week {weekNumber} Locked</h1>
          <p className="text-muted-foreground mt-3">Upgrade your plan to access this week's lessons.</p>
          <Button asChild className="mt-6">
            <Link href="/pricing">
              Upgrade to Pro
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Navigation />
        <main className="flex-1">
          <div className="container mx-auto py-10 max-w-2xl">
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>{t.errorTitle}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 rounded-lg border border-dashed border-yellow-500/50 bg-yellow-500/10 p-4">
              <div className="flex items-start gap-3">
                <Wrench className="h-5 w-5 text-yellow-400" />
                <div className='flex-1'>
                  <h3 className="font-semibold text-yellow-300">{t.contentNotAvailableTitle}</h3>
                  <p className="text-sm text-yellow-400/80">{t.contentNotAvailableDesc}</p>
                  <Button asChild className="mt-3">
                    <Link href="/dashboard">{t.backToDashboard}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!lesson) {
    return <LoadingSkeleton />;
  }
  
  const dayData = lesson.days[0];

  if (!dayData) {
      return (
           <div className="flex min-h-dvh flex-col">
              <Navigation />
              <main className="flex-1">
                <div className="container mx-auto py-10 max-w-2xl">
                   <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>{t.errorTitle}</AlertTitle>
                    <AlertDescription>{`Could not find lesson data for day ${dayNumber}.`}</AlertDescription>
                  </Alert>
                </div>
              </main>
           </div>
      )
  }

  if (path === 'alphabet') {
      return (
         <div className="flex min-h-dvh flex-col bg-background">
          <Navigation />
          <main className="flex-1">
            <AlphabetLessonPage dayData={dayData} targetLanguage={language as string} />
          </main>
        </div>
      )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <LessonClientPage lesson={lesson} currentDay={dayNumber} />
      </main>
    </div>
  );
}
