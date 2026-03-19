/**
 * IMPORTANT: This file is used for server-side Firebase initializations,
 * such as in API routes or server components. It uses the Firebase Admin SDK.
 *
 * DO NOT use this file on the client-side.
 */
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

// This logic ensures that we don't try to initialize the app more than once.
if (!getApps().length) {
  // initializeApp() with no arguments will use Application Default Credentials.
  // We explicitly set the projectId to match the client-side configuration
  // to prevent audience claim mismatches.
  adminApp = initializeApp({
    projectId: 'studio-3754329818-ee8cf',
  });
} else {
  adminApp = getApps()[0];
}

const adminAuth = getAuth(adminApp);
const adminFirestore = getFirestore(adminApp);

export function initializeFirebase() {
  return {
    firebaseApp: adminApp,
    auth: adminAuth,
    firestore: adminFirestore,
  };
}
