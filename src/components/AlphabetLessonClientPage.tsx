
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ProgressBar } from '@/components/ProgressBar';
import { StreakCounter } from '@/components/StreakCounter';
import { AlphabetAudioCard } from '@/components/AlphabetAudioCard';
import { AlphabetWordList } from '@/components/AlphabetWordList';
import { AlphabetExercisePanel } from '@/components/AlphabetExercisePanel';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function AlphabetLessonClientPage({ lessonDay, language, week, day }: any) {
    const [dayCompleted, setDayCompleted] = useState(false);
    const [exercisesCompleted, setExercisesCompleted] = useState(0);
    const [nativeLanguage, setNativeLanguage] = useState('English');

    useEffect(() => {
        const storedLang = localStorage.getItem('nativeLanguage');
        if (storedLang) {
            setNativeLanguage(storedLang);
        }
    }, []);

    const handleExercisesComplete = (isCorrect: boolean) => {
        if (isCorrect) {
          setExercisesCompleted(prev => prev + 1);
        }
    };
    
    const handleCompleteDay = () => {
        setDayCompleted(true);
    };

    const totalExercises = (lessonDay.exercises.fillBlanks.length || 0) + (lessonDay.exercises.multipleChoice.length || 0) + (lessonDay.exercises.matching.length || 0) + (lessonDay.exercises.pronunciation.listenAndRepeat.length || 0);
    const exerciseProgress = totalExercises > 0 ? Math.min((exercisesCompleted / totalExercises) * 100, 100) : 0;
    const canCompleteDay = exerciseProgress >= 1; // For demo, complete after 1 exercise

    return (
        <div className="container mx-auto max-w-3xl py-8 px-4">
            <header className="mb-6">
                <div className="flex items-center justify-between mb-4">
                     <Button variant="ghost" asChild>
                       <Link href="/paths"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Paths</Link>
                     </Button>
                     <div className="text-center">
                        <h1 className="font-bold text-lg">{`Week ${week}, Day ${day}`}</h1>
                        <p className="text-sm text-muted-foreground">{lessonDay.letter}</p>
                     </div>
                     <StreakCounter count={5} />
                </div>
                <div className="space-y-2">
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">DAY PROGRESS</span>
                        <ProgressBar value={exerciseProgress} />
                        <span className="text-sm font-semibold text-muted-foreground">{Math.floor(exerciseProgress)}%</span>
                    </div>
                </div>
            </header>

            <main className="space-y-8">
                <section>
                    <h2 className="font-bold text-xl mb-4">Today's Letter</h2>
                    <AlphabetAudioCard 
                        letter={lessonDay.letter}
                        pronunciation={lessonDay.pronunciation}
                        language={language}
                        nativeLanguage={nativeLanguage}
                    />
                </section>

                <section>
                   <AlphabetWordList items={lessonDay.items} language={language} nativeLanguage={nativeLanguage} />
                </section>
                
                {lessonDay.exercises && (
                    <section>
                        <AlphabetExercisePanel exercises={lessonDay.exercises} language={language} onExercisesComplete={handleExercisesComplete} />
                    </section>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="text-2xl">🌍</span>
                            <span>Cultural Note</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground italic">"{lessonDay.culturalNote[nativeLanguage.toLowerCase()] || lessonDay.culturalNote.english}"</p>
                    </CardContent>
                </Card>

                <section className="text-center py-6">
                    {dayCompleted ? (
                         <Alert className="border-green-500/50 text-green-700 dark:text-green-400 max-w-md mx-auto">
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle className="font-bold">Day Complete!</AlertTitle>
                            <AlertDescription className="text-xs">
                              You've earned 50 XP. Keep up the great work!
                            </AlertDescription>
                        </Alert>
                    ) : (
                         <Button size="lg" onClick={handleCompleteDay} disabled={!canCompleteDay}>
                            <CheckCircle className="mr-2 h-5 w-5" />
                            Complete Day (+50 XP)
                        </Button>
                    )}
                    {!dayCompleted && !canCompleteDay && <p className="text-xs text-muted-foreground mt-2">Complete at least one exercise to finish the day.</p>}
                </section>
            </main>
        </div>
    );
}
