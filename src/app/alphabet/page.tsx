'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile, LessonDay } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { nativeLanguages, translations, targetLanguages } from '@/lib/translations';
import { getOrGenerateLesson } from '@/lib/lessonCache';

const LoadingSkeleton = () => (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1 container mx-auto max-w-4xl py-12 px-4 space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
          <div className="mt-8 grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
            {Array.from({ length: 26 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-16" />
            ))}
          </div>
      </main>
    </div>
);

export default function AlphabetPathPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, "userProfiles", user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  
  const [isMounted, setIsMounted] = useState(false);
  const [allLessonData, setAllLessonData] = useState<LessonDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const nativeLanguage = userProfile?.nativeLanguage || (isMounted && localStorage.getItem('nativeLanguage')) || 'English';
  const targetLanguage = userProfile?.selectedLanguage || (isMounted && localStorage.getItem('targetLanguage')) || 'French';
  const validNativeLanguage = (nativeLanguages.includes(nativeLanguage as string)) ? nativeLanguage : 'English';
  const t = translations[validNativeLanguage as keyof typeof translations].ui || translations.English.ui;

  const targetLanguageInfo = useMemo(() => targetLanguages.find(l => l.lang.toLowerCase() === targetLanguage.toLowerCase()), [targetLanguage]);
  const alphabetSize = targetLanguageInfo?.alphabetSize || 0;
  const totalWeeks = alphabetSize > 0 ? Math.ceil(alphabetSize / 7) : 0;

  useEffect(() => {
    const fetchAllLessons = async () => {
      if (totalWeeks === 0) {
        setAllLessonData([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const allDays: LessonDay[] = [];
      for (let week = 1; week <= totalWeeks; week++) {
        const weeklyLesson = await getOrGenerateLesson(
          targetLanguage.toLowerCase(),
          'alphabet',
          week,
          validNativeLanguage,
          1 // Dummy day, we get the whole week
        );
        if (weeklyLesson && weeklyLesson.days) {
          allDays.push(...weeklyLesson.days);
        }
      }
      // Ensure we only have as many days as there are letters in the alphabet
      setAllLessonData(allDays.slice(0, alphabetSize));
      setIsLoading(false);
    };

    if (isMounted && targetLanguage && validNativeLanguage) {
      fetchAllLessons();
    }
  }, [isMounted, targetLanguage, validNativeLanguage, totalWeeks, alphabetSize]);

  if (isLoading || isUserLoading || !isMounted || isProfileLoading) {
    return <LoadingSkeleton />;
  }

  if (alphabetSize === 0) {
    return (
        <div className="flex min-h-dvh flex-col bg-background">
            <Navigation />
            <main className="flex-1 container mx-auto max-w-3xl py-12 px-4 text-center">
                <h1 className="text-4xl font-bold tracking-tight">Alphabet Path</h1>
                <p className="mt-4 text-lg text-muted-foreground">The Alphabet Path is not applicable for {targetLanguage} due to its complex writing system. Please use the Survival and Numbers paths.</p>
                <Button asChild className="mt-6"><Link href="/dashboard">Back to Dashboard</Link></Button>
            </main>
        </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl py-12 px-4">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight">Alphabet Path</h1>
            <p className="mt-2 text-muted-foreground">A journey to master the writing system of {targetLanguage}.</p>
          </header>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {allLessonData.map((day) => (
              <Button key={`${day.week}-${day.day}`} asChild variant="secondary" className="h-20 text-3xl font-bold">
                <Link href={`/lessons/${targetLanguage.toLowerCase()}/alphabet/${day.week}/${day.day}`}>
                  {day.letter}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
