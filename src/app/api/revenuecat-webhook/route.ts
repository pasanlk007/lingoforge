import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/server-init';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
    if (secret && authHeader !== secret) {
      console.warn('RevenueCat webhook: unauthorized request');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const event = body.event;
    if (!event) return new NextResponse('No event data', { status: 400 });

    const eventType = event.type;
    const appUserId = event.app_user_id;
    const productId = (event.product_id || '').toLowerCase();
    
    // RevenueCat Webhook V1 uses entitlement_ids, V2 uses entitlements (map)
    const entitlementIds = event.entitlement_ids || (event.entitlements ? Object.keys(event.entitlements) : []);
    
    const expirationAt = event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null;

    console.log(`RevenueCat webhook [${eventType}] for user ${appUserId}, product ${productId}`);
    if (!appUserId) return new NextResponse('No app_user_id', { status: 400 });

    const { firestore } = initializeFirebase();
    const userRef = firestore.collection('userProfiles').doc(appUserId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      console.warn(`RevenueCat webhook: user ${appUserId} not found in Firestore`);
      return new NextResponse('OK', { status: 200 });
    }

    // Identify the plan type
    const isScenario = productId.includes('scenario') || entitlementIds.some((e) => e.includes('scenario'));
    const isPremium = entitlementIds.some((e) => e === 'lifetime' || e.includes('single') || e.includes('course')) || (!isScenario && entitlementIds.length > 0);

    const updateFields: any = {};

    if (isScenario) {
      // Logic for Scenario Mode (isolated recurring subscription)
      const isActive = ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'SUBSCRIPTION_EXTENDED', 'NON_SUBSCRIPTION_PURCHASE'].includes(eventType);
      
      updateFields.scenarioSubscriptionActive = isActive;
      updateFields.scenarioSubscriptionExpiry = expirationAt;
      
      if (eventType === 'EXPIRATION') {
        updateFields.scenarioSubscriptionActive = false;
      }

      await userRef.update(updateFields);
      console.log(`✅ Scenario Mode status updated for ${appUserId}: active=${updateFields.scenarioSubscriptionActive}`);
      return new NextResponse('OK', { status: 200 });
    }

    if (isPremium) {
      // Logic for Survival/Pro Paths (permanent unlocks)
      const isLifetime = productId === 'lifetime' || productId.includes('lifetime') || entitlementIds.includes('lifetime');
      const isCourse = productId === 'single_course' || productId.includes('single_course') || entitlementIds.some((e) => e.includes('single') || e.includes('course'));

      if (eventType === 'INITIAL_PURCHASE' || eventType === 'NON_SUBSCRIPTION_PURCHASE') {
        if (isLifetime) {
          updateFields.subscriptionPlan = 'lifetime';
          updateFields.subscriptionActive = true;
          updateFields.subscriptionSource = 'google_play';
          updateFields.subscriptionExpiry = null;
          updateFields['unlockedContent.all'] = true;
          console.log(`✅ Lifetime Pro unlocked for ${appUserId}`);
        } else if (isCourse) {
          const lang = (userDoc.data()?.selectedLanguage || 'French').toLowerCase();
          const weeks = Array.from({ length: 12 }, (_, i) => i + 1);
          updateFields.subscriptionActive = true;
          updateFields.subscriptionSource = 'google_play';
          updateFields[`unlockedContent.${lang}_survival`] = weeks;
          updateFields[`unlockedContent.${lang}_alphabet`] = weeks;
          updateFields[`unlockedContent.${lang}_numbers`] = weeks;
          console.log(`✅ Survival Pack unlocked for ${appUserId} (${lang})`);
        } else {
          // Standard weekly subscription
          updateFields.subscriptionActive = true;
          updateFields.subscriptionSource = 'google_play';
          updateFields.subscriptionExpiry = expirationAt;
        }
      } else if (eventType === 'RENEWAL') {
        updateFields.subscriptionActive = true;
        updateFields.subscriptionExpiry = expirationAt;
      } else if (eventType === 'CANCELLATION' || eventType === 'EXPIRATION') {
        // Only deactivate if NOT a lifetime user
        const userData = userDoc.data();
        if (userData?.subscriptionPlan !== 'lifetime') {
          updateFields.subscriptionActive = false;
          updateFields.subscriptionExpiry = expirationAt;
        }
      }

      if (Object.keys(updateFields).length > 0) {
        console.log('Writing to Firestore:', JSON.stringify(updateFields));
        await userRef.update(updateFields);
        console.log('Firestore write successful for', appUserId);
      } else {
        console.warn('No updateFields generated for eventType:', eventType, 'productId:', productId, 'entitlementIds:', entitlementIds);
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('RevenueCat webhook error:', error);
    return new NextResponse('Internal Server Error: ' + error.message, { status: 500 });
  }
}