'use client';

import Link from 'next/link';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import type { ScenarioSession } from '@/lib/types';
import { ChevronRight, Plus, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

// Isolated page. Lists the signed-in user's own scenarioSessions documents
// so previously generated plans can be reopened — fixes the issue where a
// generated plan had no way to be found again after navigating away.

export default function MyScenarioPlansPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const sessionsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, 'scenarioSessions'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'))
        : null,
    [firestore, user]
  );
  const { data: sessions, isLoading } = useCollection<ScenarioSession>(sessionsQuery as any);

  if (isUserLoading || (user && isLoading)) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1">
          <div className="container mx-auto max-w-2xl py-10 px-4 space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl py-10 px-4 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-blue-400" />
                My Scenario Plans
              </h1>
              <p className="text-muted-foreground mt-1">ඔබ හදපු සියලුම plans</p>
            </div>
            <Button asChild size="sm">
              <Link href="/scenario">
                <Plus className="mr-1 h-4 w-4" /> අලුත් එකක්
              </Link>
            </Button>
          </div>

          {(!sessions || sessions.length === 0) ? (
            <Card>
              <CardContent className="py-10 text-center space-y-4">
                <p className="text-muted-foreground">ඔබ තාම plan එකක් හදලා නෑ.</p>
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/scenario">My Plan එක Generate කරන්න</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sessions.map((s: any) => {
                const plan = typeof s.plan === 'string' ? JSON.parse(s.plan) : s.plan;
                const title = plan?.scenario_title_native || plan?.scenario_title || s.userInputRaw;
                const isCompleted = s.status === 'completed';
                const isGenerating = s.status === 'generating';
                const isError = s.status === 'error';

                return (
                  <Card key={s.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                          {isGenerating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                          {title}
                        </CardTitle>
                        <Badge variant="outline">{s.targetLanguage}</Badge>
                      </div>
                      <CardDescription>
                        {isError ? 'Generate කරන්න බැරි උනා' : isGenerating ? 'Plan එක හදනවා...' : `Day ${s.currentDay || 1} / ${plan?.total_days || '-'}`}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button asChild variant="outline" size="sm" disabled={isError}>
                        <Link href={`/scenario/${s.id}`}>
                          {isCompleted ? 'Review' : 'Continue'} <ChevronRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
