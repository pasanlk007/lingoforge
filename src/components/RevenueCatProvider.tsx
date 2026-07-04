'use client';

import { useEffect } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

const API_KEY = 'goog_jXyRicBRuGtmUSeQOTWYMyhunNS';
const ENTITLEMENT_ID = 'premium';
const SCENARIO_ENTITLEMENT_ID = 'lingoforge_scenario_monthly';

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
            const premiumEntitlement = info.entitlements.active[ENTITLEMENT_ID] || info.entitlements.active["lifetime"] || info.entitlements.active["single language course"];
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
            const { customerInfo } = await Purchases.logIn({ appUserID: user.uid });
            // After login, RevenueCat merges anonymous purchases. Check entitlements immediately.
            if (customerInfo && firestore) {
              const userProfileRef = doc(firestore, 'userProfiles', user.uid);
              const activeEntitlements = customerInfo.entitlements?.active || {};
              const entitlementKeys = Object.keys(activeEntitlements);
              const updates: any = {};

              if (entitlementKeys.includes('lifetime')) {
                updates.subscriptionPlan = 'lifetime';
                updates.subscriptionActive = true;
                updates.subscriptionSource = 'google_play';
                updates['unlockedContent.all'] = true;
              } else if (entitlementKeys.some((e) => e.includes('single') || e.includes('course'))) {
                const lang = localStorage.getItem('targetLanguage') || 'French';
                const langKey = lang.toLowerCase();
                const weeks = [1,2,3,4,5,6,7,8,9,10,11,12];
                updates.subscriptionActive = true;
                updates.subscriptionSource = 'google_play';
                updates['unlockedContent.' + langKey + '_survival'] = weeks;
                updates['unlockedContent.' + langKey + '_alphabet'] = weeks;
                updates['unlockedContent.' + langKey + '_numbers'] = weeks;
              }

              if (Object.keys(updates).length > 0) {
                updateDocumentNonBlocking(userProfileRef, updates);
                console.log('Restored purchases after login:', Object.keys(updates));
              }
            }
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
