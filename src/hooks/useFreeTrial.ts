'use client';
import { useState, useEffect } from 'react';
import type { UserProfile } from '@/lib/types';

export function useFreeTrial(userProfile?: UserProfile | null) {
    const [trialDaysUsed, setTrialDaysUsed] = useState(0);
    const [isTrialLoading, setIsTrialLoading] = useState(true);

    useEffect(() => {
        // Still loading
        if (userProfile === undefined) return;

        // Subscription active - trial not relevant
        if (userProfile?.subscriptionActive) {
            setTrialDaysUsed(0);
            setIsTrialLoading(false);
            return;
        }

        // Use createdAt if available
        if (userProfile?.createdAt) {
            const created = new Date(userProfile.createdAt).getTime();
            const days = Math.max(0, Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24)));
            setTrialDaysUsed(days);
            setIsTrialLoading(false);
            return;
        }

        // No profile or no createdAt - use localStorage
        const stored = typeof window !== 'undefined' ? localStorage.getItem('lingoforge_first_open_date') : null;
        if (stored) {
            const days = Math.max(0, Math.floor((Date.now() - parseInt(stored)) / (1000 * 60 * 60 * 24)));
            setTrialDaysUsed(days);
        } else if (typeof window !== 'undefined') {
            localStorage.setItem('lingoforge_first_open_date', Date.now().toString());
            setTrialDaysUsed(0);
        }
        setIsTrialLoading(false);

    }, [userProfile?.subscriptionActive, userProfile?.createdAt]);

    return { trialDaysUsed, isTrialLoading };
}
