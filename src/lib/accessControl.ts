'use client';
import type { UserProfile, UserWeekProgress } from '@/lib/types';
import type { AppConfig } from '@/hooks/useAppConfig';

export interface UserAccessData {
    profile: UserProfile | null;
    progress: UserWeekProgress[] | null;
    trialDaysUsed: number;
}

/**
 * Determines if a user can access a specific week based on their subscription status and remote config.
 */
export function canAccessWeek(weekNumber: number, userData: UserAccessData, config: AppConfig): boolean {
    // 1. Maintenance mode blocks all access immediately.
    if (config.app_mode === 'maintenance') {
        return false;
    }
    
    // 2. If the user profile is still loading, provide a safe default (allow only week 1).
    if (!userData.profile) {
        return weekNumber <= config.max_free_weeks;
    }
    
    // 3. If the user has an active subscription, they have full access.
    if (userData.profile.subscriptionActive) {
        return true;
    }

    // --- Logic for Free Users ---

    // 4. Free trial period grants access to all enabled weeks.
    if (userData.trialDaysUsed < config.free_trial_days) {
        return true;
    }

    // 5. After trial, check if the week is within the allowed free week limit.
    if (weekNumber > config.max_free_weeks) {
        return false;
    }

    // 6. If sequential unlocking is required, check if the previous week is completed.
    if (config.require_previous_week_completion && weekNumber > 1) {
        const prevWeekProgress = userData.progress?.find(p => p.week === weekNumber - 1);
        // A week is completed if the 'weekCompleted' flag is true.
        return prevWeekProgress?.weekCompleted || false;
    }

    // 7. If none of the above conditions blocked access, the free user can access the week.
    return true;
}
