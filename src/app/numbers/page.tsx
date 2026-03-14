'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile, LessonDay, LessonItem } from '@/lib/types';
import { Navigation } from '@/components/Navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { nativeLanguages, translations, targetLanguages } from '@/lib/translations';
import { getOrGenerateLesson } from '@/lib/lessonCache';
import { Card } from '@/components/ui/card';
import { AudioPlayback } from '@/components/AudioPlayback';
import { TooltipProvider } from '@/components/ui/tooltip';

const DataItemCard = ({ item, language }: { item: LessonItem, language: string }) => {
  // Check if item.english is a number string, which we use as the canonical numeral.
  const isNumberCard = item.english && !isNaN(parseInt(item.english, 10));

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Part: Target Language & Audio */}
        <div className="flex flex-1 items-center gap-4">
          <AudioPlayback text={item.target} languageName={language} />
          <div className="text-left">
            <p className="text-2xl sm:text-3xl font-bold">{item.target}</p>
            <p className="text-muted-foreground">{item.phonetic}</p>
          </div>
        </div>
        
        {/* Right Part: Numeral or Native Meaning */}
        <div className="text-right">
          {isNumberCard ? (
            <p className="text-4xl sm:text-5xl font-bold text-foreground">{item.english}</p>
          ) : (
            <p className="text-2xl sm:text-3xl font-bold text-foreground">{item.native_meaning}</p>
          )}
        </div>
      </div>
    </Card>
  );
};


const LoadingSkeleton = () => (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1 container mx-auto max-w-3xl py-12 px-4 space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
          <div className="mt-8 space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
      </main>
    </div>
);

export default function NumbersPathPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const [allLessonData, setAllLessonData] = useState<LessonDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, "userProfiles", user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const nativeLanguage = userProfile?.nativeLanguage || (isMounted && localStorage.getItem('nativeLanguage')) || 'English';
  const targetLanguage = userProfile?.selectedLanguage || (isMounted && localStorage.getItem('targetLanguage')) || 'French';
  const validNativeLanguage = (nativeLanguages.includes(nativeLanguage as string)) ? nativeLanguage : 'English';
  const t = translations[validNativeLanguage as keyof typeof translations].ui || translations.English.ui;
  
  const totalWeeksForNumbers = 4; // This is for data fetching only, not UI.

  useEffect(() => {
    const fetchAllLessons = async () => {
      setIsLoading(true);
      const allDays: LessonDay[] = [];
      
      // The loop below fetches all lesson files for the Numbers Path.
      // This data is then combined into a single list for display on one page.
      for (let week = 1; week <= totalWeeksForNumbers; week++) {
        // We pass a dummy day `1` because getOrGenerateLesson returns the whole week file
        const weeklyLesson = await getOrGenerateLesson(
          targetLanguage.toLowerCase(),
          'numbers',
          week,
          validNativeLanguage,
          1
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

    const allWords = allLessonData.flatMap(day => 
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
    }).filter((item): item is LessonItem => !!item);

    const monthsList = monthNames.map(monthName => {
        return calendarWords.find(word => word.english === monthName);
    }).filter((item): item is LessonItem => !!item);

    return { numbers: numbersList, timesOfDay: timesOfDayList, daysOfWeek: daysOfWeekList, months: monthsList };
  }, [allLessonData]);


  if (isLoading || isUserLoading || !isMounted) {
    return <LoadingSkeleton />;
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1">
          <div className="container mx-auto max-w-3xl py-12 px-4">
            <header className="mb-8">
              <h1 className="text-4xl font-bold tracking-tight">Numbers Path</h1>
              <p className="mt-2 text-muted-foreground">Master counting, time, and money in {targetLanguage}.</p>
            </header>

            {numbers.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold tracking-tight mt-12 mb-4">Numbers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {numbers.map((item) => <DataItemCard key={item.id} item={item} language={targetLanguage} />)}
                </div>
              </section>
            )}

            {timesOfDay.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold tracking-tight mt-12 mb-4">Times of the Day</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {timesOfDay.map((item) => <DataItemCard key={item.id} item={item} language={targetLanguage} />)}
                </div>
              </section>
            )}
            
            {daysOfWeek.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold tracking-tight mt-12 mb-4">Days of the Week</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {daysOfWeek.map((item) => <DataItemCard key={item.id} item={item} language={targetLanguage} />)}
                </div>
              </section>
            )}

            {months.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold tracking-tight mt-12 mb-4">Months of the Year</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {months.map((item) => <DataItemCard key={item.id} item={item} language={targetLanguage} />)}
                </div>
              </section>
            )}

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
    </TooltipProvider>
  );
}
