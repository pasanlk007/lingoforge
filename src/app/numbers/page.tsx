'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile, LessonDay, LessonItem } from '@/lib/types';
import { Navigation } from '@/components/Navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { nativeLanguages, translations } from '@/lib/translations';
import { getOrGenerateLesson } from '@/lib/lessonCache';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const LoadingSkeleton = () => (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1 container mx-auto max-w-4xl py-12 px-4 space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
          <div className="mt-8 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {Array.from({ length: 20 }).map((_, i) => <Skeleton key={i} className="h-16 w-16" />)}
            </div>
            <Skeleton className="h-8 w-1/3 pt-8" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          </div>
      </main>
    </div>
);

// This is a custom type that attaches week and day to a LessonItem
type LessonItemWithOrigin = LessonItem & { week: number; day: number };

export default function NumbersPathPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const [allLessonData, setAllLessonData] = useState<LessonDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, "userProfiles", user.uid);
  }, [user, firestore]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const nativeLanguage = userProfile?.nativeLanguage || (isMounted && localStorage.getItem('nativeLanguage')) || 'English';
  const targetLanguage = userProfile?.selectedLanguage || (isMounted && localStorage.getItem('targetLanguage')) || 'French';
  const validNativeLanguage = (nativeLanguages.includes(nativeLanguage as string)) ? nativeLanguage : 'English';
  
  const totalWeeksForNumbers = 4; // This is for data fetching only, not UI.

  useEffect(() => {
    const fetchAllLessons = async () => {
      setIsLoading(true);
      const allDays: LessonDay[] = [];
      
      for (let week = 1; week <= totalWeeksForNumbers; week++) {
        const weeklyLesson = await getOrGenerateLesson(
          targetLanguage.toLowerCase(),
          'numbers',
          week,
          validNativeLanguage,
          1 // dummy day
        );

        if (weeklyLesson && weeklyLesson.days) {
          allDays.push(...weeklyLesson.days);
        }
      }
      setAllLessonData(allDays);
      setIsLoading(false);
    };

    if (isMounted && targetLanguage && validNativeLanguage) {
      fetchAllLessons();
    }
  }, [isMounted, targetLanguage, validNativeLanguage]);

  const { numbers, timesOfDay, daysOfWeek, months } = useMemo(() => {
    if (allLessonData.length === 0) {
      return { numbers: [], timesOfDay: [], daysOfWeek: [], months: [] };
    }

    const allWords: LessonItemWithOrigin[] = allLessonData.flatMap(day => 
        (day.words || []).map(word => ({...word, week: day.week, day: day.day }))
    );

    const numbersList = allWords.filter(item => 
        (item.week === 1 || item.week === 2 || (item.week === 3 && item.day <= 4))
    ).sort((a,b) => {
        const numA = parseInt(a.english, 10);
        const numB = parseInt(b.english, 10);
        if (isNaN(numA) || isNaN(numB)) return 0;
        return numA - numB;
    });

    const timesOfDayList = allWords.filter(item => item.week === 3 && (item.day === 5 || item.day === 6));
    
    const weekDayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const calendarWords = allWords.filter(item => (item.week === 3 && item.day === 7) || item.week === 4);

    const daysOfWeekList = weekDayNames.map(dayName => {
        return calendarWords.find(word => word.english === dayName);
    }).filter((item): item is LessonItemWithOrigin => !!item);

    const monthsList = monthNames.map(monthName => {
        return calendarWords.find(word => word.english === monthName);
    }).filter((item): item is LessonItemWithOrigin => !!item);

    return { numbers: numbersList, timesOfDay: timesOfDayList, daysOfWeek: daysOfWeekList, months: monthsList };
  }, [allLessonData]);

  if (isMounted && nativeLanguage === 'English' && targetLanguage === 'English') {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1 container mx-auto max-w-3xl py-12 px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight">Invalid Language Selection</h1>
            <p className="mt-4 text-lg text-muted-foreground">
                You cannot learn a language that is also set as your native language. Please select a different target language from your dashboard.
            </p>
            <Button asChild className="mt-6"><Link href="/dashboard">Back to Dashboard</Link></Button>
        </main>
      </div>
    );
  }

  if (isLoading || isUserLoading || !isMounted) {
    return <LoadingSkeleton />;
  }

  const renderSection = (title: string, items: LessonItemWithOrigin[], gridClass: string, displayKey: keyof LessonItemWithOrigin = 'target') => {
    if (items.length === 0) return null;
    return (
        <section>
            <h2 className="text-2xl font-bold tracking-tight mt-12 mb-4">{title}</h2>
            <div className={gridClass}>
            {items.map((item) => (
                <Button key={item.id} asChild variant="secondary" className="h-20 p-1 text-center flex items-center justify-center font-bold text-base">
                    <Link href={`/lessons/${targetLanguage.toLowerCase()}/numbers/${item.week}/${item.day}`}>
                        {item[displayKey] as string}
                    </Link>
                </Button>
            ))}
            </div>
        </section>
    );
  }

  return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1">
          <div className="container mx-auto max-w-4xl py-12 px-4">
            <header className="mb-8 text-center">
              <h1 className="text-4xl font-bold tracking-tight">Numbers Path</h1>
              <p className="mt-2 text-muted-foreground">Master counting, time, and dates in {targetLanguage}.</p>
            </header>

            {renderSection("Numbers", numbers, "grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3", 'english')}
            {renderSection("Times of the Day", timesOfDay, "grid grid-cols-2 md:grid-cols-4 gap-3")}
            {renderSection("Days of the Week", daysOfWeek, "grid grid-cols-2 md:grid-cols-4 gap-3")}
            {renderSection("Months of the Year", months, "grid grid-cols-2 md:grid-cols-4 gap-3")}

            {allLessonData.length === 0 && !isLoading && (
                 <Card className="p-8 text-center">
                    <h3 className="text-xl font-semibold">Content Not Found</h3>
                    <p className="text-muted-foreground mt-2">
                        Could not load the learning content for the Numbers Path in {targetLanguage}.
                        Please ensure the lesson files exist in the `public/lessons` directory.
                    </p>
                </Card>
            )}
          </div>
        </main>
      </div>
  );
}
