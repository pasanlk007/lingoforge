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

  useEffect(() => {
    // Only proceed if all params are available and are strings.
    if (
      typeof language !== 'string' ||
      typeof path !== 'string' ||
      typeof week !== 'string' ||
      typeof day !== 'string'
    ) {
      setIsLoading(true); // Keep loading until all params are available
      return;
    }
    
    const dayNum = parseInt(day, 10);
    if (isNaN(dayNum)) {
        setError(`Invalid day parameter: "${day}". Must be a number.`);
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

          // Check if the file is a WeeklyLessonPlan (has a 'days' array)
          // or a single LessonDay object.
          if (Array.isArray(jsonData.days)) {
            const weeklyPlan = jsonData as WeeklyLessonPlan;
            dayData = weeklyPlan.days.find(d => d.day === dayNum);
          } else {
            // Assume it's a single LessonDay object.
            const singleDayData = jsonData as LessonDay;
            // Check if the day in the file matches the day in the URL
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
              days: [dayData], // Wrap in array for LessonClientPage
            };
            setLesson(formattedLesson);
          } else {
            setError(`Could not find data for day ${dayNum} in the lesson file at 'public${lessonPath}'. Please check the file structure.`);
          }
        } else {
          if (response.status === 404) {
             setError(`Lesson content for Week ${week} of the ${path} path does not exist. Please create the file at 'public${lessonPath}'.`);
          } else {
             setError(`Failed to load lesson file. Status: ${response.status}`);
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

  }, [language, path, week, day]);


  if (isLoading || dayNumber === null) {
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
              <AlertTitle>Could Not Load Lesson</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 rounded-lg border border-dashed border-yellow-500/50 bg-yellow-500/10 p-4">
              <div className="flex items-start gap-3">
                <Wrench className="h-5 w-5 text-yellow-400" />
                <div className='flex-1'>
                  <h3 className="font-semibold text-yellow-300">Content Not Available</h3>
                  <p className="text-sm text-yellow-400/80">This lesson has not been created yet. You can create the lesson file in the <code>public/lessons</code> directory. Please see <code>docs/lesson-generation-guide.md</code> for instructions.</p>
                  <Button asChild className="mt-3">
                    <Link href="/dashboard">Back to Dashboard</Link>
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
