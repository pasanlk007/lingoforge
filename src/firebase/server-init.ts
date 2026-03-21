/**
 * IMPORTANT: This file is used for server-side Firebase initializations,
 * such as in API routes or server components. It uses the Firebase Admin SDK.
 *
 * DO NOT use this file on the client-side.
 */
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// The service account key is imported directly from the JSON file.
import serviceAccountInfo from '../../studio-3754329818-ee8cf-firebase-adminsdk-fbsvc-45e2e677f9.json';

// Cast the imported JSON to the ServiceAccount type for type safety.
const serviceAccount = serviceAccountInfo as ServiceAccount;

let adminApp: App;

// This logic ensures that we don't try to initialize the app more than once.
if (!getApps().length) {
  // Initialize the app using the explicit service account credentials.
  adminApp = initializeApp({
    credential: cert(serviceAccount)
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
