'use client';

import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  value: number; // 0-100
}

export function ProgressBar({ value }: ProgressBarProps) {
  return <Progress value={value} className="w-full h-2 bg-muted" />;
}
