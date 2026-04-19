'use client';

import { GoogleAuthProvider, signInWithCredential, type Auth, type User } from 'firebase/auth';

export async function isNativePlatform(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch (e) {
    return false;
  }
}

export async function initializeGoogleAuth(): Promise<void> {
  return Promise.resolve();
}

export async function nativeGoogleSignIn(auth: Auth): Promise<User | null> {
  const native = await isNativePlatform();
  if (!native) return null;

  try {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
    const result = await FirebaseAuthentication.signInWithGoogle();
    const idToken = result.credential?.idToken;
    if (!idToken) return null;
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('canceled')) {
      console.log("Google Sign-In was canceled.");
    } else {
      console.error('Native Google Sign-In error:', error);
    }
    return null;
  }
}
