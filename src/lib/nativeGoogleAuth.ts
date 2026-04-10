'use client';

import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  return Capacitor.isNativePlatform();
}

export async function initializeGoogleAuth(): Promise<void> {
  if (!isNativePlatform()) return;
  await GoogleAuth.initialize({
    clientId: process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  });
}

export async function nativeGoogleSignIn(auth: any): Promise<any> {
  if (!isNativePlatform()) return null;
  try {
    const googleUser = await GoogleAuth.signIn();
    const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
    const result = await signInWithCredential(auth, credential);
    return result.user;
  } catch (error) {
    console.error('Native Google Sign-In error:', error);
    return null;
  }
}
