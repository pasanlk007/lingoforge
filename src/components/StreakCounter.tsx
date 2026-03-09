import { Flame } from 'lucide-react';

interface StreakCounterProps {
  count: number;
}

export function StreakCounter({ count }: StreakCounterProps) {
  return (
    <div 
      className="flex items-center gap-1 font-bold text-orange-400 border border-orange-400/50 bg-orange-400/10 rounded-full px-3 py-1 text-sm"
      title={`${count}-day streak!`}
    >
      <Flame className="h-4 w-4" />
      <span>{count}</span>
    </div>
  );
}
