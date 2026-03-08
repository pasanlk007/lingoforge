'use server';
import { getLessonFromFile } from '@/lib/lessonCache';
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
  // Fallback to English if native language isn't specified in the URL.
  const nativeLanguage = searchParams?.native || 'English';

  const weekNum = parseInt(week);
  const dayNum = parseInt(day);

  // Basic validation for route parameters.
  if (isNaN(weekNum) || isNaN(dayNum) || weekNum < 1 || dayNum < 1) {
    notFound();
  }

  // Capitalize the language for display and consistency.
  const formattedLanguage = language.charAt(0).toUpperCase() + language.slice(1);

  // Load the lesson data from the local JSON file.
  const lesson = await getLessonFromFile(formattedLanguage, path as LearningPath, weekNum, nativeLanguage, dayNum);

  // If the lesson file doesn't exist or fails to load, show an error message.
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
                Could not load the lesson for {language}, {path} path, week {week}, day {day}. 
                Please check if the corresponding JSON file exists in the `/public/lessons` directory.
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  // Render the client component with the loaded lesson data.
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <LessonClientPage lesson={lesson} currentDay={dayNum} />
      </main>
    </div>
  );
}
