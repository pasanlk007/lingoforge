'use client';

import { useParams, useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { ScenarioSession } from '@/lib/types';
import { Loader2, Lock, CheckCircle2, MessageCircle, AlertTriangle } from 'lucide-react';

// Isolated page. Reads only from scenarioSessions/{sessionId}. Does not touch
// userProgress, unlockedContent, or any survival/pro lesson state.

export default function ScenarioSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const firestore = useFirestore();

  const sessionRef = useMemoFirebase(
    () => (firestore && sessionId ? doc(firestore, 'scenarioSessions', sessionId) : null),
    [firestore, sessionId]
  );

  const { data: session, isLoading } = useDoc<ScenarioSession>(sessionRef as any);

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

  // plan may arrive as a JSON string from the Firestore REST write
  const plan = typeof (session as any).plan === 'string'
    ? JSON.parse((session as any).plan)
    : (session as any).plan;

  if (session.status === 'generating' || !plan) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1">
          <div className="container mx-auto max-w-2xl py-16 px-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold">ඔබේ plan එක AI එක හදනවා...</h2>
            <p className="text-muted-foreground mt-2">මේක seconds කීපයක් ගතවෙයි.</p>
          </div>
        </main>
      </div>
    );
  }

  if (session.status === 'error') {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1">
          <div className="container mx-auto max-w-2xl py-16 px-4 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold">Plan එක generate කරන්න බැරි උනා</h2>
            <Button className="mt-4" onClick={() => router.push('/scenario')}>
              ආයෙත් try කරන්න
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const currentDay = session.currentDay || 1;
  const completedDays = session.completedDays || [];

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto max-w-3xl py-10 px-4 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{plan.scenario_title_native || plan.scenario_title}</h1>
            <p className="text-muted-foreground mt-1">{plan.scenario_summary}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">{plan.targetLanguage}</Badge>
              <Badge variant="outline">{plan.total_days} දින Plan එක</Badge>
            </div>
          </div>

          <div className="space-y-3">
            {plan.daily_topics.map((day: any) => {
              const isDone = completedDays.includes(day.day);
              const isCurrent = day.day === currentDay;
              const isLocked = day.day > currentDay;

              return (
                <Card
                  key={day.day}
                  className={isCurrent ? 'border-primary ring-1 ring-primary' : ''}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {isDone && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                        Day {day.day}: {day.topic_title_native || day.topic_title}
                      </CardTitle>
                      {isCurrent && <Badge>අද</Badge>}
                    </div>
                    <CardDescription>{day.situation_context}</CardDescription>
                  </CardHeader>
                  {!isLocked && (
                    <CardContent>
                      <Button
                        variant={isCurrent ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => router.push(`/scenario/${sessionId}/day/${day.day}`)}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        {isDone ? 'Review' : 'Start Conversation'}
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
