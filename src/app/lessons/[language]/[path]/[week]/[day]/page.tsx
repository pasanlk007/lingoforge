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
};

export default async function LessonPage({ params }: LessonPageProps) {
  const { language, path, week, day } = params;

  const weekNum = parseInt(week);
  const dayNum = parseInt(day);
  
  // Basic validation
  if (isNaN(weekNum) || isNaN(dayNum) || weekNum < 1 || dayNum < 1 || dayNum > 7) {
    notFound();
  }

  // Capitalize first letter of language
  const formattedLanguage = language.charAt(0).toUpperCase() + language.slice(1);

  const lesson = await getOrGenerateLesson(formattedLanguage, path as LearningPath, weekNum);

  if (!lesson) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Navigation />
        <main className="flex-1">
          <div className="container mx-auto py-10">
             <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Lesson Generation Failed</AlertTitle>
                <AlertDescription>
                  We couldn't generate the lesson for {language}, week {week}. The AI may be busy. Please try again later.
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
