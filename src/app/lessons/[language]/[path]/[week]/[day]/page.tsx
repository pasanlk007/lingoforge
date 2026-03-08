'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

import type { LanguageLesson, LessonDay, WeeklyLessonPlan } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Terminal } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { LessonClientPage } from '@/components/LessonClientPage';

export default function LessonPage() {
  const params = useParams();
  const firestore = useFirestore();

  const [lesson, setLesson] = useState<LanguageLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { language, path, week, day } = params;
  const dayNum = parseInt(day as string);
  
  const lessonCacheId = useMemoFirebase(() => {
    if (!language || !path || !week) return null;
    return `${language}_${path}_week_${week}`.toLowerCase();
  }, [language, path, week]);
  
  useEffect(() => {
    if (!lessonCacheId || !firestore) return;

    const fetchLesson = async () => {
      setIsLoading(true);
      setError(null);
      
      const docRef = doc(firestore, 'lessonCache', lessonCacheId);
      
      try {
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const weeklyPlan = JSON.parse(docSnap.data().lessonJson) as WeeklyLessonPlan;
          const dayData = weeklyPlan.days.find(d => d.day === dayNum);

          if (dayData) {
            const formattedLesson: LanguageLesson = {
              week: weeklyPlan.week,
              language: weeklyPlan.targetLanguage,
              path: weeklyPlan.path as any,
              title: dayData.title,
              description: dayData.theme,
              days: [dayData],
            };
            setLesson(formattedLesson);
          } else {
            setError(`Day ${dayNum} not found in the cached lesson for week ${week}.`);
          }
        } else {
          setError(`Lesson not found in cache. Please ask an administrator to generate it.`);
        }
      } catch (e: any) {
        console.error("Error fetching lesson from cache: ", e);
        setError(e.message || "Failed to fetch lesson from Firestore.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLesson();

  }, [lessonCacheId, firestore, dayNum, week]);


  if (isLoading) {
    return (
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
    )
  }

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Navigation />
        <main className="flex-1">
          <div className="container mx-auto py-10">
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Could Not Load Lesson</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  if (!lesson) {
    return null; // Should be covered by loading/error states
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <LessonClientPage lesson={lesson} currentDay={dayNum} />
      </main>
    </div>
  );
}
