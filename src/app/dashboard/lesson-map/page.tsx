'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Navigation } from '@/components/Navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, BookOpen, MessageSquare, BrainCircuit, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---
interface LessonNode {
  day: number;
  topic: string;
  icon: string;
  unlocked: boolean;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface QuizData {
  questions: QuizQuestion[];
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
const proPathLessons: LessonNode[] = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    let topic = '';
    let icon = '';
    
    // Citizenship Prep (Days 1-7)
    if (day <= 7) {
        icon = '🛂';
        const week1Topics = [
            "Understanding the Application Form",
            "Gathering Personal Documents",
            "Writing a Personal Statement",
            "Common Interview Questions: Background",
            "Common Interview Questions: New Life",
            "Navigating Application Portals",
            "Week 1 Review: Application Process",
        ];
        topic = week1Topics[day - 1];
    } 
    // Legal Framework (Days 8-14)
    else if (day <= 14) {
        icon = '📜';
        const week2Topics = [
            "Understanding Your Visa/Work Permit",
            "Your Rights as a Worker",
            "Reading a Rental Agreement",
            "Registering with Local Authorities",
            "Opening a Bank Account",
            "Accessing Healthcare Services",
            "Week 2 Review: Legal & Admin",
        ];
        topic = week2Topics[day - 8];
    }
    // Exam Prep (Days 15-21)
    else if (day <= 21) {
        icon = '🎓';
        const week3Topics = [
            "Language Test: Speaking & Listening",
            "Language Test: Reading & Writing",
            "Civic Test: National History",
            "Civic Test: National Symbols",
            "Practice Language Test",
            "Practice Civic Test",
            "Week 3 Review: Test Prep",
        ];
        topic = week3Topics[day - 15];
    }
    // Grammar & Culture (Days 22-28)
    else if (day <= 28) {
        icon = '✍️';
        const week4Topics = [
            "Advanced Grammar: Conditionals",
            "Cultural Nuances: Social Etiquette",
            "Grammar: Tenses for Storytelling",
            "Cultural Nuances: Workplace Styles",
            "Advanced Grammar: Idioms",
            "Cultural Nuances: Celebrations",
            "Week 4 Review: Grammar & Culture",
        ];
        topic = week4Topics[day - 22];
    }
    // Final Days
    else {
        icon = '🚀';
        const finalTopics = [
            "Final Review: Citizenship Scenario",
            "Next Steps: Life as a New Citizen"
        ];
        topic = finalTopics[day - 29];
    }
    
    return {
        day: day,
        topic: topic,
        icon: icon,
        unlocked: day <= 5, // Unlock first 5 days for demo
    };
});

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

function QuizTab({ day, topic, nativeLanguage, targetLanguage }: { day: number, topic: string, nativeLanguage: string, targetLanguage: string }) {
  const [quizState, setQuizState] = useState<'idle' | 'loading' | 'active' | 'finished'>('idle');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);

  const fetchQuiz = async () => {
    setQuizState('loading');
    try {
      const response = await fetch('/api/ai-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, day, nativeLanguage, targetLanguage }),
      });
      if (!response.ok) throw new Error('Failed to fetch quiz');
      const data: QuizData = await response.json();
      setQuizData(data);
      setQuizState('active');
    } catch (error) {
      console.error(error);
      setQuizState('idle'); // Or an 'error' state
    }
  };

  const handleAnswerChange = (questionIndex: number, optionIndex: number) => {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleSubmit = () => {
    if (!quizData) return;
    let newScore = 0;
    quizData.questions.forEach((q, index) => {
      if (userAnswers[index] === q.correct) {
        newScore++;
      }
    });
    setScore(newScore);
    setQuizState('finished');
  };

  const handleRetry = () => {
      setUserAnswers({});
      setScore(0);
      setQuizState('idle');
  }

  if (quizState === 'idle') {
    return <div className="text-center p-8"><Button onClick={fetchQuiz}>Start Quiz</Button></div>;
  }

  if (quizState === 'loading') {
    return <div className="text-center p-8 flex items-center justify-center gap-2"><Loader2 className="animate-spin h-5 w-5" /> Loading Quiz...</div>;
  }

  if (quizState === 'finished') {
    return (
      <div className="p-4 text-center">
        <h3 className="text-2xl font-bold">Quiz Complete!</h3>
        <p className="text-4xl font-bold my-4">{score} / {quizData?.questions.length}</p>
        <div className="space-y-4 text-left">
          {quizData?.questions.map((q, qIndex) => (
            <div key={qIndex} className={cn("p-3 rounded-lg border", userAnswers[qIndex] === q.correct ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10')}>
              <p className="font-semibold">{q.question}</p>
              <p className={cn("text-sm mt-1", userAnswers[qIndex] === q.correct ? 'text-green-400' : 'text-red-400')}>
                Your answer: {q.options[userAnswers[qIndex]]} {userAnswers[qIndex] === q.correct ? <CheckCircle className="inline h-4 w-4" /> : <XCircle className="inline h-4 w-4" />}
              </p>
              {userAnswers[qIndex] !== q.correct && <p className="text-sm text-green-400">Correct answer: {q.options[q.correct]}</p>}
              <p className="text-xs text-muted-foreground mt-2">{q.explanation}</p>
            </div>
          ))}
        </div>
        <Button onClick={handleRetry} className="mt-6">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {quizData?.questions.map((q, qIndex) => (
        <div key={qIndex}>
          <p className="font-semibold mb-3">{qIndex + 1}. {q.question}</p>
          <RadioGroup onValueChange={(value) => handleAnswerChange(qIndex, parseInt(value))}>
            {q.options.map((option, oIndex) => (
              <div key={oIndex} className="flex items-center space-x-2">
                <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}o${oIndex}`} />
                <Label htmlFor={`q${qIndex}o${oIndex}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}
      <Button onClick={handleSubmit} disabled={Object.keys(userAnswers).length !== quizData?.questions.length} className="w-full">
        Submit Quiz
      </Button>
    </div>
  );
}

function LessonMapPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonNode | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const nodeColors = ["#FF6B6B", "#FF9F43", "#FECA57", "#48DBFB", "#FF9FF3", "#54A0FF", "#5F27CD", "#00D2D3", "#1DD1A1"];

  const userProfileRef = useMemoFirebase(() => user && firestore ? doc(firestore, "userProfiles", user.uid) : null, [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => { setIsMounted(true); }, []);

  const nativeLanguage = userProfile?.nativeLanguage || (isMounted && localStorage.getItem('nativeLanguage')) || 'English';
  const targetLanguage = userProfile?.selectedLanguage || (isMounted && localStorage.getItem('targetLanguage')) || 'French';
  
  const handleNodeClick = (lesson: LessonNode) => {
    if (lesson.unlocked) {
      router.push(`/lessons/${targetLanguage.toLowerCase()}/pro/${lesson.week}/${lesson.day}`);
    }
  };

  if (!isMounted || isUserLoading || isProfileLoading) {
    return <LoadingSkeleton />;
  }

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
          <p className="mt-2 text-muted-foreground">Your 30-day journey to advanced fluency in {targetLanguage}.</p>
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
                    <div key={lesson.day} className={cn("relative flex items-center py-4", isCardOnLeft ? 'justify-start' : 'justify-end')}>
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
        
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetContent side="bottom" className="h-[85dvh]">
            {selectedLesson && (
              <>
                <SheetHeader className="text-center">
                  <SheetTitle>Day {selectedLesson.day}: {selectedLesson.topic}</SheetTitle>
                  <SheetDescription>Lesson content for your Pro Path in {targetLanguage}.</SheetDescription>
                </SheetHeader>
                <Tabs defaultValue="words" className="w-full mt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="words"><BookOpen className="mr-2 h-4 w-4" />Words</TabsTrigger>
                    <TabsTrigger value="talk"><MessageSquare className="mr-2 h-4 w-4"/>Talk</TabsTrigger>
                    <TabsTrigger value="quiz"><BrainCircuit className="mr-2 h-4 w-4"/>Quiz</TabsTrigger>
                  </TabsList>
                  <TabsContent value="words" className="p-4 text-center">
                    <p className="text-muted-foreground">Word list and practice coming soon!</p>
                  </TabsContent>
                  <TabsContent value="talk" className="p-4 text-center">
                     <p className="text-muted-foreground">AI conversation practice coming soon!</p>
                  </TabsContent>
                  <TabsContent value="quiz">
                    <Suspense fallback={<div className="text-center p-8">Loading Quiz...</div>}>
                        <QuizTab 
                            day={selectedLesson.day}
                            topic={selectedLesson.topic}
                            nativeLanguage={nativeLanguage}
                            targetLanguage={targetLanguage}
                        />
                    </Suspense>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </SheetContent>
        </Sheet>

      </main>
    </div>
  );
}

export default LessonMapPage;
