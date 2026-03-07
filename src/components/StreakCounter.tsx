import { Flame } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface StreakCounterProps {
  count: number;
}

export function StreakCounter({ count }: StreakCounterProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
            <div className="flex items-center gap-1 font-bold text-orange-400 border border-orange-400/50 bg-orange-400/10 rounded-full px-3 py-1 text-sm">
                <Flame className="h-4 w-4" />
                <span>{count}</span>
            </div>
        </TooltipTrigger>
        <TooltipContent>
            <p>{count}-day streak!</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
