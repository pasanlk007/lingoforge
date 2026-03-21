'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function CapacitorBackButton() {
  const router = useRouter();

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const setup = async () => {
      try {
        const { App } = await import('@capacitor/app');
        const listener = await App.addListener('backButton', ({ canGoBack }) => {
          const currentPath = window.location.pathname;
          const noBackPaths = ['/login', '/dashboard', '/'];
          if (noBackPaths.includes(currentPath)) {
            App.minimizeApp();
          } else if (canGoBack) {
            router.back();
          } else {
            App.minimizeApp();
          }
        });
        cleanup = () => listener.remove();
      } catch (e) {
        // Web platform - ignore
      }
    };

    setup();
    return () => { if (cleanup) cleanup(); };
  }, [router]);

  return null;
}
