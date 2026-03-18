'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { RemoteConfig } from 'firebase/remote-config';

interface FirebaseServices {
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
    remoteConfig: RemoteConfig;
}

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    const services = initializeFirebase();
    setFirebaseServices(services);
  }, []);

  // Pass the initialized services to the provider.
  // On the server and during initial client render, these will be undefined.
  // The FirebaseProvider and hooks are designed to handle this.
  return (
    <FirebaseProvider
      firebaseApp={firebaseServices?.firebaseApp}
      auth={firebaseServices?.auth}
      firestore={firebaseServices?.firestore}
      remoteConfig={firebaseServices?.remoteConfig}
    >
      {children}
    </FirebaseProvider>
  );
}
