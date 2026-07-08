'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import type { ScenarioSession, DayConversation, ConversationLine } from '@/lib/types';
import { AudioService } from '@/lib/audioService';
import { useScenarioT } from '@/hooks/useScenarioT';
import { Mic, Square, Volume2, ChevronRight, Loader2, SkipForward, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function scoreEmoji(score: number) {
  if (score >= 80) return '🎉';
  if (score >= 60) return '👍';
  if (score >= 40) return '🔄';
  return '❌';
}

function matchScore(a: string, b: string): number {
  const s1 = a.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const s2 = b.toLowerCase().replace(/[^\w\s]/g, '').trim();
  if (!s1 || !s2) return 0;
  const m = s1.length, n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = s1[i-1] === s2[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  const maxLen = Math.max(m, n);
  return maxLen === 0 ? 100 : Math.round((1 - dp[m][n] / maxLen) * 100);
}

function AIAvatar({ state }: { state: 'idle' | 'speaking' | 'listening' }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className={`relative flex items-center justify-center rounded-full transition-all duration-500 ${
        state === 'idle' ? 'w-20 h-20 bg-teal-900/60' :
        state === 'speaking' ? 'w-24 h-24 bg-teal-700/80 shadow-lg shadow-teal-500/30' :
        'w-24 h-24 bg-blue-700/80 shadow-lg shadow-blue-500/30'
      }`}>
        {state !== 'idle' && (
          <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${state === 'speaking' ? 'bg-teal-400' : 'bg-blue-400'}`} />
        )}
        <div className="relative z-10 flex flex-col items-center gap-1">
          <div className="flex gap-2">
            <div className={`rounded-full bg-white transition-all duration-200 ${state === 'speaking' ? 'w-2.5 h-2.5' : 'w-2 h-2'}`} />
            <div className={`rounded-full bg-white transition-all duration-200 ${state === 'speaking' ? 'w-2.5 h-2.5' : 'w-2 h-2'}`} />
          </div>
          <div className={`rounded-full bg-white transition-all duration-200 ${state === 'speaking' ? 'w-3 h-1.5' : 'w-1.5 h-1.5'}`} />
        </div>
      </div>
      <span className="text-xs text-slate-400">
        {state === 'speaking' ? 'Speaking...' : state === 'listening' ? 'Listening...' : 'LingoForge AI'}
      </span>
    </div>
  );
}

function ConversationBubble({ line, onPlayAudio }: {
  line: ConversationLine;
  onPlayAudio: (text: string) => void;
}) {
  const [showHint, setShowHint] = useState(false);
  const isAI = line.role === 'ai';
  return (
    <div className={`flex flex-col gap-1 mb-4 ${isAI ? 'items-start' : 'items-end'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${isAI ? 'bg-slate-800 border border-slate-700 rounded-tl-sm' : 'bg-blue-700/80 rounded-tr-sm'}`}>
        <p className="text-white font-medium text-base leading-relaxed">{line.text}</p>
        {line.phonetic && <p className="text-teal-300 text-sm mt-1 font-mono">{line.phonetic}</p>}
        {isAI && (
          <div className="flex items-center gap-2 mt-2">
            <button onClick={() => onPlayAudio(line.text)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-300 transition-colors">
              <Volume2 className="w-3 h-3" /> Listen
            </button>
            <button onClick={() => setShowHint(!showHint)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-yellow-300 transition-colors">
              {showHint ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showHint ? 'Hide' : 'Hint'}
            </button>
          </div>
        )}
        {isAI && showHint && line.hint && (
          <p className="text-yellow-200/70 text-sm mt-2 italic border-t border-slate-700 pt-2">{line.hint}</p>
        )}
        {!isAI && line.recognizedText && (
          <div className="mt-2 pt-2 border-t border-blue-600/50">
            <p className="text-blue-200 text-xs">You said: "{line.recognizedText}"</p>
            {line.matchScore !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-lg">{line.emoji}</span>
                <span className="text-xs text-blue-200">{line.matchScore}% match</span>
              </div>
            )}
          </div>
        )}
        {!isAI && line.skipped && <p className="text-blue-300/60 text-xs mt-1 italic">Skipped</p>}
      </div>
    </div>
  );
}

export default function ScenarioConversationPage() {
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

  const [lines, setLines] = useState<ConversationLine[]>([]);
  const [avatarState, setAvatarState] = useState<'idle' | 'speaking' | 'listening'>('idle');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentRetry, setCurrentRetry] = useState(0);
  const [dayComplete, setDayComplete] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const MAX_TURNS = 7;

  const plan = session ? (() => {
    try { const p = (session as any).plan; return typeof p === 'string' ? JSON.parse(p) : p; }
    catch { return null; }
  })() : null;
  const dayOutline = plan?.daily_topics?.find((d: any) => d.day === dayNum) || null;

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const saveConversation = useCallback(async (currentLines: ConversationLine[], completed: boolean) => {
    if (!firestore || !plan || !dayOutline) return;
    const convRef = doc(firestore, 'scenarioSessions', sessionId, 'days', String(dayNum));
    await setDoc(convRef, {
      sessionId, day: dayNum,
      targetLanguage: plan.targetLanguage,
      nativeLanguage: plan.nativeLanguage,
      topicTitle: dayOutline.topic_title,
      lines: currentLines,
      status: completed ? 'completed' : 'active',
      generatedAt: new Date().toISOString(),
      ...(completed ? { completedAt: new Date().toISOString() } : {}),
    }, { merge: true });
  }, [firestore, plan, dayOutline, sessionId, dayNum]);

  const completeDay = useCallback(async (currentLines: ConversationLine[]) => {
    if (!sessionRef || !session || !plan) return;
    await saveConversation(currentLines, true);
    const completedDays = Array.from(new Set([...(session.completedDays || []), dayNum]));
    updateDocumentNonBlocking(sessionRef as any, {
      completedDays,
      currentDay: dayNum >= plan.total_days ? dayNum : dayNum + 1,
      status: dayNum >= plan.total_days ? 'completed' : 'active',
      updatedAt: new Date().toISOString(),
    });
    setDayComplete(true);
    setIsReadOnly(true);
  }, [sessionRef, session, plan, dayNum, saveConversation]);

  const playLine = useCallback(async (text: string, lang: string) => {
    setAvatarState('speaking');
    try { await AudioService.play(text, lang, 0.85); await new Promise(r => setTimeout(r, 400)); }
    catch { }
    setAvatarState('idle');
  }, []);

  const getAITurn = useCallback(async (currentLines: ConversationLine[]) => {
    if (!plan || !dayOutline || !user) return;
    const aiCount = currentLines.filter(l => l.role === 'ai').length;
    if (aiCount >= MAX_TURNS) { await completeDay(currentLines); return; }
    setIsLoadingAI(true); setAvatarState('speaking'); setError(null);
    try {
      const res = await fetch('/api/scenario-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid, sessionId, day: dayNum,
          targetLanguage: plan.targetLanguage,
          nativeLanguage: plan.nativeLanguage,
          topicTitle: dayOutline.topic_title,
          situationContext: dayOutline.situation_context,
          scenarioTitle: plan.scenario_title,
          conversationHistory: currentLines.map(l => ({
            role: l.role, text: l.text, phonetic: l.phonetic,
            hint: l.hint, recognizedText: l.recognizedText,
          })),
          isFirstTurn: currentLines.length === 0,
        }),
      });
      if (res.status === 402) { setError('Subscription required to continue'); setAvatarState('idle'); setIsLoadingAI(false); return; }
      if (!res.ok) throw new Error('AI response failed');
      const data = await res.json();
      const newLine: ConversationLine = {
        id: `ai-${Date.now()}`, role: 'ai',
        text: data.text, phonetic: data.phonetic, hint: data.hint,
      };
      const newLines = [...currentLines, newLine];
      setLines(newLines);
      await saveConversation(newLines, false);
      await playLine(data.text, plan.targetLanguage);
    } catch (e) {
      console.error(e);
      setError('Could not get AI response. Tap retry.');
    } finally { setIsLoadingAI(false); setAvatarState('idle'); }
  }, [plan, dayOutline, user, sessionId, dayNum, saveConversation, playLine, completeDay]);

  useEffect(() => {
    if (!firestore || !sessionId || !dayNum || !user || !plan || !dayOutline || initialized) return;
    setInitialized(true);
    const load = async () => {
      const convRef = doc(firestore, 'scenarioSessions', sessionId, 'days', String(dayNum));
      const snap = await getDoc(convRef);
      if (snap.exists()) {
        const data = snap.data() as DayConversation;
        if (data.lines?.length > 0) {
          setLines(data.lines);
          if (data.status === 'completed') { setDayComplete(true); setIsReadOnly(true); return; }
          const lastLine = data.lines[data.lines.length - 1];
          if (lastLine.role === 'user') { await getAITurn(data.lines); return; }
          return;
        }
      }
      await getAITurn([]);
    };
    load();
  }, [firestore, sessionId, dayNum, user, plan, dayOutline, initialized, getAITurn]);

  const handleUserResponse = useCallback(async (recognizedText: string) => {
    const lastAILine = [...lines].reverse().find(l => l.role === 'ai');
    const score = lastAILine ? matchScore(recognizedText, lastAILine.text) : 0;
    const emoji = scoreEmoji(score) as any;
    if (score < 40 && currentRetry < 2) {
      setCurrentRetry(p => p + 1);
      setError(`${emoji} Try again — say: "${lastAILine?.text}"`);
      return;
    }
    setError(null); setCurrentRetry(0);
    const userLine: ConversationLine = {
      id: `user-${Date.now()}`, role: 'user',
      text: lastAILine?.text || '', phonetic: '', hint: '',
      recognizedText, matchScore: score, emoji,
    };
    const newLines = [...lines, userLine];
    setLines(newLines);
    await saveConversation(newLines, false);
    await getAITurn(newLines);
  }, [lines, currentRetry, saveConversation, getAITurn]);

  const startRecording = async () => {
    setCurrentRetry(0);
    try {
      const { isNativePlatform } = await import('@/lib/speechService');
      const native = await isNativePlatform();
      if (native) {
        setIsRecording(true); setAvatarState('listening');
        await AudioService.stop();
        const LC: Record<string, string> = {
          Romanian:'ro-RO', French:'fr-FR', Italian:'it-IT', German:'de-DE',
          Spanish:'es-ES', Dutch:'nl-NL', Portuguese:'pt-PT', Russian:'ru-RU',
          Hebrew:'he-IL', Arabic:'ar-SA', Turkish:'tr-TR', Polish:'pl-PL',
          Korean:'ko-KR', Japanese:'ja-JP', Chinese:'zh-CN', Hindi:'hi-IN',
        };
        const { nativeSpeechRecognize } = await import('@/lib/speechService');
        const transcript = await nativeSpeechRecognize(LC[plan?.targetLanguage] || 'en-US');
        setIsRecording(false); setAvatarState('idle');
        if (transcript) await handleUserResponse(transcript);
      } else {
        await AudioService.stop();
        await new Promise(r => setTimeout(r, 300));
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        chunksRef.current = [];
        recorder.ondataavailable = e => chunksRef.current.push(e.data);
        recorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          setIsLoadingAI(true);
          try {
            const fd = new FormData();
            fd.append('audio', new Blob(chunksRef.current, { type: 'audio/webm' }), 'r.webm');
            const res = await fetch('/api/scenario-transcribe', { method: 'POST', body: fd });
            const d = await res.json();
            if (!res.ok || !d.text) throw new Error('No transcript');
            await handleUserResponse(d.text);
          } catch {
            setError('Transcription failed. Try again.');
            setIsLoadingAI(false);
          }
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true); setAvatarState('listening');
      }
    } catch {
      setIsRecording(false); setAvatarState('idle');
      setError('Microphone access failed. Check permissions.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    import('@/lib/speechService').then(({ stopNativeSpeech }) => stopNativeSpeech());
    setIsRecording(false); setAvatarState('idle');
  };

  const skipTurn = async () => {
    const lastAILine = [...lines].reverse().find(l => l.role === 'ai');
    const userLine: ConversationLine = {
      id: `skip-${Date.now()}`, role: 'user',
      text: lastAILine?.text || '', phonetic: '', hint: '', skipped: true,
    };
    const newLines = [...lines, userLine];
    setLines(newLines);
    await saveConversation(newLines, false);
    await getAITurn(newLines);
  };

  const aiTurnCount = lines.filter(l => l.role === 'ai').length;
  const progress = Math.round((aiTurnCount / MAX_TURNS) * 100);
  const lastLineIsAI = lines.length > 0 && lines[lines.length - 1].role === 'ai';
  const canSpeak = lastLineIsAI && !isLoadingAI && !isRecording && !dayComplete && !isReadOnly;

  if (sessionLoading || !session || !plan || !dayOutline) {
    return (
      <div className="flex min-h-dvh flex-col bg-slate-950 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
        <p className="text-slate-400 mt-4 text-sm">Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-slate-950 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Link href={`/scenario/${sessionId}`}>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400">{plan.targetLanguage} · Day {dayNum}/{plan.total_days}</p>
          <p className="text-sm font-medium text-white leading-tight truncate">
            {dayOutline.topic_title_native || dayOutline.topic_title}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-slate-500">{aiTurnCount}/{MAX_TURNS}</span>
        </div>
      </div>

      {/* Avatar */}
      <AIAvatar state={avatarState} />

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {lines.map(line => (
          <ConversationBubble
            key={line.id}
            line={line}
            onPlayAudio={text => { playLine(text, plan.targetLanguage); }}
          />
        ))}

        {isLoadingAI && (
          <div className="flex items-start mb-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {dayComplete && (
          <div className="text-center py-8 space-y-4">
            <div className="text-5xl">🎉</div>
            <p className="text-white font-semibold text-xl">Day {dayNum} complete!</p>
            <p className="text-slate-400 text-sm px-8">
              {isReadOnly ? 'Read-only replay. Your conversation is saved forever.' : 'Great practice session!'}
            </p>
            <Button
              onClick={() => router.push(`/scenario/${sessionId}`)}
              className="bg-teal-600 hover:bg-teal-500 text-white mt-2"
            >
              {dayNum < plan.total_days ? `Continue to Day ${dayNum + 1}` : 'View your plan'}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 pb-2">
          <div className="bg-orange-900/30 border border-orange-700/40 rounded-xl px-4 py-3 text-orange-200 text-sm text-center">
            {error}
          </div>
        </div>
      )}

      {/* Controls */}
      {!dayComplete && !isReadOnly && (
        <div className="px-4 pt-2" style={{ paddingBottom: 'max(40px, calc(env(safe-area-inset-bottom, 0px) + 16px))' }}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            {currentRetry > 0 && lastLineIsAI && (
              <div className="text-center mb-3">
                <p className="text-sm text-yellow-300 font-mono bg-slate-800 rounded-lg px-3 py-2">
                  {lines[lines.length - 1].text}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost" size="sm"
                onClick={skipTurn}
                disabled={!canSpeak}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                <SkipForward className="h-4 w-4 mr-1" /> Skip
              </Button>

              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={!canSpeak || isLoadingAI}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                    canSpeak && !isLoadingAI
                      ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/50 active:scale-95'
                      : 'bg-slate-700 opacity-40 cursor-not-allowed'
                  }`}
                >
                  {isLoadingAI ? <Loader2 className="h-6 w-6 animate-spin" /> : <Mic className="h-6 w-6" />}
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-lg shadow-red-900/50 animate-pulse active:scale-95"
                >
                  <Square className="h-6 w-6" />
                </button>
              )}

              <Button
                variant="ghost" size="sm"
                disabled={!lastLineIsAI || isLoadingAI}
                onClick={() => {
                  const l = [...lines].reverse().find(l => l.role === 'ai');
                  if (l) playLine(l.text, plan.targetLanguage);
                }}
                className="text-slate-500 hover:text-teal-300 text-xs"
              >
                <Volume2 className="h-4 w-4 mr-1" /> Replay
              </Button>
            </div>
            <p className="text-center text-xs text-slate-600 mt-3">
              {isRecording ? 'Listening... tap ■ to stop' : canSpeak ? 'Tap to speak' : 'Wait for response...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}