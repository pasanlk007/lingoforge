/**
 * IMPORTANT: This file is used for server-side Firebase initializations,
 * such as in API routes or server components. It uses the Firebase Admin SDK.
 *
 * DO NOT use this file on the client-side.
 */
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// The service account key is imported directly from the JSON file as a fallback for local development.
// This file is in .gitignore and WILL NOT be available in production.
let serviceAccountInfo;
try {
  serviceAccountInfo = require('../../studio-3754329818-ee8cf-firebase-adminsdk-fbsvc-45e2e677f9.json');
} catch (e) {
  // This is expected in production where the file is not deployed.
  serviceAccountInfo = null;
}

let adminApp: App;

// This logic ensures that we don't try to initialize the app more than once.
if (!getApps().length) {
  let serviceAccount: ServiceAccount | undefined;
  const projectId = 'studio-3754329818-ee8cf';

  // In a deployed environment (like App Hosting), the service account key
  // should be provided as an environment variable linked to a secret.
  if (process.env.FIREBASE_ADMIN_SDK_KEY) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY);
    } catch (e) {
      console.error('Failed to parse FIREBASE_ADMIN_SDK_KEY from environment variables.', e);
      throw new Error('Could not parse service account key from environment variable. Ensure it is valid JSON.');
    }
  } else if (serviceAccountInfo) {
    // For local development, use the imported JSON file.
    console.warn("Auth: Using local service account file. This is for local development only.");
    serviceAccount = serviceAccountInfo as ServiceAccount;
  }

  // If no credentials could be found, throw a clear error.
  if (!serviceAccount) {
    throw new Error(
      'Firebase Admin SDK Service Account is not available. ' +
      'Ensure the FIREBASE_ADMIN_SDK_KEY secret is created in Google Secret Manager and referenced in apphosting.yaml for production. ' +
      'For local development, ensure the service account JSON file exists.'
    );
  }
  
  adminApp = initializeApp({
    credential: cert(serviceAccount),
    projectId: projectId, // Explicitly set the project ID
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
