'use client';
import type { UserProfile, UserWeekProgress } from '@/lib/types';
import type { AppConfig } from '@/hooks/useAppConfig';

export interface UserAccessData {
    profile: UserProfile | null;
    progress: UserWeekProgress[] | null;
    trialDaysUsed: number;
}

/**
 * Determines if a user can access a specific week based on their status and remote config.
 * This follows the safe access logic specified.
 */
export function canAccessWeek(weekNumber: number, userData: UserAccessData, config: AppConfig): boolean {
    // 1. Maintenance mode blocks everything safely.
    if (config.app_mode === 'maintenance') {
        return false;
    }
    
    // 2. If user profile is not loaded, apply safe default (only week 1).
    if (!userData.profile) {
        return weekNumber === 1;
    }
    
    // 3. Subscription overrides all other rules.
    const isSubscribed = userData.profile.subscriptionType !== 'free';
    if (isSubscribed) {
        return true;
    }

    // 4. Free trial access overrides other rules for the duration.
    if (userData.trialDaysUsed < config.free_trial_days) {
        return true;
    }

    // 5. Week 1 is always accessible for free users post-trial.
    if (weekNumber === 1) {
        return true;
    }

    // 6. Limit access based on the maximum number of free weeks.
    if (weekNumber > config.max_free_weeks) {
        return false;
    }

    // 7. If sequential unlock is required, check if previous week is completed.
    if (config.require_previous_week_completion && weekNumber > 1) {
        const prevWeekProgress = userData.progress?.find(p => p.week === weekNumber - 1);
        return prevWeekProgress?.weekCompleted || false;
    }

    // 8. If none of the above conditions blocked access, it's allowed.
    return true;
}