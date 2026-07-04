import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/server-init';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
    if (secret && authHeader !== secret) {
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

    // Full debug log so we can see exactly what RevenueCat sends
    console.log('RC webhook full event:', JSON.stringify({
      eventType, appUserId, productId, entitlements, expirationAt
    }));

    if (!appUserId) return new NextResponse('No app_user_id', { status: 400 });

    const { firestore } = initializeFirebase();
    const userRef = firestore.collection('userProfiles').doc(appUserId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.warn('User not found:', appUserId);
      return new NextResponse('OK', { status: 200 });
    }

    // Check both product ID and entitlement name for scenario
    const isScenario =
      productId.toLowerCase().includes('scenario') ||
      entitlements.some((e: string) => e.toLowerCase().includes('scenario'));

    // Check for premium — covers both one-time and subscription
    const isPremium =
      entitlements.some((e: string) => e.toLowerCase().includes('premium')) ||
      (!isScenario && entitlements.length > 0);

    console.log('isScenario:', isScenario, 'isPremium:', isPremium);

    if (isScenario) {
      const isActive = ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'SUBSCRIPTION_EXTENDED'].includes(eventType);
      await userRef.update({
        scenarioSubscriptionActive: isActive,
        scenarioSubscriptionExpiry: expirationAt,
      });
      console.log('✅ Scenario', isActive ? 'activated' : 'deactivated', 'for', appUserId);
      return new NextResponse('OK', { status: 200 });
    }

    if (isPremium) {
      const isLifetime = productId === 'lifetime' || productId.includes('lifetime');
      const isCourse = productId === 'single_course' || productId.includes('single_course');

      if (eventType === 'INITIAL_PURCHASE' || eventType === 'NON_SUBSCRIPTION_PURCHASE') {
        if (isLifetime) {
          await userRef.update({
            subscriptionPlan: 'lifetime',
            subscriptionActive: true,
            subscriptionSource: 'google_play',
            subscriptionExpiry: null,
            'unlockedContent.all': true,
          });
          console.log('✅ Lifetime Pro unlocked for', appUserId);
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
          console.log('✅ Survival Pack unlocked for', appUserId, lang);
        } else {
          // Unknown premium product — log it so we can identify
          console.warn('Unknown premium product:', productId, 'entitlements:', entitlements);
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
    return new NextResponse('Error: ' + error.message, { status: 500 });
  }
}