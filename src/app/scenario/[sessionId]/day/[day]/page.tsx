'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
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
import { useFirestore, useUser, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { ScenarioSession, ScenarioDayContent } from '@/lib/types';
import { computeMatchScore } from '@/lib/scenarioMatchScore';
import { playAudio } from '@/lib/audioPlayer';
import { useScenarioT } from '@/hooks/useScenarioT';
import { format } from '@/lib/utils';
import { Mic, Square, Volume2, ChevronRight, Loader2, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import Link from 'next/link';

// Isolated page. Reads/writes only scenarioSessions/{sessionId} and its
// turns/days subcollections. Does not touch userProgress, unlockedContent, XP, or streaks.
//
// Day content (vocab/dialogue/prompts) is generated on-demand the first time
// a user opens a day, then cached in scenarioSessions/{sessionId}/days/{day}.
// UI text follows the user's own nativeLanguage via useScenarioT.

export default function ScenarioDayPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const dayNum = parseInt(params.day as string, 10);
  const firestore = useFirestore();
  const { user } = useUser();
  const { t } = useScenarioT();

  const sessionRef = useMemoFirebase(
    () => (firestore && sessionId ? doc(firestore, 'scenarioSessions', sessionId) : null),
    [firestore, sessionId]
  );
  const { data: session, isLoading: sessionLoading } = useDoc<ScenarioSession>(sessionRef as any);

  const dayContentRef = useMemoFirebase(
    () => (firestore && sessionId && dayNum ? doc(firestore, 'scenarioSessions', sessionId, 'days', String(dayNum)) : null),
    [firestore, sessionId, dayNum]
  );
  const { data: dayDoc, isLoading: dayDocLoading } = useDoc<any>(dayContentRef as any);

  const [vocabIndex, setVocabIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [generationTriggered, setGenerationTriggered] = useState(false);
  const [generationError, setGenerationError] = useState(false);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const plan = useMemo(() => {
    if (!session) return null;
    const p = (session as any).plan;
    return typeof p === 'string' ? JSON.parse(p) : p;
  }, [session]);

  const dayOutline = useMemo(() => {
    if (!plan) return null;
    return plan.daily_topics.find((d: any) => d.day === dayNum) || null;
  }, [plan, dayNum]);

  const dayContent: ScenarioDayContent | null = useMemo(() => {
    if (!dayDoc) return null;
    const c = (dayDoc as any).content;
    return typeof c === 'string' ? JSON.parse(c) : c;
  }, [dayDoc]);

  // Trigger generation the first time we know there's no cached content yet.
  useEffect(() => {
    if (!plan || !dayOutline || dayDocLoading || !user) return;
    if (dayContent || generationTriggered) return;

    setGenerationTriggered(true);
    fetch('/api/scenario-day-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.uid,
        sessionId,
        day: dayNum,
        scenarioTitle: plan.scenario_title,
        scenarioSummary: plan.scenario_summary,
        topicTitle: dayOutline.topic_title,
        situationContext: dayOutline.situation_context,
        targetLanguage: plan.targetLanguage,
        nativeLanguage: plan.nativeLanguage,
        totalDays: plan.total_days,
      }),
    })
      .then(async (res) => {
        if (res.status === 402) {
          setSubscriptionRequired(true);
          return;
        }
        if (!res.ok) throw new Error('Generation failed');
      })
      .catch((e) => {
        console.error('Day generation failed:', e);
        setGenerationError(true);
      });
  }, [plan, dayOutline, dayDocLoading, dayContent, generationTriggered, sessionId, dayNum, user]);

  if (sessionLoading || !session || !plan || !dayOutline) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1">
          <div className="container mx-auto max-w-2xl py-10 px-4 space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-40 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (subscriptionRequired) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1">
          <div className="container mx-auto max-w-2xl py-16 px-4 text-center">
            <Lock className="h-10 w-10 mx-auto mb-4 text-blue-400" />
            <h2 className="text-xl font-semibold">{t.subscriptionRequiredTitle}</h2>
            <p className="text-muted-foreground mt-2">{t.subscriptionRequiredDescription}</p>
            <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700">
              <Link href="/pricing">{t.subscribeButton}</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (generationError) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1">
          <div className="container mx-auto max-w-2xl py-16 px-4 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold">{format(t.dayLoadFailedTitle, { day: dayNum })}</h2>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              {t.tryAgainButton}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!dayContent) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1">
          <div className="container mx-auto max-w-2xl py-16 px-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold">{format(t.buildingDayTitle, { day: dayNum })}</h2>
            <p className="text-muted-foreground mt-2">{t.buildingDaySubtitle}</p>
          </div>
        </main>
      </div>
    );
  }

  const vocab = dayContent.target_vocab[vocabIndex];
  const targetLanguage = plan.targetLanguage;

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await handleTranscribe(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (e) {
      console.error('Mic access failed:', e);
      alert(t.micPermissionError);
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  async function handleTranscribe(blob: Blob) {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const res = await fetch('/api/scenario-transcribe', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok || !data.text) {
        throw new Error(data.error || 'No transcription');
      }

      const score = computeMatchScore(data.text, vocab.target);
      setLastTranscript(data.text);
      setLastScore(score);

      if (firestore && session) {
        const turnsRef = collection(firestore, 'scenarioSessions', sessionId, 'turns');
        addDocumentNonBlocking(turnsRef, {
          day: dayNum,
          expectedTarget: vocab.target,
          transcribedText: data.text,
          matchScore: score,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Transcription failed:', e);
      setLastTranscript(null);
      setLastScore(null);
      alert(t.transcribeError);
    } finally {
      setIsTranscribing(false);
    }
  }

  function nextVocab() {
    if (!dayContent) return;
    setLastScore(null);
    setLastTranscript(null);
    if (vocabIndex < dayContent.target_vocab.length - 1) {
      setVocabIndex(vocabIndex + 1);
    }
  }

  function markDayComplete() {
    if (!sessionRef || !session) return;
    const completedDays = Array.from(new Set([...(session.completedDays || []), dayNum]));
    const isLastDay = dayNum >= plan.total_days;
    const nextDay = isLastDay ? dayNum : dayNum + 1;

    updateDocumentNonBlocking(sessionRef, {
      completedDays,
      currentDay: nextDay,
      status: isLastDay ? 'completed' : 'active',
      updatedAt: new Date().toISOString(),
    });

    router.push(`/scenario/${sessionId}`);
  }

  const isLastVocab = vocabIndex === dayContent.target_vocab.length - 1;
  const MIN_PASS_SCORE = 40;
  const hasPassed = lastScore !== null && lastScore >= MIN_PASS_SCORE;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl py-8 px-4 pb-24 space-y-6">
          <div>
            <Badge variant="outline" className="mb-2">
              {t.dayPlanLabel} {dayNum} / {plan.total_days}
            </Badge>
            <h1 className="text-xl font-bold">{dayOutline.topic_title_native || dayOutline.topic_title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{dayOutline.situation_context}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{format(t.phraseCounter, { current: vocabIndex + 1, total: dayContent.target_vocab.length })}</span>
                <Button variant="ghost" size="icon" onClick={() => playAudio(vocab.target, targetLanguage, 0.85)}>
                  <Volume2 className="h-5 w-5" />
                </Button>
              </CardTitle>
              <CardDescription>{vocab.native_meaning}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-6 space-y-2">
                <p className="text-3xl font-bold">{vocab.target}</p>
                <p className="text-muted-foreground">{vocab.phonetic}</p>
              </div>

              <div className="flex flex-col items-center gap-3">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    disabled={isTranscribing}
                    size="lg"
                    className="rounded-full h-16 w-16 p-0"
                  >
                    {isTranscribing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Mic className="h-6 w-6" />}
                  </Button>
                ) : (
                  <Button onClick={stopRecording} size="lg" variant="destructive" className="rounded-full h-16 w-16 p-0">
                    <Square className="h-6 w-6" />
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  {isRecording ? t.recordingPrompt : t.recordPrompt}
                </p>
              </div>

              {lastScore !== null && (
                <div className="rounded-lg bg-muted p-4 text-center space-y-1">
                  <p className="text-sm text-muted-foreground">{t.youSaid}</p>
                  <p className="font-medium">"{lastTranscript}"</p>
                  <p className="text-sm mt-2">
                    {t.matchConfidence}{' '}
                    <span className={`font-bold ${hasPassed ? 'text-green-500' : 'text-orange-400'}`}>
                      {lastScore}%
                    </span>
                  </p>
                  {!hasPassed && (
                    <p className="text-sm text-orange-400 font-medium">
                      {format(t.retryNeeded, { min: MIN_PASS_SCORE })}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground">{t.matchDisclaimer}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            {!isLastVocab ? (
              <Button onClick={nextVocab} variant="outline" disabled={!hasPassed}>
                {t.nextPhrase} <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={markDayComplete} className="bg-green-600 hover:bg-green-700" disabled={!hasPassed}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {format(t.dayComplete, { day: dayNum })}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
