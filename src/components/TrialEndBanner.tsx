'use client';

import { useState } from 'react';
import { Clock, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TrialEndBannerProps {
  trialDaysUsed: number;
  subscriptionActive: boolean;
}

export function TrialEndBanner({ trialDaysUsed, subscriptionActive }: TrialEndBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (subscriptionActive || dismissed) return null;

  // Show warning on day 2
  if (trialDaysUsed === 2) {
    return (
      <div className="relative mb-6 rounded-xl border border-yellow-400/50 bg-yellow-400/10 px-6 py-4">
        <button onClick={() => setDismissed(true)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-yellow-500 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-yellow-700 dark:text-yellow-400">⏰ Trial ends tomorrow!</p>
            <p className="text-sm text-muted-foreground mt-0.5">Upgrade now to keep learning without interruption.</p>
          </div>
          <Button size="sm" asChild className="shrink-0">
            <Link href="/pricing">Upgrade</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show expired on day 3+
  if (trialDaysUsed >= 3) {
    return (
      <div className="relative mb-6 rounded-xl border border-red-400/50 bg-red-500/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-red-700 dark:text-red-400">🔒 Your free trial has ended</p>
            <p className="text-sm text-muted-foreground mt-0.5">Upgrade to continue your language journey. Plans start at $4.99/week.</p>
          </div>
          <Button size="sm" asChild className="shrink-0 bg-red-600 hover:bg-red-700">
            <Link href="/pricing">Upgrade Now</Link>
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
