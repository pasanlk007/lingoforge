'use client';

import { Volume1, Volume2 } from 'lucide-react';
import { audioPlayer } from '@/lib/audioPlayer';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface AudioPlaybackProps {
  text: string;
  languageName: string;
}

export function AudioPlayback({ text, languageName }: AudioPlaybackProps) {
  const play = (e: React.MouseEvent, rate: number) => {
    e.stopPropagation();
    audioPlayer.speak(text, languageName, rate);
  };

  return (
    <div className="flex items-center rounded-full border bg-muted/50" onClick={(e) => e.stopPropagation()}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={(e) => play(e, 1.0)}>
            <Volume2 className="h-5 w-5" />
            <span className="sr-only">Play audio normally for "{text}"</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Play Normal</p></TooltipContent>
      </Tooltip>
      <div className="h-6 w-px bg-border"></div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={(e) => play(e, 0.7)}>
            <Volume1 className="h-5 w-5" />
            <span className="sr-only">Play audio slowly for "{text}"</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Play Slow</p></TooltipContent>
      </Tooltip>
    </div>
  );
}
