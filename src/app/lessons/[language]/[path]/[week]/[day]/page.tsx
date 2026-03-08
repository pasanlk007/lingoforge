'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import Link from 'next/link';

import type { LanguageLesson, WeeklyLessonPlan } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Terminal, Wrench } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { LessonClientPage } from '@/components/LessonClientPage';
import { Button } from '@/components/ui/button';

// Component to show admin-specific actions when a lesson is not found
function AdminLessonActions({ language, path, week }: { language: string | string[], path: string | string[], week: string | string[] }) {
  const generationUrl = `/admin/generate?targetLanguage=${language}&path=${path}&week=${week}`;
  return (
    <div className="mt-4 rounded-lg border border-dashed border-yellow-500/50 bg-yellow-500/10 p-4">
      <div className="flex items-start gap-3">
        <Wrench className="h-5 w-5 text-yellow-400" />
        <div className='flex-1'>
          <h3 className="font-semibold text-yellow-300">Admin Action Required</h3>
          <p className="text-sm text-yellow-400/80">This lesson does not exist in the cache. As an administrator, you can generate it now.</p>
          <Button asChild className="mt-3">
            <Link href={generationUrl}>Generate Week {week} Lesson</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}


export default function LessonPage() {
  const params = useParams();
  const firestore = useFirestore();
  const { user } = useUser(); // Get current user

  const [lesson, setLesson] = useState<LanguageLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { language, path, week, day } = params;
  const dayNum = parseInt(day as string);
  
  const lessonCacheId = useMemoFirebase(() => {
    if (!language || !path || !week) return null;
    return `${language}_${path}_week_${week}`.toLowerCase();
  }, [language, path, week]);
  
  // Check if the current user is an admin
  const adminRef = useMemoFirebase(() => user ? doc(firestore, "adminUsers", user.uid) : null, [user, firestore]);
  const { data: adminDoc } = useDoc(adminRef);
  const isAdmin = !!adminDoc;

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
          <div className="container mx-auto py-10 max-w-2xl">
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Could Not Load Lesson</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            {isAdmin && error.includes('Lesson not found in cache') && (
              <AdminLessonActions language={language} path={path} week={week} />
            )}
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
