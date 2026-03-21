/**
 * IMPORTANT: This file is used for server-side Firebase initializations,
 * such as in API routes or server components. It uses the Firebase Admin SDK.
 *
 * DO NOT use this file on the client-side.
 */
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// The service account key is imported directly from the JSON file as a fallback.
import serviceAccountInfo from '../../studio-3754329818-ee8cf-firebase-adminsdk-fbsvc-45e2e677f9.json';

let adminApp: App;

// This logic ensures that we don't try to initialize the app more than once.
if (!getApps().length) {
  let serviceAccount: ServiceAccount;

  // In a deployed environment (like App Hosting), the service account key
  // should be provided as an environment variable.
  if (process.env.FIREBASE_ADMIN_SDK_KEY) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY);
    } catch (e) {
      console.error('Failed to parse FIREBASE_ADMIN_SDK_KEY from environment variables.', e);
      // Fallback to the imported JSON if parsing fails
      serviceAccount = serviceAccountInfo as ServiceAccount;
    }
  } else {
    // For local development, use the imported JSON file.
    serviceAccount = serviceAccountInfo as ServiceAccount;
  }
  
  adminApp = initializeApp({
    credential: cert(serviceAccount),
    projectId: 'studio-3754329818-ee8cf'
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
