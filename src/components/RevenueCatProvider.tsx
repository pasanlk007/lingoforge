'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

const API_KEY = 'test_MOFjIoiftAYLPKyQzbKTWJktYVA';
const ENTITLEMENT_ID = 'premium'; // This should match the entitlement ID in your RevenueCat dashboard

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Effect for initializing the SDK and setting up the listener
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const initRevenueCat = async () => {
      const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
      
      // For debugging purposes, you can set the log level
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

      // Configure the SDK with your API key
      await Purchases.configure({ apiKey: API_KEY });

      // Listen for any updates to the purchaser info
      Purchases.addPurchaserInfoUpdateListener(async (info: any) => {
        const premiumEntitlement = info.entitlements.active[ENTITLEMENT_ID];
        const hasActiveSubscription = typeof premiumEntitlement !== 'undefined';
        
        if (user && firestore) {
          const userProfileRef = doc(firestore, 'userProfiles', user.uid);

          let source: 'google_play' | 'apple_iap' | 'stripe' | 'lemonsqueezy' | 'none' = 'none';
          if (hasActiveSubscription) {
            switch(premiumEntitlement.store) {
                case 'PLAY_STORE':
                    source = 'google_play';
                    break;
                case 'APP_STORE':
                    source = 'apple_iap';
                    break;
            }
          }

          // Sync the subscription status with Firestore
          updateDocumentNonBlocking(userProfileRef, {
            subscriptionActive: hasActiveSubscription,
            subscriptionSource: source,
            subscriptionExpiry: premiumEntitlement?.expirationDate || null,
          });
        }
      });
    };

    initRevenueCat();

  }, [firestore, user]); // Rerun if user or firestore instance changes

  // Effect for logging the user in/out of RevenueCat
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || isUserLoading) {
      return;
    }

    const manageRevenueCatUser = async () => {
      const { Purchases, PURCHASES_ERROR_CODE } = await import('@revenuecat/purchases-capacitor');
      if (user) {
        try {
          // If a user is logged in, identify them with RevenueCat using their Firebase UID
          await Purchases.logIn({ appUserID: user.uid });
        } catch (e: any) {
            // This can happen if the user is already logged in, which is fine.
            if (e.code !== PURCHASES_ERROR_CODE.INVALID_APP_USER_ID_ERROR) {
                console.error("RevenueCat login failed:", e);
            }
        }
      } else {
        // If user logs out, log them out from RevenueCat as well to clear the user ID
        await Purchases.logOut();
      }
    };

    manageRevenueCatUser();
    
  }, [user, isUserLoading]);

  return <>{children}</>;
}
