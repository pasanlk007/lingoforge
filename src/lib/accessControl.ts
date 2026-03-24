'use client';
import type { UserProfile, UserWeekProgress } from '@/lib/types';
import type { AppConfig } from '@/hooks/useAppConfig';

export interface UserAccessData {
    profile: UserProfile | null;
    progress: UserWeekProgress[] | null;
    trialDaysUsed: number;
    userEmail?: string | null;
}

const ADMIN_EMAILS = ['Pasan.lankathilakadpl@gmail.com'];

function isAdmin(email?: string | null): boolean {
    return !!email && ADMIN_EMAILS.includes(email);
}

function isSubscriptionValid(profile: UserProfile): boolean {
    if (!profile.subscriptionActive) {
        return false;
    }
    if (profile.subscriptionExpiry === null) {
        return true;
    }
    try {
        const expiryDate = new Date(profile.subscriptionExpiry);
        const now = new Date();
        return !isNaN(expiryDate.getTime()) && expiryDate > now;
    } catch (e) {
        return false;
    }
}

function isTrialActive(trialDaysUsed: number, config: AppConfig): boolean {
    return trialDaysUsed < config.free_trial_days;
}

export function canAccessWeek(weekNumber: number, userData: UserAccessData, config: AppConfig): boolean {
    // Admin always has full access
    if (isAdmin(userData.userEmail)) {
        return true;
    }

    // Maintenance mode blocks everyone
    if (config.app_mode === 'maintenance') {
        return false;
    }

    // Valid subscription = full access
    if (userData.profile && isSubscriptionValid(userData.profile)) {
        return true;
    }

    // Trial still active = access up to max_free_weeks
    if (isTrialActive(userData.trialDaysUsed, config)) {
        if (weekNumber > config.max_free_weeks) {
            return false;
        }
        if (config.require_previous_week_completion && weekNumber > 1) {
            const prevWeekProgress = userData.progress?.find(p => p.week === weekNumber - 1);
            return prevWeekProgress?.weekCompleted || false;
        }
        return true;
    }

    // Trial expired, no subscription = no access
    return false;
}
