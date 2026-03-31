
'use client';
import type { UserProfile } from '@/lib/types';

const ADMIN_EMAILS = ['Pasan.lankathilakadpl@gmail.com'];

function isAdmin(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}

function isSubscriptionValid(profile: UserProfile): boolean {
  if (!profile.subscriptionActive) return false;
  // Lifetime plan doesn't have an expiry date
  if (profile.subscriptionPlan === 'lifetime' && !profile.subscriptionExpiry) return true;
  if (!profile.subscriptionExpiry) return false;
  
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
    if (path === 'pro' && day <= 3) return { allowed: true };
    return { allowed: false, reason: 'locked' };
  }

  const hasValidSub = isSubscriptionValid(profile);
  
  // Week 12 graduates - keep survival unlocked forever
  if (path === 'survival') {
    const survivalProgress = profile.languageProgress?.[language?.toLowerCase() || '']?.['survival'];
    const completedDays = survivalProgress?.completedDays || [];
    const week12Days = completedDays.filter((d: string) => d.startsWith('12-'));
    if (week12Days.length >= 7) return { allowed: true };
  }
  const plan = profile.subscriptionPlan;

  // ===== SURVIVAL PATH =====
  if (path === 'survival') {
    // Free trial - week 1 always free
    if (week === 1) return { allowed: true };

    if (!hasValidSub) return { allowed: false, reason: 'upgrade' };

    // Course plan unlocks the whole path for the purchased language
    if (plan === 'course') {
      if (language && profile.subscriptionLanguage &&
          language.toLowerCase() === profile.subscriptionLanguage.toLowerCase()) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'wrong_language' };
    }
    
    // Weekly plan unlocks the next week based on progress + bonus weeks
    if (plan === 'weekly') {
      if (language && profile.subscriptionLanguage &&
          language.toLowerCase() !== profile.subscriptionLanguage.toLowerCase()) {
        return { allowed: false, reason: 'wrong_language' };
      }
      
      // Weekly subscriber gets all survival weeks for their language
      return { allowed: true };
    }
    
    // Lifetime - full access
    if (plan === 'lifetime') return { allowed: true };

    return { allowed: false, reason: 'upgrade' };
  }

  // ===== PRO PATH =====
  if (path === 'pro') {
    if (day <= 3) return { allowed: true };
    if (!hasValidSub || plan !== 'lifetime') {
      return { allowed: false, reason: 'lifetime_required' };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: 'locked' };
}
