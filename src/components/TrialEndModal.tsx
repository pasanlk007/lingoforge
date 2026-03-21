'use client';

import { useState, useEffect } from 'react';
import { Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TrialEndModalProps {
  trialDaysUsed: number;
  subscriptionActive: boolean;
}

export function TrialEndModal({ trialDaysUsed, subscriptionActive }: TrialEndModalProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trialDaysUsed >= 3 && !subscriptionActive) {
      const dismissed = sessionStorage.getItem('trial_modal_dismissed');
      if (!dismissed) {
        setTimeout(() => setShow(true), 1500);
      }
    }
  }, [trialDaysUsed, subscriptionActive]);

  if (!show) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('trial_modal_dismissed', 'true');
    setShow(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-background border shadow-2xl p-8 text-center">
        <button onClick={handleDismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Zap className="h-8 w-8 text-primary" />
        </div>

        <h2 className="text-2xl font-bold mb-2">Your free trial has ended</h2>
        <p className="text-muted-foreground mb-6">
          You've completed your 3-day free trial of LingoForge. Upgrade now to continue learning and unlock all lessons!
        </p>

        <div className="space-y-3">
          <Button className="w-full" size="lg" asChild>
            <Link href="/pricing">View Plans — from $4.99/week</Link>
          </Button>
          <Button variant="ghost" className="w-full" onClick={handleDismiss}>
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
}
