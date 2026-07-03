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

function nativeGoogleSignInInternal(): Promise<{ idToken: string; accessToken?: string }> {
  return new Promise(async (resolve, reject) => {
    const Plugins = (window as any).Capacitor?.Plugins;
    const GoogleAuth = Plugins?.GoogleAuth;
    if (!GoogleAuth) {
      reject(new Error('GoogleAuth plugin not available'));
      return;
    }
    try {
      await GoogleAuth.initialize({
        clientId: '157119324096-gse15lm640iflcvgi25kbrj6tnhl36ee.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      console.log('[NATIVE AUTH] GoogleAuth initialized');
      const googleUser = await GoogleAuth.signIn({});
      console.log('[NATIVE AUTH] GoogleAuth result:', JSON.stringify(googleUser));
      const idToken = googleUser?.authentication?.idToken;
      const accessToken = googleUser?.authentication?.accessToken;
      if (idToken) {
        resolve({ idToken, accessToken });
      } else {
        reject(new Error('No ID Token from GoogleAuth'));
      }
    } catch (e) {
      reject(e);
    }
  });
}

export async function nativeGoogleSignIn(auth: Auth): Promise<User | null> {
  const native = await isNativePlatform();
  if (!native) return null;
  try {
    if (auth.currentUser?.isAnonymous) {
      console.log('[NATIVE AUTH] Signing out anonymous user');
      await signOut(auth);
    }
    console.log('[NATIVE AUTH] Native flow started');
    const { idToken } = await nativeGoogleSignInInternal();
    console.log('[NATIVE AUTH] Firebase credential created');
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    console.log('[NATIVE AUTH] Firebase sign-in success');
    return userCredential.user;
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('cancel')) {
      console.log('[NATIVE AUTH] Canceled by user');
    } else {
      console.error('[NATIVE AUTH] Error:', error);
    }
    return null;
  }
}
