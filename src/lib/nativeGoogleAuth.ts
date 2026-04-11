'use client';

import { Capacitor } from '@capacitor/core';

export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  return Capacitor.isNativePlatform() || 
    window.location.search.includes('app=1') ||
    (navigator.userAgent.includes('wv') && navigator.userAgent.includes('Android'));
}

export async function initializeGoogleAuth(): Promise<void> {
  // No initialization needed for @capacitor-firebase/authentication
}

export async function nativeGoogleSignIn(auth: any): Promise<any> {
  alert('Native: ' + isNativePlatform() + ' Cap: ' + (typeof window !== 'undefined' ? (window as any).Capacitor?.isNativePlatform?.() : 'SSR') + ' UA: ' + (typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) : 'SSR'));
  if (!isNativePlatform()) return null;
  try {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
    const result = await FirebaseAuthentication.signInWithGoogle();
    
    if (result.credential?.idToken) {
      const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
      const credential = GoogleAuthProvider.credential(result.credential.idToken);
      const userCredential = await signInWithCredential(auth, credential);
      return userCredential.user;
    }
    return null;
  } catch (error) {
    console.error('Native Google Sign-In error:', error);
    alert('Sign-in error: ' + JSON.stringify(error));
    return null;
  }
}
