/**
 * IMPORTANT: This file is used for server-side Firebase initializations,
 * such as in API routes or server components. It uses the Firebase Admin SDK.
 *
 * DO NOT use this file on the client-side.
 */
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// The service account key is loaded from a local file as a fallback for development.
// This file is in .gitignore and WILL NOT be available in production.
let serviceAccountInfo;
try {
  const serviceAccountPath = path.join(process.cwd(), 'studio-3754329818-ee8cf-firebase-adminsdk-fbsvc-45e2e677f9.json');
  if (fs.existsSync(serviceAccountPath)) {
      const fileContents = fs.readFileSync(serviceAccountPath, 'utf8');
      serviceAccountInfo = JSON.parse(fileContents);
  } else {
      serviceAccountInfo = null;
  }
} catch (e) {
  // This is expected in production where the file is not deployed.
  serviceAccountInfo = null;
}

let adminApp: App | null = null;
let adminAuth: ReturnType<typeof getAuth> | null = null;
let adminFirestore: ReturnType<typeof getFirestore> | null = null;

function ensureInitialized() {
  if (adminApp) return;

  if (!getApps().length) {
    let serviceAccount: ServiceAccount | undefined;
    const projectId = 'studio-3754329818-ee8cf';

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      } as ServiceAccount;
    } else if (process.env.FIREBASE_ADMIN_SDK_KEY) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY);
      } catch (e) {
        console.error('Failed to parse FIREBASE_ADMIN_SDK_KEY from environment variables.', e);
        throw new Error('Could not parse service account key from environment variable. Ensure it is valid JSON.');
      }
    } else if (serviceAccountInfo) {
      console.warn("Auth: Using local service account file. This is for local development only.");
      serviceAccount = serviceAccountInfo as ServiceAccount;
    }

    if (!serviceAccount) {
      throw new Error(
        'Firebase Admin SDK Service Account is not available at runtime. ' +
        'Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY (or FIREBASE_ADMIN_SDK_KEY) ' +
        'are set in your environment variables.'
      );
    }

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: projectId,
    });
  } else {
    adminApp = getApps()[0];
  }

  adminAuth = getAuth(adminApp);
  adminFirestore = getFirestore(adminApp);
}

export function initializeFirebase() {
  ensureInitialized();
  return {
    firebaseApp: adminApp!,
    auth: adminAuth!,
    firestore: adminFirestore!,
  };
}
