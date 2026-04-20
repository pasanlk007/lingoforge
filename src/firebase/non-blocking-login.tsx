'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, Firestore, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';


/**
 * Initiates anonymous sign-in. Returns a promise from the Firebase SDK.
 * Auth state changes are handled by the global onAuthStateChanged listener.
 */
export function initiateAnonymousSignIn(authInstance: Auth): Promise<UserCredential> {
  return signInAnonymously(authInstance);
}

/**
 * Initiates email/password sign-up. Returns a promise from the Firebase SDK.
 * The calling component should await this promise and handle any errors.
 */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(authInstance, email, password);
}

/**
 * Initiates Google Sign-In via popup.
 * On first sign-in, creates a user profile document in Firestore.
 */
export async function initiateGoogleSignIn(
  auth: Auth,
  firestore: Firestore,
  profileData?: Partial<UserProfile>
): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDocRef = doc(firestore, 'userProfiles', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      // User exists. This could be a login or a re-signup attempt.
      const updateData: Partial<UserProfile> = {};
      
      // If profileData is provided from onboarding, update languages.
      if (profileData && profileData.nativeLanguage && profileData.selectedLanguage) {
        updateData.nativeLanguage = profileData.nativeLanguage;
        updateData.selectedLanguage = profileData.selectedLanguage;
      }
      
      // Always refresh display name and photo from Google profile on login.
      if (user.displayName) updateData.displayName = user.displayName;
      if (user.photoURL) updateData.photoURL = user.photoURL;

      if (Object.keys(updateData).length > 0) {
        await setDoc(userDocRef, updateData, { merge: true });
      }

      // Update localStorage with the (potentially updated) profile data for immediate UI change.
      const updatedProfile = (await getDoc(userDocRef)).data() as UserProfile;
      localStorage.setItem('nativeLanguage', updatedProfile.nativeLanguage);
      localStorage.setItem('targetLanguage', updatedProfile.selectedLanguage);

    } else {
        // User does not exist, create a new profile.
        const now = new Date();
        const newUserProfile: UserProfile = {
            id: user.uid,
            displayName: profileData?.displayName || user.displayName || 'New User',
            email: user.email!,
            photoURL: user.photoURL || undefined,
            nativeLanguage: profileData?.nativeLanguage || 'English',
            selectedLanguage: profileData?.selectedLanguage || 'French', // This will now use the value from onboarding
            createdAt: now.toISOString(),
            subscriptionActive: false,
            subscriptionSource: 'none',
            subscriptionExpiry: null,
            xpPoints: 0,
            currentStreak: 0,
            lastActiveDate: now.toISOString().split('T')[0],
            aiPlanningEnabled: false,
            activePath: 'survival',
            lastLessonWeek: 1,
            lastLessonDay: 0,
        };
        await setDoc(userDocRef, newUserProfile, { merge: true });

        // Set preferences in localStorage for immediate UI update
        localStorage.setItem('nativeLanguage', newUserProfile.nativeLanguage);
        localStorage.setItem('targetLanguage', newUserProfile.selectedLanguage);
    }

    return result;
}
