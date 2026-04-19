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
import { CheckCircle, Volume2, Loader2, BookOpen, MessagesSquare, Globe, PenSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
    
    const langKey = language.toLowerCase();
    const completed = userProfile?.languageProgress?.[langKey]?.pro?.completedDays || [];
    const dayKey = `${week}-${day}`;
    if (completed.includes(dayKey)) setIsComplete(true);

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

  const proLessonBg = PlaceHolderImages.find(p => p.id === 'pro-lesson-background');

  if (!isMounted) return <div className="flex min-h-dvh flex-col bg-background" />;

  return (
    <div className="relative min-h-dvh flex flex-col bg-background">
      {proLessonBg && (
          <div className="fixed inset-0 z-[-1] opacity-20">
              <Image
                  src={proLessonBg.imageUrl}
                  alt={proLessonBg.description}
                  fill
                  style={{ objectFit: 'cover' }}
                  data-ai-hint={proLessonBg.imageHint}
                  priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/50" />
          </div>
      )}
      <Navigation />
      <main className="flex-1 container mx-auto max-w-2xl py-8 px-4">
        <div className="mb-6">
          <div className="text-sm text-purple-400 font-semibold mb-1">Pro Path • Week {week} • Day {day}</div>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">AI lesson generate කරනවා...</span>
            </div>
          ) : lesson ? (
            <div className="space-y-8">
              <Card className={cn("transition-all duration-500 bg-card/80 backdrop-blur-sm border-primary/20", isComplete && "border-2 border-green-500 shadow-lg shadow-green-500/20")}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">{lesson.title}</h1>
                    {isComplete && <CheckCircle className="h-8 w-8 text-green-500" />}
                  </div>
                  <p className="text-muted-foreground">{lesson.topic}</p>
                </CardContent>
              </Card>

              {lesson.vocabulary?.length > 0 && (
                <Card className="bg-card/80 backdrop-blur-sm border-primary/10">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5 text-purple-400"/> Vocabulary</h2>
                    <div className="space-y-4">
                      {lesson.vocabulary.map((item: any, i: number) => (
                        <div key={i} className="p-4 rounded-lg bg-muted/50 border border-border/50">
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
                            <div className="mt-3 pt-3 border-t border-border/30">
                              <div className="text-sm italic">"{item.example}"</div>
                              <div className="text-xs text-muted-foreground mt-1">"{item.example_native}"</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {lesson.phrases?.length > 0 && (
                <Card className="bg-card/80 backdrop-blur-sm border-primary/10">
                   <CardContent className="p-6">
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><MessagesSquare className="h-5 w-5 text-purple-400"/> Useful Phrases</h2>
                      <div className="space-y-4">
                        {lesson.phrases.map((item: any, i: number) => (
                          <div key={i} className="p-4 rounded-lg bg-muted/50 border border-border/50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-semibold text-primary">{item.target}</div>
                                <div className="text-sm text-muted-foreground mt-1">{item.native}</div>
                                <div className="text-xs text-yellow-500 mt-2">💡 {item.situation}</div>
                              </div>
                              <Button variant="outline" size="icon" onClick={() => speak(item.target)} className="ml-4 shrink-0">
                                <Volume2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                   </CardContent>
                </Card>
              )}
              
              {lesson.cultural_tip && (
                <Card className="bg-yellow-950/30 backdrop-blur-sm border-yellow-500/30">
                  <CardContent className="p-6">
                    <h2 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2"><Globe className="h-5 w-5" /> Cultural Tip</h2>
                    <div className="text-sm text-yellow-200/80">{lesson.cultural_tip}</div>
                  </CardContent>
                </Card>
              )}
              
              {lesson.grammar_note && (
                <Card className="bg-blue-950/30 backdrop-blur-sm border-blue-500/30">
                  <CardContent className="p-6">
                    <h2 className="font-semibold text-blue-400 mb-2 flex items-center gap-2"><PenSquare className="h-5 w-5" /> Grammar Note</h2>
                    <div className="text-sm text-blue-200/80">{lesson.grammar_note}</div>
                  </CardContent>
                </Card>
              )}

              <div className="relative pt-8">
                {!isComplete ? (
                  <Button size="lg" className="w-full" onClick={handleComplete}>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Mark Lesson as Complete
                  </Button>
                ) : (
                  <div className="w-full py-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 font-semibold text-center flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Lesson Completed! 🎉
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">Lesson could not be loaded. Please try again.</div>
          )}
        </div>
      </main>
    </div>
  );
}
