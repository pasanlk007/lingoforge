/**
 * IMPORTANT: This file is used for server-side Firebase initializations,
 * such as in API routes or server components. It uses the Firebase Admin SDK.
 *
 * DO NOT use this file on the client-side.
 */
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// IMPORTANT: Path to your service account key file.
// You must download this from your Firebase project settings.
// Store it securely and DO NOT commit it to your repository.
// It's recommended to use environment variables to store the key's content.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

let adminApp: App;

if (!getApps().length) {
  if (serviceAccount) {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    // This will initialize the app using Application Default Credentials
    // which is the recommended way for services like Cloud Run or Cloud Functions.
    adminApp = initializeApp();
  }
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
