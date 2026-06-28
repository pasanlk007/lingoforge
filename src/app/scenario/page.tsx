'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase';
import { targetLanguages, nativeLanguages } from '@/lib/translations';
import { canAccessScenarioMode } from '@/lib/scenarioAccessControl';
import { useScenarioT } from '@/hooks/useScenarioT';
import { Loader2, Sparkles, Lock } from 'lucide-react';
import Link from 'next/link';

// Isolated route. Does not read or affect survival/pro lesson state.
// UI text follows the user's own nativeLanguage (via useScenarioT), same
// pattern as the rest of the app — not a fixed/hardcoded language.

export default function ScenarioIntakePage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { t, userProfile, isProfileLoading, nativeLanguage: uiNativeLanguage } = useScenarioT();

  const [situation, setSituation] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Italian');
  const [nativeLanguage, setNativeLanguage] = useState('Sinhala');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default the plan's native-language field to the user's own UI language once known.
  useEffect(() => {
    if (uiNativeLanguage) setNativeLanguage(uiNativeLanguage);
  }, [uiNativeLanguage]);

  async function handleSubmit() {
    if (!situation.trim() || situation.trim().length < 10) {
      setError(t.errorTooShort);
      return;
    }
    if (!user) {
      setError(t.errorLoginFirst);
      return;
    }

    setError(null);
    setLoading(true);

    const sessionId = `${user.uid}_${Date.now()}`;
    // Heuristic: longer-horizon situations (interview prep, exams) get 14 days.
    const lower = situation.toLowerCase();
    const totalDays = /interview|exam|embassy|visa/.test(lower) ? 14 : 7;

    try {
      const res = await fetch('/api/scenario-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          sessionId,
          userInputRaw: situation.trim(),
          targetLanguage,
          nativeLanguage,
          totalDays,
        }),
      });

      if (!res.ok) {
        throw new Error('Generation failed');
      }

      router.push(`/scenario/${sessionId}`);
    } catch (e) {
      console.error(e);
      setError(t.errorGenerateFailed);
      setLoading(false);
    }
  }

  if (isUserLoading || (user && isProfileLoading)) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1">
          <div className="container mx-auto max-w-2xl py-10 px-4 space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    );
  }

  const hasAccess = canAccessScenarioMode(userProfile || null);

  if (!hasAccess) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1">
          <div className="container mx-auto max-w-2xl py-10 px-4">
            <Card className="border-2 border-blue-500/40 bg-gradient-to-br from-blue-950/20 to-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Lock className="h-6 w-6 text-blue-400" />
                  {t.lockedTitle}
                </CardTitle>
                <CardDescription>{t.lockedDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
                  <p>✅ {t.lockedFeature1}</p>
                  <p>✅ {t.lockedFeature2}</p>
                  <p>✅ {t.lockedFeature3}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                  <Link href="/pricing">{t.subscribeButton}</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl py-10 px-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Sparkles className="h-6 w-6 text-primary" />
                  {t.pageTitle}
                </CardTitle>
                <Link href="/scenario/my-plans" className="text-sm text-blue-400 hover:underline whitespace-nowrap">
                  {t.myPlans}
                </Link>
              </div>
              <CardDescription>{t.pageDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="situation">{t.situationLabel}</Label>
                <Textarea
                  id="situation"
                  placeholder={t.situationPlaceholder}
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.targetLanguageLabel}</Label>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {targetLanguages.map((l) => (
                        <SelectItem key={l.lang} value={l.lang}>
                          {l.flag} {l.lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t.nativeLanguageLabel}</Label>
                  <Select value={nativeLanguage} onValueChange={setNativeLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {nativeLanguages.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button onClick={handleSubmit} disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.generatingButton}
                  </>
                ) : (
                  t.generateButton
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
