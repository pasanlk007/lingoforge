'use client';

import type { Dialogue } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AudioButton } from './AudioButton';
import { MessageSquare } from 'lucide-react';

interface DialoguePanelProps {
  dialogue: Dialogue;
  language: string;
}

export function DialoguePanel({ dialogue, language }: DialoguePanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          <span>Dialogue: {dialogue.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {dialogue.lines.map((line, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold text-muted-foreground">
              {line.speaker}
            </div>
            <div className="flex-1">
              <p className="font-medium">{line.target}</p>
              <p className="text-sm text-muted-foreground">{line.english}</p>
              <p className="text-xs text-muted-foreground italic">{line.phonetic}</p>
            </div>
            <AudioButton text={line.target} languageName={language} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
