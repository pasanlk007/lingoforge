'use client';

import { Volume2 } from 'lucide-react';
import { audioPlayer } from '@/lib/audioPlayer';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface AudioButtonProps {
  text: string;
  languageName: string;
}

export function AudioButton({ text, languageName }: AudioButtonProps) {
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card from flipping if button is on it
    audioPlayer.speak(text, languageName);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={handlePlay}>
            <Volume2 className="h-5 w-5" />
            <span className="sr-only">Play audio for "{text}"</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Play Audio</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
