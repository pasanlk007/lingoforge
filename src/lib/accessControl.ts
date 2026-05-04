'use client';
import type { UserProfile } from '@/lib/types';

const ADMIN_EMAILS = ['Pasan.lankathilakadpl@gmail.com'];

function isAdmin(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
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
    nativeLanguage?: string;
    userEmail?: string | null;
    profile: UserProfile | null;
  }
): AccessResult {
  const { path, week, day, language, userEmail, profile } = params;

  if (isAdmin(userEmail)) return { allowed: true };
  if (path === 'alphabet' || path === 'numbers') return { allowed: true };
  if ((path === 'survival' || path === 'alphabet' || path === 'numbers') && week === 1 && day <= 3) return { allowed: true };
  if (path === 'pro' && day <= 5) return { allowed: true };
  if (!profile) return { allowed: false, reason: 'locked' };

  const langKey = language?.toLowerCase() || '';

  // Lifetime plan grants access to everything.
  if (profile.subscriptionPlan === 'lifetime' || profile.unlockedContent?.all === true) {
    return { allowed: true };
  }

  // Check for permanently unlocked content. This is the primary source of truth for access.
  const contentKey = `${langKey}_${path}`;
  const unlockedWeeks: any = profile.unlockedContent?.[contentKey] || [];
  if (Array.isArray(unlockedWeeks) && unlockedWeeks.map(Number).includes(Number(week))) {
    return { allowed: true };
  }

  // Legacy check: if a user somehow completed week 12 of survival, grant access.
  if (path === 'survival') {
    const completedDays = profile.languageProgress?.[langKey]?.['survival']?.completedDays || [];
    if (completedDays.filter((d: string) => d.startsWith('12-')).length >= 7) return { allowed: true };
  }

  // If no specific unlock is found, deny access.
  return { allowed: false, reason: 'locked' };
}

export const brokenCombinations: Record<string, string[]> = {
  'bengali': ['finnish', 'serbian'],
  'hindi': ['finnish', 'serbian'],
  'nepali': ['finnish', 'serbian'],
  'urdu': ['finnish', 'serbian', 'romanian'],
};

export function isLessonAvailable(nativeLanguage: string, targetLanguage: string): boolean {
  const broken = brokenCombinations[nativeLanguage.toLowerCase()];
  if (!broken) return true;
  return !broken.includes(targetLanguage.toLowerCase());
}
