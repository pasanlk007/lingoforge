'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useBackButton() {
  const router = useRouter();

  useEffect(() => {
    const handleBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app');
        App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            router.back();
          } else {
            App.minimizeApp();
          }
        });
      } catch (e) {
        // Not on native platform
      }
    };
    handleBackButton();
  }, [router]);
}
