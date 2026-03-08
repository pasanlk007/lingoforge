'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { Lock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { translations } from '@/lib/translations';

export default function SurvivalPathPage() {
  const [targetLanguage, setTargetLanguage] = useState('french');
  const [nativeLanguage, setNativeLanguage] = useState<keyof typeof translations>('English');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const savedTargetLang = localStorage.getItem('targetLanguage');
    if (savedTargetLang) {
      setTargetLanguage(savedTargetLang.toLowerCase());
    }
    const savedNativeLang = localStorage.getItem('nativeLanguage') as keyof typeof translations;
    if (savedNativeLang && translations[savedNativeLang]) {
      setNativeLanguage(savedNativeLang);
    }
    setIsMounted(true);
  }, []);

  const t = (isMounted && translations[nativeLanguage]?.ui) ? translations[nativeLanguage].ui : translations.English.ui;

  const totalWeeks = 48;
  const unlockedWeeks = 12;

  // This would come from user data in a real app
  const completedDays = {
    1: [], // User has completed 0 days in week 1 for this path
  };

  if (!isMounted) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1 container mx-auto max-w-3xl py-12 px-4 space-y-4">
            <Skeleton className="h-10 w-1/2 mx-auto" />
            <Skeleton className="h-6 w-3/4 mx-auto" />
            <div className="mt-8 space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full opacity-70" />
                <Skeleton className="h-14 w-full opacity-70" />
                <Skeleton className="h-14 w-full opacity-70" />
            </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl py-12 px-4">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight">{t.survivalPath}</h1>
            <p className="mt-2 text-muted-foreground">{t.survivalPathDesc}</p>
          </header>

          <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => {
              const isUnlocked = week <= unlockedWeeks;
              const completedDaysInWeek = completedDays[week as keyof typeof completedDays] || [];
              const isCompleted = completedDaysInWeek.length === 7;
              
              return (
                <AccordionItem key={week} value={`item-${week}`} disabled={!isUnlocked}>
                  <AccordionTrigger className={cn("text-lg hover:no-underline", !isUnlocked && "cursor-not-allowed text-muted-foreground/50")}>
                    <div className="flex w-full items-center justify-between pr-4">
                      <span className="flex items-center gap-3">
                         {!isUnlocked ? <Lock className="h-4 w-4 text-muted-foreground/50" /> : (isCompleted ? <CheckCircle className="h-5 w-5 text-green-500" /> : <div className="w-5 h-5" />) }
                         {t.week} {week}
                      </span>
                      {!isUnlocked && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                          {t.locked}
                        </span>
                      )}
                       {isUnlocked && !isCompleted && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                          {completedDaysInWeek.length} / 7 {t.days}
                        </span>
                      )}
                      {isUnlocked && isCompleted && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-green-500">
                          {t.completed}
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {Array.from({ length: 7 }, (_, j) => j + 1).map((day) => {
                        const isDayCompleted = completedDaysInWeek.includes(day);
                        return (
                          <Button asChild variant={isDayCompleted ? "default" : "secondary"} key={day} className={cn(isDayCompleted && "bg-green-600 hover:bg-green-700")}>
                            <Link href={`/lessons/${targetLanguage}/survival/${week}/${day}`}>
                              {isDayCompleted && <CheckCircle className="mr-2 h-4 w-4"/>}
                              {`${t.day} ${day}`}
                            </Link>
                          </Button>
                        )
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </main>
    </div>
  );
}
