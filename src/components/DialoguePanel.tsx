'use client';

import dynamic from 'next/dynamic';
import type { Dialogue } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MessageSquare } from 'lucide-react';
import { Separator } from './ui/separator';

const AudioPlayback = dynamic(() => import('./AudioPlayback').then(mod => mod.AudioPlayback), { ssr: false });


interface DialoguePanelProps {
  dialogues: Dialogue[];
  language: string;
  t: any; // translation object
}

export function DialoguePanel({ dialogues, language, t }: DialoguePanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          <span>{t.dialogues}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {dialogues
          .filter(dialogue => dialogue && typeof dialogue === 'object') // Filter out null/invalid entries
          .map((dialogue, dialogueIndex) => (
          <div key={dialogue.id}>
            <h4 className="font-semibold text-md mb-2">{dialogue.context}</h4>
            <div className="space-y-4">
              {Array.isArray(dialogue.lines) && dialogue.lines.map((line, lineIndex) => (
                <div key={lineIndex} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold text-muted-foreground">
                    {line.speaker}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{line.target}</p>
                    <p className="text-sm text-muted-foreground">{line.native}</p>
                    <p className="text-xs text-muted-foreground italic">{line.phonetic}</p>
                  </div>
                  <AudioPlayback text={line.target} languageName={language} />
                </div>
              ))}
            </div>
            {dialogueIndex < dialogues.length - 1 && <Separator className="mt-6" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
