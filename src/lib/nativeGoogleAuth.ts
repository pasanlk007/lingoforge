'use client';

import { Capacitor } from '@capacitor/core';
import { GoogleAuthProvider, signInWithCredential, type Auth, type User } from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  const platform = Capacitor.getPlatform();
  alert('Platform: ' + platform + ' | Cap object: ' + JSON.stringify(Object.keys((window as any).Capacitor || {})));
  return platform !== 'web';
}

export async function initializeGoogleAuth(): Promise<void> {
  return Promise.resolve();
}

export async function nativeGoogleSignIn(auth: Auth): Promise<User | null> {
  if (!isNativePlatform()) {
    console.log("Skipping native Google Sign-In: not on a native platform.");
    return null;
  }
  try {
    const result = await FirebaseAuthentication.signInWithGoogle();
    const idToken = result.credential?.idToken;
    if (!idToken) {
      console.log("Native Google Sign-In was cancelled or did not return an ID token.");
      return null;
    }
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('canceled')) {
      console.log("Google Sign-In was canceled by the user.");
    } else {
      console.error('An error occurred during native Google Sign-In:', error);
    }
    return null;
  }
}
