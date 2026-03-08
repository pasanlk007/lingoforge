'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential
} from 'firebase/auth';

/**
 * Initiates anonymous sign-in. Returns a promise from the Firebase SDK.
 * Auth state changes are handled by the global onAuthStateChanged listener.
 */
export function initiateAnonymousSignIn(authInstance: Auth): Promise<UserCredential> {
  return signInAnonymously(authInstance);
}

/**
 * Initiates email/password sign-up. Returns a promise from the Firebase SDK.
 * The calling component should await this promise and handle any errors.
 */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(authInstance, email, password);
}

/**
 * Initiates email/password sign-in. Returns a promise from the Firebase SDK.
 * The calling component should await this promise and handle any errors.
 */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(authInstance, email, password);
}
