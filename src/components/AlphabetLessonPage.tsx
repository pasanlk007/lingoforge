'use client';
import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, arrayUnion } from 'firebase/firestore';
import type { LessonDay, UserProfile } from '@/lib/types';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { translations } from '@/lib/translations';

interface AlphabetLessonPageProps {
  dayData: LessonDay;
  targetLanguage: string;
  userProfile: UserProfile | null;
}

export function AlphabetLessonPage({ dayData, targetLanguage, userProfile }: AlphabetLessonPageProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isComplete, setIsComplete] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if already completed
  useEffect(() => {
    if (!userProfile || !isMounted) return;
    const langKey = targetLanguage.toLowerCase();
    const pathKey = dayData.path;
    const dayKey = `${dayData.week}-${dayData.day}`;
    const completed = userProfile.languageProgress?.[langKey]?.[pathKey]?.completedDays || [];
    if (completed.includes(dayKey)) {
      setIsComplete(true);
    }
  }, [userProfile, isMounted, targetLanguage, dayData]);

  const handleComplete = () => {
    setIsComplete(true);
    if (!userProfileRef) return;
    const langKey = targetLanguage.toLowerCase();
    const pathKey = dayData.path;
    const dayKey = `${dayData.week}-${dayData.day}`;
    updateDocumentNonBlocking(userProfileRef, {
      [`languageProgress.${langKey}.${pathKey}.completedDays`]: arrayUnion(dayKey),
      [`languageProgress.${langKey}.${pathKey}.lastWeek`]: dayData.week,
      [`languageProgress.${langKey}.${pathKey}.lastDay`]: dayData.day,
    });
  };

  if (!isMounted || !dayData) return null;

  const nativeLang = (isMounted && localStorage.getItem('nativeLanguage')) || 'English';
  const t = translations[nativeLang as keyof typeof translations]?.ui || translations.English.ui;

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <Card className={cn(
        "transition-all duration-500",
        isComplete && "border-2 border-green-500 bg-green-950/20 shadow-lg shadow-green-500/20"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {dayData.path === 'alphabet' ? '🔤' : '🔢'} Day {dayData.day}
            </h2>
            {isComplete && (
              <div className="flex items-center gap-2 text-green-500 font-semibold">
                <CheckCircle className="h-6 w-6" />
                <span>{t.dayComplete || 'Complete!'}</span>
              </div>
            )}
          </div>

          {/* Letter header */}
          {dayData.letter && (
            <div className="text-center mb-6 p-4 bg-primary/10 rounded-xl">
              <div className="text-6xl font-bold text-primary">{dayData.letter}</div>
              {dayData.pronunciation_tip && (
                <div className="text-sm text-muted-foreground mt-2">{dayData.pronunciation_tip}</div>
              )}
            </div>
          )}
          {/* Lesson content */}
          <div className="space-y-4 mb-8">
            {dayData.words?.map((item, i) => (
              <div key={i} className="p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">{item.target}</div>
                <div className="text-muted-foreground">{item.native_meaning}</div>
                <div className="text-sm text-blue-400">/{item.phonetic}/</div>
                {item.example_sentence_target && (
                  <div className="text-sm text-muted-foreground mt-2 italic">"{item.example_sentence_target}"</div>
                )}
                {item.example_sentence_native && (
                  <div className="text-xs text-muted-foreground/70">"{item.example_sentence_native}"</div>
                )}
              </div>
            ))}
          </div>

          {!isComplete ? (
            <Button 
              size="lg" 
              className="w-full bg-primary hover:bg-primary/90"
              onClick={handleComplete}
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              {t.completeDay?.replace('{xp}', '') || 'Complete Lesson'}
            </Button>
          ) : (
            <div className="w-full py-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-500 font-semibold text-center flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Lesson Complete! 🎉
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
