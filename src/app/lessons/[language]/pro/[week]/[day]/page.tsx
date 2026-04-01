'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useDoc, updateDocumentNonBlocking } from '@/firebase';
import { doc, arrayUnion } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { proLessonTopics } from '@/lib/proLessonTopics';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Volume2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProLessonPage() {
  const params = useParams();
  const language = params.language as string;
  const week = parseInt(params.week as string);
  const day = parseInt(params.day as string);

  const { user } = useUser();
  const firestore = useFirestore();
  const [lesson, setLesson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    // Check if already completed
    const langKey = language.toLowerCase();
    const completed = userProfile?.languageProgress?.[langKey]?.pro?.completedDays || [];
    const dayKey = `${week}-${day}`;
    if (completed.includes(dayKey)) setIsComplete(true);

    // Fetch lesson
    const nativeLang = localStorage.getItem('nativeLanguage') || 'English';
    const topic = proLessonTopics[week]?.[day] || `Professional Language Week ${week} Day ${day}`;

    fetch('/api/pro-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: language.charAt(0).toUpperCase() + language.slice(1),
        nativeLanguage: nativeLang,
        week, day, topic,
      }),
    })
      .then(res => res.json())
      .then(data => { setLesson(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, [isMounted, language, week, day, userProfile]);

  const handleComplete = () => {
    setIsComplete(true);
    if (!userProfileRef) return;
    const langKey = language.toLowerCase();
    const dayKey = `${week}-${day}`;
    updateDocumentNonBlocking(userProfileRef, {
      [`languageProgress.${langKey}.pro.completedDays`]: arrayUnion(dayKey),
      [`languageProgress.${langKey}.pro.lastWeek`]: week,
      [`languageProgress.${langKey}.pro.lastDay`]: day,
    });
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language.toLowerCase();
    speechSynthesis.speak(utterance);
  };

  if (!isMounted) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1 container mx-auto max-w-2xl py-8 px-4">
        <div className="mb-6">
          <div className="text-sm text-muted-foreground mb-1">Pro Path • Week {week} • Day {day}</div>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">AI lesson generate කරනවා...</span>
            </div>
          ) : lesson ? (
            <div className="space-y-6">
              <Card className={cn("transition-all duration-500", isComplete && "border-2 border-green-500 shadow-lg shadow-green-500/20")}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold">{lesson.title}</h1>
                    {isComplete && <CheckCircle className="h-6 w-6 text-green-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{lesson.topic}</p>
                </CardContent>
              </Card>

              {/* Vocabulary */}
              {lesson.vocabulary?.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">📚 Vocabulary</h2>
                  <div className="space-y-3">
                    {lesson.vocabulary.map((item: any, i: number) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xl font-bold text-primary">{item.target}</div>
                              <div className="text-sm text-muted-foreground">{item.native}</div>
                              <div className="text-xs text-blue-400">/{item.phonetic}/</div>
                            </div>
                            <Button variant="outline" size="icon" onClick={() => speak(item.target)}>
                              <Volume2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {item.example && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                              <div className="text-sm italic">"{item.example}"</div>
                              <div className="text-xs text-muted-foreground">"{item.example_native}"</div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Phrases */}
              {lesson.phrases?.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">💬 Useful Phrases</h2>
                  <div className="space-y-3">
                    {lesson.phrases.map((item: any, i: number) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-primary">{item.target}</div>
                            <Button variant="outline" size="icon" onClick={() => speak(item.target)}>
                              <Volume2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-sm text-muted-foreground">{item.native}</div>
                          <div className="text-xs text-yellow-500 mt-1">💡 {item.situation}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Cultural tip */}
              {lesson.cultural_tip && (
                <Card className="bg-yellow-500/10 border-yellow-500/30">
                  <CardContent className="p-4">
                    <div className="font-semibold text-yellow-400 mb-1">🌍 Cultural Tip</div>
                    <div className="text-sm">{lesson.cultural_tip}</div>
                  </CardContent>
                </Card>
              )}

              {/* Grammar note */}
              {lesson.grammar_note && (
                <Card className="bg-blue-500/10 border-blue-500/30">
                  <CardContent className="p-4">
                    <div className="font-semibold text-blue-400 mb-1">📖 Grammar Note</div>
                    <div className="text-sm">{lesson.grammar_note}</div>
                  </CardContent>
                </Card>
              )}

              {/* Complete button */}
              <div className="relative">
                <div className="absolute -inset-20 pointer-events-none" />
                {!isComplete ? (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleComplete}
                    onTouchEnd={(e) => { e.preventDefault(); handleComplete(); }}
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Lesson Complete ✓
                  </Button>
                ) : (
                  <div className="w-full py-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-500 font-semibold text-center flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    සම්පූර්ණයි! 🎉
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">Lesson load නොවුණා. Retry කරන්නකො.</div>
          )}
        </div>
      </main>
    </div>
  );
}
