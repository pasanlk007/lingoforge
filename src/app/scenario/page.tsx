'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
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
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { targetLanguages, nativeLanguages } from '@/lib/translations';
import type { UserProfile } from '@/lib/types';
import { canAccessScenarioMode } from '@/lib/scenarioAccessControl';
import { Loader2, Sparkles, Lock } from 'lucide-react';
import Link from 'next/link';

// Isolated route. Does not read or affect survival/pro lesson state.

export default function ScenarioIntakePage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'userProfiles', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef as any);

  const [situation, setSituation] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Italian');
  const [nativeLanguage, setNativeLanguage] = useState('Sinhala');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!situation.trim() || situation.trim().length < 10) {
      setError('කරුණාකර ඔබේ situation එක ටිකක් විස්තර කරන්න (අවම වශයෙන් වචන කීපයක්).');
      return;
    }
    if (!user) {
      setError('කරුණාකර පළමුව login වෙන්න.');
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
      setError('Plan එක generate කරන්න බැරි උනා. ආයෙත් try කරන්න.');
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
                  Scenario Mode
                </CardTitle>
                <CardDescription>
                  ඔබේම real-life situation එකට ගැලපෙන AI conversation plan එකක් — embassy interview, job
                  abroad, food delivery, ඕන situation එකක්ම. මාසික subscription එකකින් ඔබට ඕන තරම් plan
                  generate කරන්න පුළුවන්.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
                  <p>✅ ඔබේම situation එක describe කරලා custom plan එකක් generate කරන්න</p>
                  <p>✅ Daily AI voice conversation practice</p>
                  <p>✅ ඕන තරම් අලුත් scenario plans හදන්න (monthly subscription)</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                  <Link href="/pricing">Subscribe කරන්න — $13/month</Link>
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
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="h-6 w-6 text-primary" />
                Scenario Mode
              </CardTitle>
              <CardDescription>
                ඔබේ real-life situation එක කියන්න — ඊට ගැලපෙන daily conversation plan එකක් AI එක හදනවා.
                (e.g. "මම ඉතාලියේ රෙස්ටුරන්ට් එකක වේටර් රැකියාවට යනවා", "රුමේනියාවේ work permit embassy interview එකට සූදානම් වෙනවා")
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="situation">ඔබේ situation එක</Label>
                <Textarea
                  id="situation"
                  placeholder="මෙතන ඔබේ situation එක විස්තර කරන්න..."
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Language</Label>
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
                  <Label>Native Language</Label>
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Plan එක හදනවා...
                  </>
                ) : (
                  'My Plan එක Generate කරන්න'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
