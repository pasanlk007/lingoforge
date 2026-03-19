/**
 * IMPORTANT: This file is used for server-side Firebase initializations,
 * such as in API routes or server components. It uses the Firebase Admin SDK.
 *
 * DO NOT use this file on the client-side.
 */
import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

// This logic ensures that we don't try to initialize the app more than once.
if (!getApps().length) {
  // `applicationDefault()` will automatically find the service account credentials
  // in a managed Google Cloud environment (like Firebase App Hosting).
  // For local development, you must set the `GOOGLE_APPLICATION_CREDENTIALS`
  // environment variable to point to your service account key file.
  adminApp = initializeApp({
    credential: applicationDefault(),
    projectId: 'studio-3754329818-ee8cf', // Explicitly set to prevent "aud" claim mismatch
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
