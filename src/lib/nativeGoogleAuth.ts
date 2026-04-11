'use client';

import { Capacitor } from '@capacitor/core';
import { GoogleAuthProvider, signInWithCredential, type Auth, type User } from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  if (!cap) return false;
  const hasNativePlugins = !!(cap.Plugins?.FirebaseAuthentication);
  const hasAndroidUA = navigator.userAgent.includes('Android') && navigator.userAgent.includes('wv');
  const hasAppParam = window.location.search.includes('app=1');
  return hasNativePlugins || hasAndroidUA || hasAppParam;
}

export async function initializeGoogleAuth(): Promise<void> {
  return Promise.resolve();
}

export async function nativeGoogleSignIn(auth: Auth): Promise<User | null> {
  if (!isNativePlatform()) return null;
  try {
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
