'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
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
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const targetLanguage = userProfile?.selectedLanguage || (isMounted && localStorage.getItem('targetLanguage')) || 'French';
  
  const completedDays = useMemo(() => {
    const progress = userProfile?.languageProgress?.[targetLanguage.toLowerCase()]?.['numbers'];
    return progress?.completedDays || [];
  }, [userProfile, targetLanguage]);

  const numbers = Array.from({ length: 28 }, (_, i) => i + 1);

  if (isUserLoading || !isMounted || isProfileLoading) {
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
            const dayKey = `${week}-${day}`;
            const isDayCompleted = completedDays.includes(dayKey);

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
