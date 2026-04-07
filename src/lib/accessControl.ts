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
  const { path, week, day, language, nativeLanguage, userEmail, profile } = params;

  // Admin - full access
  if (isAdmin(userEmail)) return { allowed: true };

  // Alphabet & Numbers - always free
  if (path === 'alphabet' || path === 'numbers') return { allowed: true };

  // Week 1 survival - always free
  if (path === 'survival' && week === 1) return { allowed: true };

  // Pro path - first 3 days free
  if (path === 'pro' && day <= 3) return { allowed: true };

  if (!profile) return { allowed: false, reason: 'locked' };

  // ===== LIFETIME CHECK =====
  if (profile.unlockedContent?.all === true) return { allowed: true };

  // ===== WEEK 12 GRADUATE =====
  if (path === 'survival') {
    const langKey = language?.toLowerCase() || '';
    const completedDays = profile.languageProgress?.[langKey]?.['survival']?.completedDays || [];
    if (completedDays.filter((d: string) => d.startsWith('12-')).length >= 7) {
      return { allowed: true };
    }

    // Check unlockedContent - simple key: targetLanguage_path
    const contentKey = `${langKey}_survival`;
    const unlockedWeeks: number[] = profile.unlockedContent?.[contentKey] || [];
    
    if (unlockedWeeks.includes(week)) return { allowed: true };
    
    return { allowed: false, reason: 'week_not_unlocked' };
  }

  // ===== PRO PATH =====
  if (path === 'pro') {
    if (profile.unlockedContent?.all === true) return { allowed: true };
    return { allowed: false, reason: 'lifetime_required' };
  }

  return { allowed: false, reason: 'locked' };
}

// Broken lesson combinations - no content available
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
