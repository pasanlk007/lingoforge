'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc } from 'firebase/firestore';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { ScenarioSession } from '@/lib/types';
import { useScenarioT } from '@/hooks/useScenarioT';
import { format } from '@/lib/utils';
import { Loader2, Lock, CheckCircle2, MessageCircle, AlertTriangle, Sparkles, ChevronRight } from 'lucide-react';

export default function ScenarioSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const firestore = useFirestore();
  const { t } = useScenarioT();

  const sessionRef = useMemoFirebase(
    () => (firestore && sessionId ? doc(firestore, 'scenarioSessions', sessionId) : null),
    [firestore, sessionId]
  );
  const { data: session, isLoading } = useDoc<ScenarioSession>(sessionRef as any);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if ((session as any)?.status !== 'generating') { setTimedOut(false); return; }
    const timer = setTimeout(() => setTimedOut(true), 75000);
    return () => clearTimeout(timer);
  }, [(session as any)?.status, sessionId]);

  if (isLoading || !session) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1">
          <div className="container mx-auto max-w-3xl py-10 px-4 space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    );
  }

  const plan = (() => {
    try { const p = (session as any).plan; return typeof p === 'string' ? JSON.parse(p) : p; }
    catch { return null; }
  })();

  if ((session as any).status === 'generating' || !plan) {
    if (timedOut) return (
      <div className="flex min-h-dvh flex-col bg-background"><Navigation />
        <main className="flex-1"><div className="container mx-auto max-w-2xl py-16 px-4 text-center">
          <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-semibold">{t.slowGenerationTitle}</h2>
          <p className="text-muted-foreground mt-2">{t.slowGenerationSubtitle}</p>
          <Button className="mt-4" onClick={() => router.push('/scenario')}>{t.tryAgainButton}</Button>
        </div></main>
      </div>
    );
    return (
      <div className="flex min-h-dvh flex-col bg-background"><Navigation />
        <main className="flex-1"><div className="container mx-auto max-w-2xl py-16 px-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold">{t.buildingPlanTitle}</h2>
          <p className="text-muted-foreground mt-2">{t.buildingPlanSubtitle}</p>
        </div></main>
      </div>
    );
  }

  if ((session as any).status === 'error') return (
    <div className="flex min-h-dvh flex-col bg-background"><Navigation />
      <main className="flex-1"><div className="container mx-auto max-w-2xl py-16 px-4 text-center">
        <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-destructive" />
        <h2 className="text-xl font-semibold">{t.buildFailedTitle}</h2>
        <Button className="mt-4" onClick={() => router.push('/scenario')}>{t.tryAgainButton}</Button>
      </div></main>
    </div>
  );

  const currentDay = (session as any).currentDay || 1;
  const completedDays: number[] = (session as any).completedDays || [];
  const isCompleted = (session as any).status === 'completed';

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl py-10 px-4 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{plan.scenario_title_native || plan.scenario_title}</h1>
            <p className="text-muted-foreground mt-1">{plan.scenario_summary}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge variant="secondary">{plan.targetLanguage}</Badge>
              <Badge variant="outline">{plan.total_days} {t.dayPlanLabel}</Badge>
              {isCompleted && <Badge className="bg-green-600 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> {t.completedBadge}</Badge>}
            </div>
          </div>

          {isCompleted && (
            <Card className="border-2 border-purple-500/40 bg-gradient-to-br from-purple-950/20 to-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-purple-400" />
                  <div>
                    <CardTitle className="text-lg">{format(t.planCompleteTitle, { days: plan.total_days })}</CardTitle>
                    <CardDescription>{format(t.planCompleteDescription, { language: plan.targetLanguage })}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="flex flex-col sm:flex-row gap-2">
                <Button asChild className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500">
                  <Link href="/dashboard/lesson-map">{t.exploreProPath} <ChevronRight className="ml-1 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/scenario">{t.newScenarioButton}</Link>
                </Button>
              </CardFooter>
            </Card>
          )}

          <div className="space-y-3">
            {plan.daily_topics.map((day: any) => {
              const isDone = completedDays.includes(day.day);
              const isCurrent = day.day === currentDay;
              const isLocked = day.day > currentDay;
              return (
                <Card key={day.day} className={isCurrent ? 'border-primary ring-1 ring-primary' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {isDone && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                        {t.dayPlanLabel} {day.day}: {day.topic_title_native || day.topic_title}
                      </CardTitle>
                      {isCurrent && <Badge>{t.todayBadge}</Badge>}
                    </div>
                    <CardDescription>{day.situation_context}</CardDescription>
                  </CardHeader>
                  {!isLocked && (
                    <CardContent>
                      <Button variant={isCurrent ? 'default' : 'outline'} size="sm"
                        onClick={() => router.push(`/scenario/${sessionId}/day/${day.day}`)}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        {isDone ? t.reviewButton : t.startConversation}
                      </Button>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}