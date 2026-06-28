'use client';

import { useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, collection } from 'firebase/firestore';
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
import { useFirestore, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import type { ScenarioSession } from '@/lib/types';
import { computeMatchScore } from '@/lib/scenarioMatchScore';
import { playAudio } from '@/lib/audioPlayer';
import { Mic, Square, Volume2, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';

// Isolated page. Reads/writes only scenarioSessions/{sessionId} and its
// turns subcollection. Does not touch userProgress, unlockedContent, XP, or streaks.

export default function ScenarioDayPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const dayNum = parseInt(params.day as string, 10);
  const firestore = useFirestore();

  const sessionRef = useMemoFirebase(
    () => (firestore && sessionId ? doc(firestore, 'scenarioSessions', sessionId) : null),
    [firestore, sessionId]
  );
  const { data: session, isLoading } = useDoc<ScenarioSession>(sessionRef as any);

  const [vocabIndex, setVocabIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const plan = useMemo(() => {
    if (!session) return null;
    const p = (session as any).plan;
    return typeof p === 'string' ? JSON.parse(p) : p;
  }, [session]);

  const dayPlan = useMemo(() => {
    if (!plan) return null;
    return plan.daily_topics.find((d: any) => d.day === dayNum) || null;
  }, [plan, dayNum]);

  if (isLoading || !session || !plan || !dayPlan) {
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

  const vocab = dayPlan.target_vocab[vocabIndex];
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
      alert('Microphone access ලබාගන්න බැරි උනා. Browser permissions check කරන්න.');
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

      // Log the turn (isolated subcollection, owner-only per firestore.rules)
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
      alert('Transcription එක ලබාගන්න බැරි උනා. ආයෙත් try කරන්න.');
    } finally {
      setIsTranscribing(false);
    }
  }

  function nextVocab() {
    setLastScore(null);
    setLastTranscript(null);
    if (vocabIndex < dayPlan.target_vocab.length - 1) {
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

  const isLastVocab = vocabIndex === dayPlan.target_vocab.length - 1;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl py-8 px-4 space-y-6">
          <div>
            <Badge variant="outline" className="mb-2">
              Day {dayNum} / {plan.total_days}
            </Badge>
            <h1 className="text-xl font-bold">{dayPlan.topic_title_native || dayPlan.topic_title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{dayPlan.situation_context}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>
                  Phrase {vocabIndex + 1} / {dayPlan.target_vocab.length}
                </span>
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
                  {isRecording ? 'කියන්න... finish උනාම stop කරන්න' : 'Record කරන්න tap කරන්න'}
                </p>
              </div>

              {lastScore !== null && (
                <div className="rounded-lg bg-muted p-4 text-center space-y-1">
                  <p className="text-sm text-muted-foreground">ඔබ කිව්වේ:</p>
                  <p className="font-medium">"{lastTranscript}"</p>
                  <p className="text-sm mt-2">
                    ~Match confidence: <span className="font-bold">{lastScore}%</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    (මේක pronunciation accuracy නෙවෙයි — Whisper ට ඔබේ speech එක කොච්චර clear ලෙස target text එකට ලඟ ලෙස තේරුණාද කියන estimate එකක්)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            {!isLastVocab ? (
              <Button onClick={nextVocab} variant="outline">
                Next Phrase <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={markDayComplete} className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Day {dayNum} Complete කරන්න
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
