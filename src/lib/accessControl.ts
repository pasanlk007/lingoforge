'use client';
import type { UserProfile } from '@/lib/types';

const ADMIN_EMAILS = ['Pasan.lankathilakadpl@gmail.com'];
const FREE_TRIAL_SURVIVAL_WEEKS = 1;
const FREE_TRIAL_PRO_DAYS = 3;

function isAdmin(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}

function isSubscriptionValid(profile: UserProfile): boolean {
  if (!profile.subscriptionActive) return false;
  if (!profile.subscriptionExpiry) return true;
  try {
    return new Date(profile.subscriptionExpiry) > new Date();
  } catch { return false; }
}

export type AccessResult = {
  allowed: boolean;
  reason?: string;
};

export function canAccessLesson(
  params: {
    path: 'survival' | 'alphabet' | 'numbers' | 'pro';
    week: number;
    day: number;
    language?: string;
    userEmail?: string | null;
    profile: UserProfile | null;
  }
): AccessResult {
  const { path, week, day, language, userEmail, profile } = params;

  // Admin - full access
  if (isAdmin(userEmail)) return { allowed: true };

  // Alphabet & Numbers - always free
  if (path === 'alphabet' || path === 'numbers') return { allowed: true };

  // No profile yet - only free trial access
  if (!profile) {
    if (path === 'survival' && week === 1) return { allowed: true };
    if (path === 'pro' && day <= FREE_TRIAL_PRO_DAYS) return { allowed: true };
    return { allowed: false, reason: 'locked' };
  }

  const hasValidSub = isSubscriptionValid(profile);
  const plan = profile.subscriptionPlan;

  // ===== SURVIVAL PATH =====
  if (path === 'survival') {
    // Free trial - week 1 only
    if (week === 1) return { allowed: true };

    if (!hasValidSub) return { allowed: false, reason: 'upgrade' };

    // Weekly plan - same language only, week 2 onwards
    if (plan === 'weekly') {
      if (language && profile.subscriptionLanguage && 
          language.toLowerCase() !== profile.subscriptionLanguage.toLowerCase()) {
        return { allowed: false, reason: 'wrong_language' };
      }
      // Week 1 always free (trial), weekly subscription unlocks week 2+
      if (week >= 2) return { allowed: true };
      return { allowed: true }; // week 1 already free
    }

    // Course plan - same language, daily unlock
    if (plan === 'course') {
      if (language && profile.subscriptionLanguage && 
          language.toLowerCase() !== profile.subscriptionLanguage.toLowerCase()) {
        return { allowed: false, reason: 'wrong_language' };
      }
      // Day 1 of week 1 always unlocked
      if (week === 1 && day === 1) return { allowed: true };
      // Check if previous day completed
      const dayKey = `${language}_survival_${week}_${day}`;
      const prevDayKey = day > 1 
        ? `${language}_survival_${week}_${day - 1}`
        : `${language}_survival_${week - 1}_7`;
      const completed = profile.completedDays || [];
      if (completed.includes(prevDayKey)) return { allowed: true };
      return { allowed: false, reason: 'complete_previous' };
    }

    // Lifetime - full access
    if (plan === 'lifetime') return { allowed: true };

    return { allowed: false, reason: 'upgrade' };
  }

  // ===== PRO PATH =====
  if (path === 'pro') {
    // Free trial - 3 days
    if (day <= FREE_TRIAL_PRO_DAYS) return { allowed: true };
    if (!hasValidSub || plan !== 'lifetime') {
      return { allowed: false, reason: 'lifetime_required' };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: 'locked' };
}
