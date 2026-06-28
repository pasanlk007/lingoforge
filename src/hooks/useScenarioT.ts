'use client';

import { doc } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { nativeLanguages, translations } from '@/lib/translations';
import type { UserProfile } from '@/lib/types';

// Resolves the signed-in user's nativeLanguage (same field/fallback pattern
// used by the dashboard) and returns the matching Scenario Mode translation
// strings. Falls back to English if no profile, no nativeLanguage set, or
// an unrecognized value.

export function useScenarioT() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'userProfiles', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef as any);

  let nativeLanguage = userProfile?.nativeLanguage || 'English';
  if (!nativeLanguages.includes(nativeLanguage)) nativeLanguage = 'English';

  const t = translations[nativeLanguage as keyof typeof translations].scenario;
  const isRTL = nativeLanguage === 'Urdu';

  return { t, userProfile, isProfileLoading, isRTL, nativeLanguage };
}
