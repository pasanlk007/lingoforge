'use server';
import { getOrGenerateLesson } from '@/lib/lessonCache';
import { LessonClientPage } from '@/components/LessonClientPage';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import type { LearningPath } from '@/lib/types';
import { notFound } from 'next/navigation';
import { Navigation } from '@/components/Navigation';

type LessonPageProps = {
  params: {
    language: string;
    path: string;
    week: string;
    day: string;
  };
  searchParams?: { native?: string };
};

export default async function LessonPage({ params, searchParams }: LessonPageProps) {
  const { language, path, week, day } = params;
  const nativeLanguage = searchParams?.native || 'English';

  const weekNum = parseInt(week);
  const dayNum = parseInt(day);

  if (isNaN(weekNum) || isNaN(dayNum) || weekNum < 1 || dayNum < 1 || dayNum > 7) {
    notFound();
  }

  const formattedLanguage = language.charAt(0).toUpperCase() + language.slice(1);

  const lesson = await getOrGenerateLesson(formattedLanguage, path as LearningPath, weekNum, nativeLanguage, dayNum);

  if (!lesson) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Navigation />
        <main className="flex-1">
          <div className="container mx-auto py-10">
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Lesson Not Found</AlertTitle>
              <AlertDescription>
                Lesson for {language} week {week} day {day} not found.
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    );
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
