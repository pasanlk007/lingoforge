'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowLeft, Flame, CheckCircle, BookOpen, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WordCard } from '@/components/WordCard';
import { DialoguePanel } from '@/components/DialoguePanel';
import { ExercisePanel } from '@/components/ExercisePanel';
import { ProgressBar } from '@/components/ProgressBar';
import { StreakCounter } from '@/components/StreakCounter';
import type { LanguageLesson } from '@/lib/types';
import Confetti from 'react-dom-confetti';

interface LessonClientPageProps {
    lesson: LanguageLesson;
    currentDay: number;
}

const confettiConfig = {
  angle: 90,
  spread: 360,
  startVelocity: 40,
  elementCount: 70,
  dragFriction: 0.12,
  duration: 3000,
  stagger: 3,
  width: "10px",
  height: "10px",
  perspective: "500px",
  colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
};

export function LessonClientPage({ lesson, currentDay }: LessonClientPageProps) {
    const dayData = lesson.days.find(d => d.day === currentDay);
    
    if (!dayData) {
        return (
          <div className="container mx-auto py-10">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Lesson data for Day {currentDay} could not be found.</AlertDescription>
            </Alert>
          </div>
        )
    }

    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [dayCompleted, setDayCompleted] = useState(false);
    const [exercisesCompleted, setExercisesCompleted] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);

    const handleNextWord = () => {
        setCurrentWordIndex(prev => (prev + 1) % dayData.items.length);
    }

    const handlePrevWord = () => {
        setCurrentWordIndex(prev => (prev - 1 + dayData.items.length) % dayData.items.length);
    }

    const handleExercisesComplete = (isCorrect: boolean) => {
        if (isCorrect) {
          setExercisesCompleted(prev => prev + 1);
        }
    }
    
    const handleCompleteDay = () => {
        // In a real app, this would save progress to Firestore
        setDayCompleted(true);
        setShowConfetti(true);
    }

    const totalExercises = dayData.exercises.fillBlanks.length + dayData.exercises.multipleChoice.length + dayData.exercises.matching.length;
    const exerciseProgress = Math.min((exercisesCompleted / totalExercises) * 100, 100);
    const canCompleteDay = exerciseProgress >= 80; // e.g. require 80% completion

    const progress = (currentDay / 7) * 100;

    return (
        <div className="container mx-auto max-w-3xl py-8 px-4">
            <header className="mb-6">
                <div className="flex items-center justify-between mb-4">
                     <Button variant="ghost" asChild>
                       <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard</Link>
                     </Button>
                     <div className="text-center">
                        <h1 className="font-bold text-lg">{`Week ${lesson.week}, Day ${dayData.day}`}</h1>
                        <p className="text-sm text-muted-foreground">{dayData.title}</p>
                     </div>
                     <StreakCounter count={5} />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">WEEK PROGRESS</span>
                        <ProgressBar value={progress} />
                        <span className="text-sm font-semibold text-muted-foreground">{currentDay}/7</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">DAY PROGRESS</span>
                        <ProgressBar value={exerciseProgress} />
                        <span className="text-sm font-semibold text-muted-foreground">{Math.floor(exerciseProgress)}%</span>
                    </div>
                </div>
            </header>

            <main className="space-y-8">
                {/* Vocabulary Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-6 w-6"/>
                            <span>Vocabulary</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                       <div className="flex flex-col items-center">
                           <WordCard item={dayData.items[currentWordIndex]} language={lesson.language} />
                           <div className="flex items-center justify-center mt-2 w-full max-w-sm">
                                <Button variant="outline" size="icon" onClick={handlePrevWord}><ChevronLeft /></Button>
                                <span className="flex-1 text-center text-sm font-medium text-muted-foreground">{currentWordIndex + 1} / {dayData.items.length}</span>
                                <Button variant="outline" size="icon" onClick={handleNextWord}><ChevronRight /></Button>
                           </div>
                       </div>
                    </CardContent>
                </Card>

                {/* Dialogue Section */}
                {dayData.dialogue && dayData.dialogue.lines.length > 0 && (
                    <DialoguePanel dialogue={dayData.dialogue} language={lesson.language} />
                )}

                {/* Exercises Section */}
                {dayData.exercises && (
                    <ExercisePanel exercises={dayData.exercises} onExercisesComplete={handleExercisesComplete} />
                )}

                {/* Cultural Note Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="text-2xl">🌍</span>
                            <span>Cultural Note</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground italic">"{dayData.culturalNote}"</p>
                    </CardContent>
                </Card>

                {/* Completion Section */}
                <section className="text-center py-6 flex flex-col items-center">
                    <div className="relative">
                        <div className="absolute -inset-20">
                            <Confetti active={showConfetti} config={confettiConfig} />
                        </div>

                        {dayCompleted ? (
                             <Alert className="border-green-500/50 text-green-700 dark:text-green-400 max-w-md mx-auto">
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle className="font-bold">Day Complete!</AlertTitle>
                                <AlertDescription className="text-xs">
                                  You've earned {dayData.progressTracking.xpReward} XP and a {dayData.progressTracking.streakBonus} streak bonus. Keep up the great work!
                                </AlertDescription>
                            </Alert>
                        ) : (
                             <Button size="lg" onClick={handleCompleteDay} disabled={!canCompleteDay}>
                                <CheckCircle className="mr-2 h-5 w-5" />
                                Complete Day (+{dayData.progressTracking.xpReward} XP)
                            </Button>
                        )}
                        {!dayCompleted && !canCompleteDay && <p className="text-xs text-muted-foreground mt-2">Complete at least 80% of the exercises to finish the day.</p>}
                    </div>
                     {dayCompleted && (
                        <Button asChild className="mt-4">
                            <Link href={`/lessons/${lesson.language.toLowerCase()}/${lesson.path}/${lesson.week}/${dayData.day + 1}`}>
                               Go to Day {dayData.day + 1} <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                     )}
                </section>
            </main>
        </div>
    );
}
