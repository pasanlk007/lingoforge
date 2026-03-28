'use client';
import { useState, useEffect } from 'react';
import type { UserProfile } from '@/lib/types';

const STORAGE_KEY = 'lingoforge_first_open_date';

function getTrialDaysUsed(firstOpenDate: number): number {
  if (!firstOpenDate) return 0;
  const now = Date.now();
  const diff = now - firstOpenDate;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function useFreeTrial(userProfile?: UserProfile | null) {
    const [trialDaysUsed, setTrialDaysUsed] = useState(0);
    const [isTrialLoading, setIsTrialLoading] = useState(true);

    useEffect(() => {
        // If user has active subscription, trial doesn't matter
        if (userProfile?.subscriptionActive) {
            setTrialDaysUsed(0);
            setIsTrialLoading(false);
            return;
        }

        // Use Firestore createdAt if available
        if (userProfile?.createdAt) {
            const createdAt = new Date(userProfile.createdAt).getTime();
            setTrialDaysUsed(getTrialDaysUsed(createdAt));
            setIsTrialLoading(false);
            return;
        }

        // Fallback to localStorage
        let firstOpenDateStr = localStorage.getItem(STORAGE_KEY);
        let firstOpenDate: number;

        if (firstOpenDateStr) {
            firstOpenDate = parseInt(firstOpenDateStr, 10);
        } else {
            firstOpenDate = Date.now();
            localStorage.setItem(STORAGE_KEY, firstOpenDate.toString());
        }

        setTrialDaysUsed(getTrialDaysUsed(firstOpenDate));
        setIsTrialLoading(false);
    }, [userProfile]);

    return { trialDaysUsed, isTrialLoading };
}
