
'use client';

import React, { useState, useEffect } from "react";
import Link from 'next/link';
import {
  Flame,
  Star,
  Zap,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Target,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { PathCard } from '@/components/PathCard';
import { PATHS } from '@/lib/constants';
import { cn } from "@/lib/utils";
import { nativeLanguages, translations } from "@/lib/translations";

// Mock data for the dashboard
const userData = {
  name: 'Alex',
  streak: 12,
  xp: 1450,
  level: 8,
  activePath: 'Survival',
  activeLanguage: 'French',
  lastLesson: {
    week: 2,
    day: 3,
  },
  weeklyProgress: [true, true, true, false, false, false, false], // Mon, Tue, Wed completed
};

const levelThreshold = 1500; // XP needed for next level

export default function DashboardPage() {
  const [nativeLanguage, setNativeLanguage] = useState<keyof typeof translations>('English');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
      const savedLang = localStorage.getItem("nativeLanguage") as keyof typeof translations;
      if (savedLang && translations[savedLang]) {
        setNativeLanguage(savedLang);
      }
      setIsMounted(true);
  }, []);

  useEffect(() => {
      if(isMounted) {
        localStorage.setItem("nativeLanguage", nativeLanguage);
      }
  }, [nativeLanguage, isMounted]);

  if (!isMounted) {
      return (
          <div className="flex min-h-dvh flex-col bg-background">
              <Navigation />
              <main className="flex-1" />
          </div>
      );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto py-8 sm:py-12 px-4">
          <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Welcome back, {userData.name}!
            </h1>
            <p className="text-muted-foreground mt-2">
              Ready to continue your language journey? Let's do this.
            </p>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Streak
                </CardTitle>
                <Flame className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userData.streak} days</div>
                <p className="text-xs text-muted-foreground">Keep the flame alive!</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">XP Points</CardTitle>
                <Star className="h-5 w-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userData.xp.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {(levelThreshold - userData.xp).toLocaleString()} to Level {userData.level + 1}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Level</CardTitle>
                <Zap className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userData.level}</div>
                <p className="text-xs text-muted-foreground">You're advancing!</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Path</CardTitle>
                <Target className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userData.activePath}</div>
                <p className="text-xs text-muted-foreground">Language: {userData.activeLanguage}</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Continue Learning */}
              <Card className="border-2 border-primary shadow-lg shadow-primary/10">
                <CardHeader>
                  <CardTitle>Continue Your Journey</CardTitle>
                  <CardDescription>
                    You're on the {userData.activePath} path in {userData.activeLanguage}. Pick up where you left off.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                        <BookOpen className="h-8 w-8 text-primary" />
                        <div>
                            <p className="font-semibold text-lg">Next Lesson: Week {userData.lastLesson.week}, Day {userData.lastLesson.day + 1}</p>
                            <p className="text-sm text-muted-foreground">Keep making progress!</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full sm:w-auto">
                    <Link href="/dashboard">
                      Go to Next Lesson <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Learning Paths */}
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  Explore Learning Paths
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {PATHS.map((path) => (
                    <PathCard
                      key={path.id}
                      id={path.id}
                      icon={path.icon}
                      title={path.title}
                      description={path.description}
                      details={path.details}
                      language={userData.activeLanguage}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Side column */}
            <div className="space-y-8">
               <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Site Language
                  </CardTitle>
                  <CardDescription>
                    Choose the language for the website interface.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {nativeLanguages.map((lang) => (
                      <Button
                        key={lang}
                        onClick={() => setNativeLanguage(lang as keyof typeof translations)}
                        variant={nativeLanguage === lang ? "default" : "outline"}
                        size="sm"
                      >
                        {lang}
                      </Button>
                    ))}
                </CardContent>
              </Card>
              {/* Weekly Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    This Week's Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between gap-1">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                      <div key={day} className="flex flex-col items-center gap-2">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            userData.weeklyProgress[index]
                              ? 'bg-green-500 text-white'
                              : 'bg-muted'
                          }`}
                        >
                          {userData.weeklyProgress[index] ? '✓' : ''}
                        </div>
                        <p className="text-xs text-muted-foreground">{day}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
               {/* AI Guide Card */}
              <Card className="bg-gradient-to-br from-blue-900/30 to-slate-900">
                <CardHeader>
                  <CardTitle>AI Guide</CardTitle>
                  <CardDescription>Have a question? Ask your personal AI language tutor.</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="secondary" className="w-full" asChild>
                    <Link href="/dashboard">Ask LingoForge AI</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

    