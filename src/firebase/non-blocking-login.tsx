'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
  User,
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
 * Creates or updates a user's profile in Firestore after sign-in.
 * This function ensures a user document exists and is up-to-date.
 */
export async function upsertUserProfile(
  user: User,
  firestore: Firestore,
  profileData?: Partial<UserProfile>
): Promise<void> {
  const userDocRef = doc(firestore, 'userProfiles', user.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    // User exists. This could be a login or a re-signup attempt.
    const updateData: Partial<UserProfile> = {};

    // If profileData is provided from onboarding, update languages and name.
    if (profileData?.nativeLanguage) updateData.nativeLanguage = profileData.nativeLanguage;
    if (profileData?.selectedLanguage) updateData.selectedLanguage = profileData.selectedLanguage;
    if (profileData?.displayName) updateData.displayName = profileData.displayName;
    
    // Always refresh display name and photo from Google profile on login.
    if (user.displayName) updateData.displayName = user.displayName;
    if (user.photoURL) updateData.photoURL = user.photoURL;

    if (Object.keys(updateData).length > 0) {
      await setDoc(userDocRef, updateData, { merge: true });
    }

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
        nativeLanguage: profileData?.nativeLanguage || localStorage.getItem('nativeLanguage') || 'English',
        selectedLanguage: profileData?.selectedLanguage || localStorage.getItem('targetLanguage') || 'French',
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

    localStorage.setItem('nativeLanguage', newUserProfile.nativeLanguage);
    localStorage.setItem('targetLanguage', newUserProfile.selectedLanguage);
  }
}

/**
 * Initiates Google Sign-In via popup and ensures user profile is created/updated.
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
    
    // After sign-in, upsert the profile.
    await upsertUserProfile(result.user, firestore, profileData);

    return result;
}
