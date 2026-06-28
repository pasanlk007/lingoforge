'use client';
import type { UserProfile } from '@/lib/types';

// Isolated from accessControl.ts. Scenario Mode is a recurring monthly
// subscription — access is tied to an ACTIVE subscription and lapses if
// cancelled or expired, unlike the permanent one-time unlocks used by
// Survival/Pro (unlockedContent, subscriptionPlan === 'lifetime', etc).
// This function does not read or consider those fields at all.

export function canAccessScenarioMode(profile: UserProfile | null): boolean {
  if (!profile) return false;
  if (!profile.scenarioSubscriptionActive) return false;

  // No expiry means an active subscription with no known end date yet (e.g.
  // just created, renews_at not synced). Treat as active.
  if (!profile.scenarioSubscriptionExpiry) return true;

  return new Date(profile.scenarioSubscriptionExpiry).getTime() > Date.now();
}
