'use client';

import { GoogleAuthProvider, signInWithCredential, signOut, type Auth, type User } from 'firebase/auth';

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
    if (auth.currentUser?.isAnonymous) {
      console.log('[NATIVE AUTH] Signing out anonymous user');
      await signOut(auth);
    }
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
    console.log('[NATIVE AUTH] Native flow started');
    const result = await FirebaseAuthentication.signInWithGoogle();
    const idToken = result.credential?.idToken;
    if (!idToken) {
      console.error('[NATIVE AUTH] No idToken returned');
      return null;
    }
    console.log('[NATIVE AUTH] Firebase credential created');
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    console.log('[NATIVE AUTH] Firebase sign-in success');
    return userCredential.user;
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('canceled')) {
      console.log('[NATIVE AUTH] Canceled by user');
    } else {
      console.error('[NATIVE AUTH] Error:', error);
    }
    return null;
  }
}
