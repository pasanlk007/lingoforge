'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import type { LanguageLesson, LearningPath } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Terminal, Wrench } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { LessonClientPage } from '@/components/LessonClientPage';
import { Button } from '@/components/ui/button';
import { translations } from '@/lib/translations';
import { getOrGenerateLesson } from '@/lib/lessonCache';

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

  const [lesson, setLesson] = useState<LanguageLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayNumber, setDayNumber] = useState<number | null>(null);
  const [nativeLanguage, setNativeLanguage] = useState<keyof typeof translations>('English');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const savedNativeLang = localStorage.getItem("nativeLanguage") as keyof typeof translations;
    if (savedNativeLang && translations[savedNativeLang]) {
      setNativeLanguage(savedNativeLang);
    }
    setIsMounted(true);
  }, []);
  
  const t = (isMounted && translations[nativeLanguage]?.ui) ? translations[nativeLanguage].ui : translations.English.ui;

  useEffect(() => {
    // Wait for the component to be mounted to ensure localStorage is available
    if (!isMounted) {
      return;
    }
    
    // Ensure all params are available
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
        nativeLanguage,
        dayNum
      );

      if (weeklyLessonData) {
        const dayData = weeklyLessonData.days.find(d => d.day === dayNum);
        if (dayData) {
          // Create a new LanguageLesson object containing only the single, relevant day.
          // This is what the LessonClientPage component expects.
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
        const native = nativeLanguage.toLowerCase();
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

  }, [language, path, week, day, isMounted, nativeLanguage, t]);


  if (isLoading || dayNumber === null || !isMounted) {
    return <LoadingSkeleton />;
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

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <LessonClientPage lesson={lesson} currentDay={dayNumber} />
      </main>
    </div>
  );
}
