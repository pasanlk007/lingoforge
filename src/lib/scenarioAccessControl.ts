'use client';
import type { UserProfile } from '@/lib/types';

// Isolated from accessControl.ts. Scenario Mode is a recurring monthly
// subscription — access is tied to an ACTIVE subscription and lapses if
// cancelled or expired, unlike the permanent one-time unlocks used by
// Survival/Pro (unlockedContent, subscriptionPlan === 'lifetime', etc).
// This function does not read or consider those fields at all.

export function canAccessScenarioMode(profile: UserProfile | null): boolean {
  if (!profile) return false;
  
  // Explicitly true if the active flag is set
  if (profile.scenarioSubscriptionActive === true) {
    // If we have an expiry, check it
    if (profile.scenarioSubscriptionExpiry) {
      const expiryDate = new Date(profile.scenarioSubscriptionExpiry).getTime();
      const now = Date.now();
      // Allow a 24-hour grace period for webhook delays during testing/renewal
      return expiryDate > (now - 86400000);
    }
    return true;
  }

  return false;
}