'use client';
import type { UserProfile } from '@/lib/types';
import type { AppConfig } from '@/hooks/useAppConfig';

const ADMIN_EMAILS = ['Pasan.lankathilakadpl@gmail.com'];

function isAdmin(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}

function isSubscriptionValid(profile: UserProfile): boolean {
  if (!profile.subscriptionActive) return false;
  
  // Lifetime subscription from LemonSqueezy might not have an expiry.
  if (profile.subscriptionSource === 'lemonsqueezy' && profile.subscriptionPlan === 'lifetime') {
    return true;
  }
  
  // A null expiry is treated as lifetime access.
  if (profile.subscriptionExpiry === null) return true;
  
  try {
    // Check if the expiry date is in the future.
    return new Date(profile.subscriptionExpiry) > new Date();
  } catch {
    // If the date is invalid, treat the subscription as expired.
    return false;
  }
}

export type AccessResult = {
  allowed: boolean;
  reason?: 'upgrade' | 'complete_previous' | 'locked' | 'lifetime_required' | 'wrong_language';
};

interface AccessParams {
    path: 'survival' | 'alphabet' | 'numbers' | 'pro';
    week: number;
    day: number;
    language?: string;
    userEmail?: string | null;
    profile: UserProfile | null;
    config: AppConfig;
    trialDaysUsed: number;
}

export function canAccessLesson(params: AccessParams): AccessResult {
  const { path, week, day, language, userEmail, profile, config, trialDaysUsed } = params;

  // 1. Admin has full access
  if (isAdmin(userEmail)) return { allowed: true };

  // 2. Alphabet & Numbers paths are always free
  if (path === 'alphabet' || path === 'numbers') return { allowed: true };

  // 3. Handle users without a profile (should be rare, but good to have)
  if (!profile) {
    if (trialDaysUsed < config.free_trial_days) {
      if (path === 'survival' && week <= config.max_free_weeks) return { allowed: true };
      if (path === 'pro' && day <= config.free_trial_days) return { allowed: true };
    }
    return { allowed: false, reason: 'locked' };
  }
  
  const hasValidSub = isSubscriptionValid(profile);
  const plan = profile.subscriptionPlan;

  // 4. Survival Path Logic
  if (path === 'survival') {
    // Free trial access based on remote config
    if (week <= config.max_free_weeks && trialDaysUsed < config.free_trial_days) {
        return { allowed: true };
    }
    
    // If trial is over and they don't have a valid subscription, deny access.
    if (!hasValidSub) return { allowed: false, reason: 'upgrade' };

    // Any valid subscription grants access to the survival path.
    // Finer-grained control (e.g., language-specific weekly plans) can be added here later.
    return { allowed: true };
  }

  // 5. Pro Path Logic
  if (path === 'pro') {
    // Free trial for pro path, based on remote config
    if (day <= config.free_trial_days && trialDaysUsed < config.free_trial_days) {
        return { allowed: true };
    }

    // Pro path requires a lifetime subscription
    if (hasValidSub && plan === 'lifetime') {
        return { allowed: true };
    }
    
    return { allowed: false, reason: 'lifetime_required' };
  }

  // Default deny for any other cases
  return { allowed: false, reason: 'locked' };
}
