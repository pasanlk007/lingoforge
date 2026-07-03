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
<<<<<<< Updated upstream
    if (auth.currentUser?.isAnonymous) {
      console.log('[NATIVE AUTH] Signing out anonymous user');
      await signOut(auth);
    }
    console.log('[NATIVE AUTH] Native flow started');
    const { idToken } = await nativeGoogleSignInInternal();
=======
    // Sign out any anonymous user first — the @capacitor-firebase/authentication
    // plugin can auto-initialize an anonymous session on Android, which conflicts
    // with Google Sign-In ('Called logOut but the current user is anonymous').
    if (auth.currentUser?.isAnonymous) {
      console.log('[NATIVE AUTH] Signing out anonymous user before Google Sign-In');
      await signOut(auth);
    }

    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
    console.log('[NATIVE AUTH] Native flow started');
    const result = await FirebaseAuthentication.signInWithGoogle();
    console.log('[NATIVE AUTH] Google account selected, idToken present:', !!result.credential?.idToken);
    const idToken = result.credential?.idToken;
    if (!idToken) {
      console.error('[NATIVE AUTH] No idToken returned — likely missing clientId config');
      return null;
    }
>>>>>>> Stashed changes
    console.log('[NATIVE AUTH] Firebase credential created');
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    console.log('[NATIVE AUTH] Firebase sign-in success');
    return userCredential.user;
  } catch (error) {
<<<<<<< Updated upstream
    if (error instanceof Error && error.message.toLowerCase().includes('cancel')) {
      console.log('[NATIVE AUTH] Canceled by user');
    } else {
      console.error('[NATIVE AUTH] Error:', error);
=======
    if (error instanceof Error && error.message.toLowerCase().includes('canceled')) {
      console.log('[NATIVE AUTH] Google Sign-In was canceled by user.');
    } else {
      console.error('[NATIVE AUTH] Native Google Sign-In error:', error);
>>>>>>> Stashed changes
    }
    return null;
  }
}