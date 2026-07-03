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
    if (!event) return new NextResponse('No event', { status: 400 });

    const eventType = event.type;
    const appUserId = event.app_user_id;
    const productId = event.product_id || '';
    const entitlements = event.entitlement_ids || [];
    const expirationAt = event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null;

    console.log(`RevenueCat webhook: ${eventType} for user ${appUserId}, product ${productId}`);
    if (!appUserId) return new NextResponse('No app_user_id', { status: 400 });

    const { firestore } = initializeFirebase();
    const userRef = firestore.collection('userProfiles').doc(appUserId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      console.warn(`RevenueCat webhook: user ${appUserId} not found`);
      return new NextResponse('OK', { status: 200 });
    }

    const isScenario = productId.includes('scenario') || entitlements.includes('scenario');
    const isPremium = entitlements.includes('premium') || (!isScenario && entitlements.length > 0);

    if (isScenario) {
      const isActive = ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'SUBSCRIPTION_EXTENDED'].includes(eventType);
      await userRef.update({
        scenarioSubscriptionActive: isActive,
        scenarioSubscriptionExpiry: expirationAt,
      });
      console.log(`✅ Scenario ${isActive ? 'activated' : 'deactivated'} for ${appUserId}`);
      return new NextResponse('OK', { status: 200 });
    }

    if (isPremium) {
      const isLifetime = productId.includes('lifetime') || productId === 'lifetime';
      const isCourse = productId.includes('single_course') || productId === 'single_course';

      if (eventType === 'INITIAL_PURCHASE' || eventType === 'NON_SUBSCRIPTION_PURCHASE') {
        if (isLifetime) {
          await userRef.update({
            subscriptionPlan: 'lifetime',
            subscriptionActive: true,
            subscriptionSource: 'google_play',
            subscriptionExpiry: null,
            'unlockedContent.all': true,
          });
          console.log(`✅ Lifetime Pro unlocked for ${appUserId}`);
        } else if (isCourse) {
          const lang = (userDoc.data()?.selectedLanguage || 'French').toLowerCase();
          const weeks = Array.from({ length: 12 }, (_, i) => i + 1);
          await userRef.update({
            subscriptionActive: true,
            subscriptionSource: 'google_play',
            [`unlockedContent.${lang}_survival`]: weeks,
            [`unlockedContent.${lang}_alphabet`]: weeks,
            [`unlockedContent.${lang}_numbers`]: weeks,
          });
          console.log(`✅ Survival Pack unlocked for ${appUserId} (${lang})`);
        }
      } else if (eventType === 'RENEWAL') {
        await userRef.update({ subscriptionActive: true, subscriptionExpiry: expirationAt });
      } else if (eventType === 'CANCELLATION' || eventType === 'EXPIRATION') {
        if (!isLifetime) {
          await userRef.update({ subscriptionActive: false, subscriptionExpiry: expirationAt });
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('RevenueCat webhook error:', error);
    return new NextResponse('Internal Server Error: ' + error.message, { status: 500 });
  }
}