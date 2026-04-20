"use client";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { playAudio } from "@/lib/audioPlayer";
import { Button } from "@/components/ui/button";

type Props = {
  text?: string;
  languageName?: string;
};

export function AudioPlayback({ text, languageName }: Props) {
  const handlePlay = (rate: number) => {
    if (!text || !languageName) return;
    playAudio(text, languageName, rate);
  };

  const TortoiseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="m17 10-2.1 2.1c-.8.8-.8 2.1 0 2.8l2.1 2.1"/>
        <path d="M5.1 12.1H15"/>
        <path d="M18 19c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5Z"/>
    </svg>
  );

  const VolumeIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
     </svg>
  );

  return (
    <TooltipProvider>
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePlay(0.7)}
            aria-label="Play slow"
          >
            <TortoiseIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Play Slow</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePlay(1)}
            aria-label="Play normal"
          >
             <VolumeIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
            <p>Play Normal</p>
        </TooltipContent>
      </Tooltip>
    </div>
    </TooltipProvider>
  );
}