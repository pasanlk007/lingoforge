'use client';

import { Capacitor } from '@capacitor/core';
import { GoogleAuthProvider, signInWithCredential, type Auth, type User } from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

/**
 * Checks if the app is running in a native Capacitor shell.
 * This is crucial for a hybrid app that loads a remote URL via `server.url`
 * because `Capacitor.isNativePlatform()` can return `false` in that context.
 */
export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  // The most reliable check is the presence and platform reported by the Capacitor object itself.
  return Capacitor.getPlatform() !== 'web';
}

/**
 * No-op function for consistency. Initialization is handled natively.
 */
export async function initializeGoogleAuth(): Promise<void> {
  return Promise.resolve();
}

/**
 * Executes the native Google Sign-In flow on Android/iOS using the Capacitor plugin.
 * @param auth The Firebase Auth instance from the main app.
 * @returns A Firebase User object on success, or null on failure or user cancellation.
 */
export async function nativeGoogleSignIn(auth: Auth): Promise<User | null> {
  if (!isNativePlatform()) {
    console.log("Skipping native Google Sign-In: not on a native platform.");
    return null;
  }

  try {
    // 1. Trigger the native Google Sign-In UI provided by the OS.
    const result = await FirebaseAuthentication.signInWithGoogle();

    // 2. The native sign-in returns a credential, including an idToken.
    const idToken = result.credential?.idToken;
    if (!idToken) {
      // This can happen if the user cancels the native sign-in flow.
      console.log("Native Google Sign-In was cancelled or did not return an ID token.");
      return null;
    }

    // 3. Use the idToken to create a Firebase credential.
    const credential = GoogleAuthProvider.credential(idToken);

    // 4. Sign in to Firebase with this credential to get a Firebase user session.
    const userCredential = await signInWithCredential(auth, credential);

    // 5. Return the fully authenticated Firebase user.
    return userCredential.user;

  } catch (error) {
    // The plugin often throws an error with a 'cancelled' message if the user closes the dialog.
    // We check for this to avoid logging it as a critical failure.
    if (error instanceof Error && error.message.toLowerCase().includes('canceled')) {
      console.log("Google Sign-In was canceled by the user.");
    } else {
      console.error('An error occurred during native Google Sign-In:', error);
    }
    return null;
  }
}
