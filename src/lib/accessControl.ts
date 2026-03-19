'use client';
import type { UserProfile, UserWeekProgress } from '@/lib/types';
import type { AppConfig } from '@/hooks/useAppConfig';

export interface UserAccessData {
    profile: UserProfile | null;
    progress: UserWeekProgress[] | null;
    trialDaysUsed: number;
}

/**
 * Checks if a user has an active, valid subscription.
 * @param profile The user's profile.
 * @returns True if the subscription is active and not expired.
 */
function isSubscriptionValid(profile: UserProfile): boolean {
    if (!profile.subscriptionActive) {
        return false;
    }
    // Lifetime access is denoted by a null expiry date.
    if (profile.subscriptionExpiry === null) {
        return true;
    }
    // For recurring subscriptions, check if the expiry date is in the future.
    try {
        const expiryDate = new Date(profile.subscriptionExpiry);
        const now = new Date();
        // The expiry date is valid if it's a valid date and in the future.
        return !isNaN(expiryDate.getTime()) && expiryDate > now;
    } catch (e) {
        // If the date string is invalid, treat it as expired.
        return false;
    }
}

/**
 * Determines if a user can access a specific week based on their subscription status and remote config.
 */
export function canAccessWeek(weekNumber: number, userData: UserAccessData, config: AppConfig): boolean {
    // 1. Maintenance mode blocks all access immediately.
    if (config.app_mode === 'maintenance') {
        return false;
    }
    
    // 2. If the user profile is still loading, provide a safe default (allow only free weeks).
    if (!userData.profile) {
        return weekNumber <= config.max_free_weeks;
    }

    // 3. If the user has a valid subscription, they have full access.
    // This now checks the expiry date for added safety.
    if (isSubscriptionValid(userData.profile)) {
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
    // This applies to weeks within the `max_free_weeks` limit.
    return true;
}
