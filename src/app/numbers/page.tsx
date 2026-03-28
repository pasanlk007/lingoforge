'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import type { UserProfile, UserWeekProgress } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const LoadingSkeleton = () => (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1 container mx-auto max-w-4xl py-12 px-4 space-y-4">
          <Skeleton className="h-10 w-1/2 mx-auto" />
          <div className="mt-8 grid grid-cols-4 md:grid-cols-7 gap-3">
            {Array.from({ length: 28 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-16" />
            ))}
          </div>
      </main>
    </div>
);

export default function NumbersPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, "userProfiles", user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  
  const progressCollectionRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'userProgress', user.uid, 'numbers');
  }, [user, firestore]);

  const { data: progressData, isLoading: isProgressLoading } = useCollection<UserWeekProgress>(progressCollectionRef);

  const completedDays = useMemo(() => {
    if (!progressData) return {};
    const completedDaysMap: { [week: number]: number[] } = {};
    progressData.forEach(weekProgress => {
        completedDaysMap[weekProgress.week] = weekProgress.daysCompleted;
    });
    return completedDaysMap;
  }, [progressData]);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const targetLanguage = userProfile?.selectedLanguage || (isMounted && localStorage.getItem('targetLanguage')) || 'French';
  
  const numbers = Array.from({ length: 28 }, (_, i) => i + 1);

  if (isUserLoading || !isMounted || isProfileLoading || isProgressLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />

      <main className="flex-1 container mx-auto max-w-4xl py-12 px-4">
        <h1 className="text-4xl font-bold text-center mb-8">
          Numbers Path
        </h1>

        <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
          {numbers.map((num) => {
            const week = Math.ceil(num / 7);
            const day = ((num - 1) % 7) + 1;
            const isDayCompleted = completedDays[week]?.includes(day);

            return (
              <Link
                key={num}
                href={`/lessons/${targetLanguage.toLowerCase()}/numbers/${week}/${day}`}
              >
                <Button className={cn(
                  "w-full h-16 text-lg font-bold",
                  isDayCompleted && 'bg-green-600 text-white hover:bg-green-700'
                )}>
                  {isDayCompleted && <Check className="mr-1 h-5 w-5" />}
                  {num}
                </Button>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
