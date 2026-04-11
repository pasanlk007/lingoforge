'use client';

import { Capacitor } from '@capacitor/core';
import { GoogleAuthProvider, signInWithCredential, type Auth, type User } from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

/**
 * A robust method to determine if the app is running in a native Capacitor shell,
 * especially when a remote server URL is used.
 * @returns {boolean} True if running inside a native Capacitor app.
 */
export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  // This is the most reliable way to check for a Capacitor environment
  // when loading a remote URL, as `Capacitor.getPlatform()` can return 'web'.
  // We check for the Capacitor object and the custom query param from capacitor.config.ts.
  return !!window.Capacitor && window.location.search.includes('app=1');
}

export async function initializeGoogleAuth(): Promise<void> {
  return Promise.resolve();
}

/**
 * Triggers the native Google Sign-In flow using the Capacitor Firebase Auth plugin.
 * This is only called when isNativePlatform() returns true.
 * @param auth The Firebase Auth instance.
 * @returns A Firebase User object on success, or null on cancellation/failure.
 */
export async function nativeGoogleSignIn(auth: Auth): Promise<User | null> {
  if (!isNativePlatform()) {
    console.log("Skipping native Google Sign-In: not on a native platform.");
    return null;
  }
  try {
    const result = await FirebaseAuthentication.signInWithGoogle();
    const idToken = result.credential?.idToken;
    if (!idToken) {
      // This happens if the user closes the native account picker.
      console.log("Native Google Sign-In was cancelled or did not return an ID token.");
      return null;
    }
    // Use the token from the native SDK to create a Firebase credential.
    const credential = GoogleAuthProvider.credential(idToken);
    // Sign in to Firebase with the credential.
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
  } catch (error) {
    if (error instanceof Error && (error.message.toLowerCase().includes('canceled') || error.message.toLowerCase().includes('cancelled'))) {
      // Explicitly catch and log user cancellation.
      console.log("Google Sign-In was canceled by the user.");
    } else {
      // Log other potential errors from the native sign-in process.
      console.error('An error occurred during native Google Sign-In:', error);
    }
    return null;
  }
}
