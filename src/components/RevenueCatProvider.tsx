'use client';

import { useEffect } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

const API_KEY = 'goog_jXyRicBRuGtmUSeQOTWYMyhunNS';
const ENTITLEMENT_ID = 'premium';
const SCENARIO_ENTITLEMENT_ID = 'scenario';

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    const init = async () => {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) {
          return;
        }

        const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
        
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        await Purchases.configure({ apiKey: API_KEY });

        try {
          Purchases.addPurchaserInfoUpdateListener(async (info: any) => {
            const premiumEntitlement = info.entitlements.active[ENTITLEMENT_ID];
            const hasActiveSubscription = typeof premiumEntitlement !== 'undefined';

            // Scenario Mode (isolated) — does not affect subscriptionActive/
            // unlockedContent used by Survival/Pro above.
            const scenarioEntitlement = info.entitlements.active[SCENARIO_ENTITLEMENT_ID];
            const hasActiveScenarioSubscription = typeof scenarioEntitlement !== 'undefined';

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
              updateDocumentNonBlocking(userProfileRef, {
                subscriptionActive: hasActiveSubscription,
                subscriptionSource: source,
                subscriptionExpiry: premiumEntitlement?.expirationDate || null,
                scenarioSubscriptionActive: hasActiveScenarioSubscription,
                scenarioSubscriptionExpiry: scenarioEntitlement?.expirationDate || null,
              });
            }
          });
        } catch (e) {
          // addPurchaserInfoUpdateListener is not implemented on some
          // plugin/platform combinations and throws/rejects instead of
          // failing gracefully. Entitlement updates will still arrive via
          // the server-side Google Play webhook in that case.
          console.warn('RevenueCat addPurchaserInfoUpdateListener unavailable:', e);
        }
    };

    init();

  }, [firestore, user]);

  useEffect(() => {
    const manageUser = async () => {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform() || isUserLoading) {
            return;
        }
        
        const { Purchases, PURCHASES_ERROR_CODE } = await import('@revenuecat/purchases-capacitor');

        if (user) {
          try {
            await Purchases.logIn({ appUserID: user.uid });
          } catch (e: any) {
              if (e.code !== PURCHASES_ERROR_CODE.INVALID_APP_USER_ID_ERROR) {
                  console.error("RevenueCat login failed:", e);
              }
          }
        } else {
          await Purchases.logOut();
        }
    };

    manageUser();
    
  }, [user, isUserLoading]);

  return <>{children}</>;
}
