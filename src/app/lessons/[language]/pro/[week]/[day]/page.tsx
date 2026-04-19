'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, useDoc, updateDocumentNonBlocking } from '@/firebase';
import { doc, arrayUnion } from 'firebase/firestore';
import type { UserProfile, LearningPath } from '@/lib/types';
import { proLessonTopics } from '@/lib/proLessonTopics';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Volume2, Loader2, BookOpen, MessagesSquare, Globe, PenSquare, BrainCircuit, XCircle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { playAudio } from '@/lib/audioPlayer';
import { canAccessLesson } from '@/lib/accessControl';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Confetti = dynamic(() => import('react-dom-confetti'), { ssr: false });

const confettiConfig = {
  angle: 90, spread: 360, startVelocity: 40, elementCount: 90, dragFriction: 0.12,
  duration: 4000, stagger: 3, width: "10px", height: "10px", perspective: "500px",
  colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
};

// --- Helper Functions & Types ---
type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// --- Page Component ---
export default function ProLessonPage() {
  const params = useParams();
  const router = useRouter();
  const { language, week: weekStr, day: dayStr } = params;
  
  const week = parseInt(weekStr as string);
  const day = parseInt(dayStr as string);

  const { user } = useUser();
  const firestore = useFirestore();

  const [lesson, setLesson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('learn');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number | null>>({});
  const [quizResult, setQuizResult] = useState<'pass' | 'fail' | null>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const nativeLanguage = isMounted ? localStorage.getItem('nativeLanguage') || 'English' : 'English';
  
  const access = useMemo(() => {
    if (isProfileLoading || !isMounted) return { allowed: false };
    return canAccessLesson({
      path: 'pro',
      week: week,
      day: day,
      language: language as string,
      userEmail: user?.email,
      profile: userProfile,
    });
  }, [userProfile, isProfileLoading, isMounted, week, day, language, user]);


  useEffect(() => {
    setIsMounted(true);

    if (isProfileLoading || !isMounted || !access.allowed) {
      if(isMounted && !isProfileLoading) setIsLoading(false);
      return;
    }
    
    const dayKey = `${week}-${day}`;
    const langKey = (language as string).toLowerCase();
    const completedDays = userProfile?.languageProgress?.[langKey]?.pro?.completedDays || [];
    if (completedDays.includes(dayKey)) {
      setIsComplete(true);
    }

    const fetchLesson = async () => {
      setIsLoading(true);
      const topic = proLessonTopics[week]?.[day] || `Professional Language Week ${week} Day ${day}`;
      
      try {
        const res = await fetch('/api/pro-lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language, nativeLanguage, week, day, topic }),
        });
        if (!res.ok) throw new Error('Failed to fetch lesson');
        const data = await res.json();
        setLesson(data);
        generateQuiz(data.vocabulary);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLesson();

  }, [isMounted, isProfileLoading, access.allowed, language, nativeLanguage, week, day, userProfile]);
  
  const generateQuiz = (vocabulary: any[]) => {
    if (!vocabulary || vocabulary.length < 4) {
      setQuizQuestions([]);
      return;
    };
    
    const questions = vocabulary.map((word, index) => {
      const correctMeaning = word.native;
      const otherMeanings = vocabulary
        .filter((_, i) => i !== index)
        .map(v => v.native);
      
      const incorrectOptions = shuffleArray(otherMeanings).slice(0, 3);
      const options = shuffleArray([correctMeaning, ...incorrectOptions]);
      const correctIndex = options.findIndex(opt => opt === correctMeaning);
      
      return { question: word.target, options, correctIndex };
    });
    setQuizQuestions(shuffleArray(questions).slice(0, 5)); // Take 5 random questions
  };

  const handleAnswer = (questionIndex: number, answerIndex: number) => {
    setUserAnswers(prev => ({...prev, [questionIndex]: answerIndex}));
  }

  const checkQuiz = () => {
    const correctCount = quizQuestions.reduce((acc, q, i) => {
      return userAnswers[i] === q.correctIndex ? acc + 1 : acc;
    }, 0);
    const passed = correctCount / quizQuestions.length >= 0.6; // 60% to pass
    setQuizResult(passed ? 'pass' : 'fail');
    if (passed) {
      handleComplete();
    }
  }

  const handleComplete = () => {
    if (isComplete || !userProfileRef) return;
    setIsComplete(true);
    const langKey = (language as string).toLowerCase();
    const dayKey = `${week}-${day}`;
    updateDocumentNonBlocking(userProfileRef, {
      [`languageProgress.${langKey}.pro.completedDays`]: arrayUnion(dayKey),
      [`languageProgress.${langKey}.pro.lastWeek`]: week,
      [`languageProgress.${langKey}.pro.lastDay`]: day,
    });
  };

  const proLessonBg = PlaceHolderImages.find(p => p.id === 'pro-lesson-background');

  if (isLoading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">AI lesson generate කරනවා...</p>
      </div>
    );
  }

  if (!access.allowed) {
     return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1 container mx-auto flex items-center justify-center py-12 max-w-2xl text-center px-4">
          <Card className="bg-card/80 backdrop-blur-sm p-8">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold mb-2">Pro Lesson Locked</h1>
            <p className="text-muted-foreground mb-6">You need a Pro subscription to access this lesson. Upgrade your plan to continue.</p>
            <Button asChild>
              <Link href="/pricing">Upgrade to Pro</Link>
            </Button>
          </Card>
        </main>
      </div>
    );
  }
  
  if (!lesson) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1 container mx-auto flex items-center justify-center py-12 max-w-2xl text-center px-4">
            <p>Error loading lesson. Please try again.</p>
        </main>
      </div>
    );
  }

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
      <main className="flex-1 container mx-auto max-w-3xl py-8 px-4">
        <div className="mb-6">
          <div className="text-sm text-purple-400 font-semibold mb-1">Pro Path • Week {week} • Day {day}</div>
          <div className={cn("transition-all duration-500 bg-card/80 backdrop-blur-sm border-primary/20 p-6 rounded-xl", isComplete && "border-2 border-green-500 shadow-lg shadow-green-500/20")}>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">{lesson.title}</h1>
              {isComplete && <CheckCircle className="h-8 w-8 text-green-500" />}
            </div>
            <p className="text-muted-foreground">{lesson.topic}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 bg-black/20 p-1 rounded-full mb-6">
            <button onClick={() => setActiveTab('learn')} className={cn("py-2 rounded-full text-sm font-bold transition-colors", activeTab === 'learn' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/5')}>Learn</button>
            <button onClick={() => setActiveTab('talk')} className={cn("py-2 rounded-full text-sm font-bold transition-colors", activeTab === 'talk' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/5')}>Talk</button>
            <button onClick={() => setActiveTab('quiz')} className={cn("py-2 rounded-full text-sm font-bold transition-colors", activeTab === 'quiz' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/5')}>Quiz</button>
        </div>
        
        {/* Tab Content */}
        <div className="space-y-8">
            {activeTab === 'learn' && (
                <div className="space-y-6 animate-in fade-in-20">
                    <Card className="bg-card/80 backdrop-blur-sm border-primary/10"><CardContent className="p-6">
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5 text-purple-400"/> Vocabulary</h2>
                      <div className="space-y-4">{lesson.vocabulary.map((item: any, i: number) => (
                        <div key={i} className="p-4 rounded-lg bg-muted/50 border border-border/50"><div className="flex items-center justify-between">
                            <div><div className="text-xl font-bold text-primary">{item.target}</div><div className="text-sm text-muted-foreground">{item.native}</div><div className="text-xs text-blue-400">/{item.phonetic}/</div></div>
                            <Button variant="outline" size="icon" onClick={() => playAudio(item.target, language as string, 1)}><Volume2 className="h-4 w-4" /></Button>
                        </div>{item.example && (<div className="mt-3 pt-3 border-t border-border/30"><div className="text-sm italic">"{item.example}"</div><div className="text-xs text-muted-foreground mt-1">"{item.example_native}"</div></div>)}</div>))}</div>
                    </CardContent></Card>
                    <Card className="bg-card/80 backdrop-blur-sm border-primary/10"><CardContent className="p-6">
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><MessagesSquare className="h-5 w-5 text-purple-400"/> Useful Phrases</h2>
                      <div className="space-y-4">{lesson.phrases.map((item: any, i: number) => (
                        <div key={i} className="p-4 rounded-lg bg-muted/50 border border-border/50"><div className="flex items-start justify-between">
                            <div className="flex-1"><div className="font-semibold text-primary">{item.target}</div><div className="text-sm text-muted-foreground mt-1">{item.native}</div><div className="text-xs text-yellow-500 mt-2">💡 {item.situation}</div></div>
                            <Button variant="outline" size="icon" onClick={() => playAudio(item.target, language as string, 1)} className="ml-4 shrink-0"><Volume2 className="h-4 w-4" /></Button>
                        </div></div>))}</div>
                    </CardContent></Card>
                    {lesson.cultural_tip && (<Card className="bg-yellow-950/30 backdrop-blur-sm border-yellow-500/30"><CardContent className="p-6"><h2 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2"><Globe className="h-5 w-5" /> Cultural Tip</h2><div className="text-sm text-yellow-200/80">{lesson.cultural_tip}</div></CardContent></Card>)}
                    {lesson.grammar_note && (<Card className="bg-blue-950/30 backdrop-blur-sm border-blue-500/30"><CardContent className="p-6"><h2 className="font-semibold text-blue-400 mb-2 flex items-center gap-2"><PenSquare className="h-5 w-5" /> Grammar Note</h2><div className="text-sm text-blue-200/80">{lesson.grammar_note}</div></CardContent></Card>)}
                </div>
            )}
            
            {activeTab === 'talk' && (
                <div className="animate-in fade-in-20">
                  <Card className="bg-card/80 backdrop-blur-sm border-primary/10"><CardContent className="p-6">
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><MessagesSquare className="h-5 w-5 text-purple-400"/> Practice Phrases</h2>
                      <p className="text-sm text-muted-foreground mb-4">Read these phrases aloud to practice your pronunciation.</p>
                      <div className="space-y-4">{lesson.phrases.map((item: any, i: number) => (
                        <div key={i} className="p-4 rounded-lg bg-muted/50 border border-border/50"><div className="flex items-start justify-between">
                            <div className="flex-1"><div className="font-semibold text-lg text-primary">{item.target}</div><div className="text-sm text-muted-foreground mt-1">{item.native}</div></div>
                            <Button variant="outline" size="icon" onClick={() => playAudio(item.target, language as string, 1)} className="ml-4 shrink-0"><Volume2 className="h-4 w-4" /></Button>
                        </div></div>))}</div>
                  </CardContent></Card>
                </div>
            )}

            {activeTab === 'quiz' && (
                <div className="animate-in fade-in-20">
                   <Card className="bg-card/80 backdrop-blur-sm border-primary/10"><CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-purple-400"/> Knowledge Check</h2>
                    {!quizResult && (<div className="space-y-6">{quizQuestions.map((q, i) => (
                      <div key={i}><p className="font-semibold mb-3">{i+1}. What is "{q.question}"?</p><div className="grid grid-cols-2 gap-2">{q.options.map((opt, j) => (
                        <Button key={j} variant={userAnswers[i] === j ? 'default' : 'secondary'} onClick={() => handleAnswer(i, j)} className="h-auto py-3 justify-start text-left whitespace-normal">{opt}</Button>
                      ))}</div></div>
                    ))}
                    <Button className="w-full" onClick={checkQuiz} disabled={Object.keys(userAnswers).length !== quizQuestions.length}>Check Answers</Button>
                    </div>)}
                    {quizResult === 'pass' && (<div className="text-center py-8">
                        <div className="relative inline-block"><Confetti active={true} config={confettiConfig}/><CheckCircle className="h-16 w-16 text-green-500"/></div>
                        <h3 className="text-xl font-bold mt-4">Quiz Passed!</h3><p className="text-muted-foreground">Great job! You have completed the lesson.</p>
                    </div>)}
                     {quizResult === 'fail' && (<div className="text-center py-8">
                        <XCircle className="h-16 w-16 text-destructive mx-auto"/>
                        <h3 className="text-xl font-bold mt-4">Not Quite</h3><p className="text-muted-foreground mb-4">Review the material and try again.</p>
                        <Button onClick={() => { setQuizResult(null); setUserAnswers({}); }}>Try Again</Button>
                    </div>)}
                  </CardContent></Card>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
