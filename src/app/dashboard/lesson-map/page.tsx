'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Navigation } from '@/components/Navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { proLessonTopics } from '@/lib/proLessonTopics';
import { canAccessLesson } from '@/lib/accessControl';

// --- Types ---
interface LessonNode {
  day: number;
  topic: string;
  icon: string;
  unlocked: boolean;
}

const PRO_LANGUAGE_MAP: Record<string, { countries: { name: string; flag: string; code: string }[] }> = {
  'Romanian': { countries: [{ name: 'Romania', flag: '🇷🇴', code: 'RO' }] },
  'German': { countries: [{ name: 'Germany', flag: '🇩🇪', code: 'DE' }] },
  'Italian': { countries: [{ name: 'Italy', flag: '🇮🇹', code: 'IT' }] },
  'French': { countries: [{ name: 'France', flag: '🇫🇷', code: 'FR' }, { name: 'Canada', flag: '🇨🇦', code: 'CA' }] },
  'English': { countries: [{ name: 'USA', flag: '🇺🇸', code: 'US' }, { name: 'UK', flag: '🇬🇧', code: 'GB' }, { name: 'Canada', flag: '🇨🇦', code: 'CA' }, { name: 'Singapore', flag: '🇸🇬', code: 'SG' }, { name: 'Ireland', flag: '🇮🇪', code: 'IE' }] },
  'Tamil': { countries: [{ name: 'Singapore', flag: '🇸🇬', code: 'SG' }, { name: 'Canada', flag: '🇨🇦', code: 'CA' }] },
  'Spanish': { countries: [{ name: 'Spain', flag: '🇪🇸', code: 'ES' }] },
  'Portuguese': { countries: [{ name: 'Portugal', flag: '🇵🇹', code: 'PT' }, { name: 'Brazil', flag: '🇧🇷', code: 'BR' }] },
  'Arabic': { countries: [{ name: 'UAE', flag: '🇦🇪', code: 'AE' }, { name: 'Saudi Arabia', flag: '🇸🇦', code: 'SA' }] },
  'Japanese': { countries: [{ name: 'Japan', flag: '🇯🇵', code: 'JP' }] },
  'Korean': { countries: [{ name: 'South Korea', flag: '🇰🇷', code: 'KR' }] },
  'Chinese': { countries: [{ name: 'China', flag: '🇨🇳', code: 'CN' }, { name: 'Singapore', flag: '🇸🇬', code: 'SG' }] },
  'Thai': { countries: [{ name: 'Thailand', flag: '🇹🇭', code: 'TH' }] },
  'Malay': { countries: [{ name: 'Malaysia', flag: '🇲🇾', code: 'MY' }, { name: 'Singapore', flag: '🇸🇬', code: 'SG' }] },
  'Hindi': { countries: [{ name: 'India', flag: '🇮🇳', code: 'IN' }] },
  'Polish': { countries: [{ name: 'Poland', flag: '🇵🇱', code: 'PL' }] },
  'Dutch': { countries: [{ name: 'Netherlands', flag: '🇳🇱', code: 'NL' }] },
  'Swedish': { countries: [{ name: 'Sweden', flag: '🇸🇪', code: 'SE' }] },
  'Greek': { countries: [{ name: 'Greece', flag: '🇬🇷', code: 'GR' }] },
  'Turkish': { countries: [{ name: 'Turkey', flag: '🇹🇷', code: 'TR' }] },
  'Hebrew': { countries: [{ name: 'Israel', flag: '🇮🇱', code: 'IL' }] },
  'Serbian': { countries: [{ name: 'Serbia', flag: '🇷🇸', code: 'RS' }] },
  'Finnish': { countries: [{ name: 'Finland', flag: '🇫🇮', code: 'FI' }] },
  'Czech': { countries: [{ name: 'Czech Republic', flag: '🇨🇿', code: 'CZ' }] },
  'Hungarian': { countries: [{ name: 'Hungary', flag: '🇭🇺', code: 'HU' }] },
};

// --- Data ---
// One icon per week theme (proLessonTopics.ts is the single source of
// truth for topic titles — this file used to keep its own duplicated
// copy of the first 5 weeks, which drifted out of sync as topics grew).
const WEEK_ICONS: Record<number, string> = {
  1: '🛂', 2: '📜', 3: '🎓', 4: '✍️', 5: '🚀',
  6: '💼', 7: '🏥', 8: '👨‍👩‍👧', 9: '💰', 10: '💻', 11: '🚌', 12: '🗣️',
};
const FALLBACK_ICON = '📘';

// --- Components ---

function LoadingSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="container mx-auto max-w-4xl py-12 px-4">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-3/4 mx-auto" />
          <Skeleton className="h-5 w-1/2 mx-auto mt-3" />
        </div>
        <div className="relative w-full">
          <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-border/50" />
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={cn("relative flex items-center my-8", index % 2 === 0 ? 'flex-row-reverse' : '')}>
              <div className="w-1/2 px-4"><Skeleton className="h-24 w-full" /></div>
              <div className="absolute left-1/2 -translate-x-1/2"><Skeleton className="h-12 w-12 rounded-full" /></div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function LessonMapPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const nodeColors = ["#FF6B6B", "#FF9F43", "#FECA57", "#48DBFB", "#FF9FF3", "#54A0FF", "#5F27CD", "#00D2D3", "#1DD1A1"];

  const userProfileRef = useMemoFirebase(() => user && firestore ? doc(firestore, "userProfiles", user.uid) : null, [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => { 
    setIsMounted(true); 
    if (typeof window !== 'undefined' && window.location.hash) {
      const id = window.location.hash.substring(1);
      setTimeout(() => { // timeout to allow everything to render
          const element = document.getElementById(id);
          if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }, 100);
    }
  }, []);

  const targetLanguage = userProfile?.selectedLanguage || (isMounted && localStorage.getItem('targetLanguage')) || 'French';
  const langKey = targetLanguage.toLowerCase();

  const totalProDays = useMemo(() => {
    const weeks = Object.keys(proLessonTopics).map(Number);
    const maxWeek = Math.max(...weeks);
    const maxDayInLastWeek = Math.max(...Object.keys(proLessonTopics[maxWeek]).map(Number));
    return (maxWeek - 1) * 7 + maxDayInLastWeek;
  }, []);

  const proPathLessons: LessonNode[] = useMemo(() => {
    return Array.from({ length: totalProDays }, (_, i) => {
      const day = i + 1;
      const week = Math.floor((day - 1) / 7) + 1;
      const dayInWeek = ((day - 1) % 7) + 1;
      const topic = proLessonTopics[week]?.[dayInWeek] || `Week ${week} Day ${dayInWeek}`;
      const icon = WEEK_ICONS[week] || FALLBACK_ICON;
      const access = canAccessLesson({
        path: 'pro',
        week,
        day: dayInWeek,
        language: langKey,
        userEmail: user?.email,
        profile: userProfile ?? null,
      });
      return { day, topic, icon, unlocked: access.allowed };
    });
  }, [totalProDays, langKey, user?.email, userProfile]);

  const handleNodeClick = (lesson: LessonNode) => {
    if (lesson.unlocked) {
      const week = Math.floor((lesson.day - 1) / 7) + 1;
      const dayInWeek = ((lesson.day - 1) % 7) + 1;
      router.push(`/lessons/${targetLanguage.toLowerCase()}/pro/${week}/${dayInWeek}`);
    }
  };

  if (!isMounted || isUserLoading || isProfileLoading) {
    return <LoadingSkeleton />;
  }

  console.log("DEBUG targetLanguage:", JSON.stringify(targetLanguage));
  const proConfig = PRO_LANGUAGE_MAP[targetLanguage];

  // Not a Pro language
  if (!proConfig) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="container mx-auto max-w-4xl py-12 px-4 text-center">
          <div className="text-6xl mb-6">🚧</div>
          <h1 className="text-3xl font-bold">Coming Soon</h1>
          <p className="text-muted-foreground mt-3">Pro Path for {targetLanguage} is coming soon. Currently available for: Romanian, German, French, Italian, English, Tamil.</p>
          <Button className="mt-8" onClick={() => window.history.back()}>Go Back</Button>
        </main>
      </div>
    );
  }

  // Multiple countries — show picker
  if (proConfig.countries.length > 1 && !selectedCountry) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="container mx-auto max-w-4xl py-12 px-4">
          <header className="text-center mb-12">
            <div className="text-5xl mb-4">🌍</div>
            <h1 className="text-3xl font-bold">Choose Your Country</h1>
            <p className="text-muted-foreground mt-2">Select the country where you want to use {targetLanguage}</p>
          </header>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {proConfig.countries.map((country) => (
              <button
                key={country.code}
                onClick={() => setSelectedCountry(country.name)}
                className="p-6 rounded-2xl border-2 border-border hover:border-primary bg-card flex flex-col items-center gap-3 transition-all hover:scale-105"
              >
                <span className="text-5xl">{country.flag}</span>
                <span className="font-bold text-sm">{country.name}</span>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Single country — auto select
  if (proConfig.countries.length === 1 && !selectedCountry) {
    setSelectedCountry(proConfig.countries[0].name);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="container mx-auto max-w-4xl py-12 px-4">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">LingoForge Pro Path</h1>
          <p className="mt-2 text-muted-foreground">Your {totalProDays}-day journey to advanced fluency in {targetLanguage}.</p>
        </header>

        <div className="relative w-full">
          {/* Center line */}
          <div className="absolute left-1/2 top-8 bottom-8 w-px -translate-x-1/2 border-l-2 border-dashed border-border/30" />

          {/* Lessons */}
          <div className="space-y-1">
            {proPathLessons.map((lesson, index) => {
                const color = nodeColors[index % nodeColors.length];
                const isCardOnLeft = index % 2 === 0;

                return (
                    <div key={lesson.day} id={`day-${lesson.day}`} className={cn("relative flex items-center py-4", isCardOnLeft ? 'justify-start' : 'justify-end')}>
                        {/* Card */}
                        <div className="w-1/2 px-8">
                            <button
                                onClick={() => handleNodeClick(lesson)}
                                disabled={!lesson.unlocked}
                                className={cn(
                                    "w-full p-4 rounded-lg border-t-2 border-b-2 transition-shadow duration-300",
                                    isCardOnLeft ? 'text-left border-l-4' : 'text-right border-r-4',
                                    lesson.unlocked 
                                        ? "bg-card cursor-pointer hover:shadow-lg" 
                                        : "bg-card/50 text-muted-foreground cursor-not-allowed border-border"
                                )}
                                style={lesson.unlocked ? {
                                    borderColor: color,
                                    boxShadow: `0 0 20px ${color}15`
                                } : {}}
                            >
                                <p className="font-bold" style={lesson.unlocked ? { color } : {}}>Day {lesson.day}</p>
                                <p className="text-sm mt-1">{lesson.topic}</p>
                            </button>
                        </div>
                        {/* Node on the center line */}
                        <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
                            <div
                                onClick={() => handleNodeClick(lesson)}
                                className={cn(
                                    "h-16 w-16 rounded-full flex items-center justify-center border-4 transition-transform",
                                    lesson.unlocked ? "cursor-pointer hover:scale-105" : "bg-muted border-border cursor-not-allowed"
                                )}
                                style={lesson.unlocked ? {
                                    borderColor: color,
                                    backgroundColor: `${color}33`,
                                } : {}}
                            >
                                <span className="text-3xl">{lesson.icon}</span>
                            </div>
        
                        </div>
                    </div>
                );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default LessonMapPage;
