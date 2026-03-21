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
export async function initiateGoogleSignIn(auth: Auth, firestore: Firestore): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if a user profile already exists in Firestore.
    const userDocRef = doc(firestore, 'userProfiles', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
        // If the user is new, create their profile with default values.
        const now = new Date();
        const newUserProfile: UserProfile = {
            id: user.uid,
            displayName: user.displayName || 'New User',
            email: user.email!,
            photoURL: user.photoURL || undefined,
            nativeLanguage: 'English',
            selectedLanguage: 'French',
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
        // Use a BLOCKING write to create the profile before the function returns.
        await setDoc(userDocRef, newUserProfile, { merge: true });
    }

    return result;
}
