'use client';
import { useState, useEffect } from 'react';
import type { UserProfile } from '@/lib/types';
import { differenceInCalendarDays } from 'date-fns';

export function useFreeTrial(userProfile?: UserProfile | null) {
    const [trialState, setTrialState] = useState({ trialDaysUsed: 0, isTrialLoading: true });

    useEffect(() => {
        if (userProfile === undefined) {
            // Still loading profile
            setTrialState({ trialDaysUsed: 0, isTrialLoading: true });
            return;
        }

        if (userProfile === null) {
            // No profile, or explicit null, means loading finished, no user.
            // Can't calculate trial, default to a high number to indicate trial is over.
            setTrialState({ trialDaysUsed: 999, isTrialLoading: false });
            return;
        }

        if (userProfile.createdAt) {
            const creationDate = new Date(userProfile.createdAt);
            const today = new Date();
            const daysUsed = differenceInCalendarDays(today, creationDate);
            setTrialState({ trialDaysUsed: Math.max(0, daysUsed), isTrialLoading: false });
        } else {
            // createdAt does not exist, can't calculate trial. Assume it's over.
            setTrialState({ trialDaysUsed: 999, isTrialLoading: false });
        }

    }, [userProfile]);

    return trialState;
}
