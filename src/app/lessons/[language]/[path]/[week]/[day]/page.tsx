'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import type { LanguageLesson, WeeklyLessonPlan, LessonDay } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Terminal, Wrench } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { LessonClientPage } from '@/components/LessonClientPage';
import { Button } from '@/components/ui/button';
import { translations } from '@/lib/translations';

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
      
      const lessonPath = `/lessons/${language}/${path}/week_${week}.json`;
      
      try {
        const response = await fetch(lessonPath);

        if (response.ok) {
          const jsonData = await response.json();
          let dayData: LessonDay | undefined;

          if (Array.isArray(jsonData.days)) {
            const weeklyPlan = jsonData as WeeklyLessonPlan;
            dayData = weeklyPlan.days.find(d => d.day === dayNum);
          } else {
            const singleDayData = jsonData as LessonDay;
            if (singleDayData.day === dayNum) {
              dayData = singleDayData;
            }
          }

          if (dayData) {
            const formattedLesson: LanguageLesson = {
              week: dayData.week,
              language: dayData.targetLanguage,
              path: dayData.path,
              title: dayData.title,
              description: dayData.theme,
              days: [dayData],
            };
            setLesson(formattedLesson);
          } else {
            setError(t.errorContentNotFound
                .replace('{day}', dayNum.toString())
                .replace('{lessonPath}', lessonPath)
            );
          }
        } else {
          if (response.status === 404) {
             setError(t.errorContentNotFound
                .replace('{week}', week as string)
                .replace('{path}', path as string)
                .replace('{lessonPath}', lessonPath)
            );
          } else {
             setError(t.errorGeneric.replace('{status}', response.status.toString()));
          }
        }
      } catch (e: any) {
        console.error("Error fetching lesson file: ", e);
        setError(e.message || "Failed to fetch or parse lesson file.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLesson();

  }, [language, path, week, day, isMounted, t]);


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
