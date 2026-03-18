'use client';
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'lingoforge_first_open_date';

/**
 * Calculates the number of days since the trial started.
 * @param firstOpenDate The timestamp of the first open date.
 * @returns The number of days used in the trial.
 */
function getTrialDaysUsed(firstOpenDate: number): number {
  if (!firstOpenDate) return 0;
  const now = Date.now();
  const diff = now - firstOpenDate;
  // Make sure it's at least 0
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/**
 * A hook to safely track the user's free trial period using local storage.
 * It stores the date of the first visit and calculates the number of days passed.
 */
export function useFreeTrial() {
    const [trialDaysUsed, setTrialDaysUsed] = useState(0);
    const [isTrialLoading, setIsTrialLoading] = useState(true);

    useEffect(() => {
        // This effect runs only on the client side
        let firstOpenDateStr = localStorage.getItem(STORAGE_KEY);
        let firstOpenDate: number;

        if (firstOpenDateStr) {
            firstOpenDate = parseInt(firstOpenDateStr, 10);
        } else {
            // If it's the first time, set the date and store it.
            firstOpenDate = Date.now();
            localStorage.setItem(STORAGE_KEY, firstOpenDate.toString());
        }

        setTrialDaysUsed(getTrialDaysUsed(firstOpenDate));
        setIsTrialLoading(false);
    }, []);

    return { trialDaysUsed, isTrialLoading };
}
