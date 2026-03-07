
import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { AlphabetLessonClientPage } from '@/components/AlphabetLessonClientPage';

type AlphabetLessonPageProps = {
  params: {
    language: string;
    week: string;
    day: string;
  };
};

async function getAlphabetLesson(language: string, week: string) {
  const filePath = path.join(process.cwd(), 'src', 'app', 'data', 'alphabet', language, `week-${week}.json`);
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error("Could not read alphabet lesson file:", error);
    return null;
  }
}

export default async function AlphabetLessonPage({ params }: AlphabetLessonPageProps) {
  const { language, week, day } = params;
  const dayNum = parseInt(day);
  const weekNum = parseInt(week);

  if (isNaN(dayNum) || isNaN(weekNum) || dayNum < 1 || dayNum > 7 || weekNum < 1) {
    notFound();
  }

  const lesson = await getAlphabetLesson(language, week);

  if (!lesson) {
    return (
      <div className="container mx-auto py-10">
         <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Lesson Data Not Found</AlertTitle>
            <AlertDescription>
              We couldn't find the lesson data for {language}, week {week}.
            </AlertDescription>
          </Alert>
      </div>
    );
  }

  const lessonDay = lesson.days.find((d: any) => d.day === dayNum);

  if (!lessonDay) {
    notFound();
  }

  return <AlphabetLessonClientPage lessonDay={lessonDay} language={language} week={week} day={day} />;
}
