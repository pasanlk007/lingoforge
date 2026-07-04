import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { initializeFirebase } from '@/firebase/server-init';

const packageName = 'com.lingoforge.app';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_PLAY_CLIENT_EMAIL,
    private_key: (process.env.GOOGLE_PLAY_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/androidpublisher'],
});

const androidpublisher = google.androidpublisher({ version: 'v3', auth });

async function findUserByObfuscatedId(firestore: any, obfuscatedAccountId: string) {
  const userRef = firestore.collection('userProfiles').doc(obfuscatedAccountId);
  const userDoc = await userRef.get();
  return userDoc.exists ? userDoc : null;
}

async function handleSubscriptionNotification(firestore: any, notification: any) {
  const { subscriptionId, purchaseToken } = notification;
  try {
    const sub = await androidpublisher.purchases.subscriptions.get({
      packageName,
      subscriptionId,
      token: purchaseToken,
    });

    const { obfuscatedExternalAccountId, orderId, acknowledgementState } = sub.data;
    if (!obfuscatedExternalAccountId) {
      console.log('No obfuscatedExternalAccountId found for this purchase.');
      return;
    }

    const userId = obfuscatedExternalAccountId;
    const userDoc = await findUserByObfuscatedId(firestore, userId);
    if (!userDoc) {
      console.log(`User not found for obfuscated ID: ${userId}`);
      return;
    }

    const isStillActive = sub.data.expiryTimeMillis ? parseInt(sub.data.expiryTimeMillis, 10) > Date.now() : false;

    // SCENARIO MODE — isolated recurring subscription, returns early
    if (subscriptionId.includes('scenario')) {
      await userDoc.ref.update({
        scenarioSubscriptionActive: isStillActive,
        scenarioSubscriptionExpiry: sub.data.expiryTimeMillis
          ? new Date(parseInt(sub.data.expiryTimeMillis, 10)).toISOString()
          : null,
      });
      console.log(`Updated user ${userId} Scenario Mode subscription: active=${isStillActive}`);
      return;
    }

    let plan = 'weekly';
    if (subscriptionId.includes('course')) plan = 'course';
    if (subscriptionId.includes('lifetime')) plan = 'lifetime';

    let fieldsToUpdate: any = {
      subscriptionActive: isStillActive,
      subscriptionSource: 'google_play',
      subscriptionPlan: plan,
      subscriptionExpiry: sub.data.expiryTimeMillis
        ? new Date(parseInt(sub.data.expiryTimeMillis, 10)).toISOString()
        : null,
      paymentProviderSubscriptionId: orderId,
    };

    // Note: one-time items (single_course, lifetime) are handled in handleOneTimeProductNotification
    // We keep standard subscription logic here for weekly plans
    await userDoc.ref.update(fieldsToUpdate);
    console.log(`Updated user ${userId} with plan ${plan}.`);
  } catch (error: any) {
    console.error('Error processing subscription notification:', error.message);
  }
}

async function handleOneTimeProductNotification(firestore: any, notification: any) {
  const { productId, purchaseToken, notificationType } = notification;
  console.log('One-time product notification:', productId, notificationType);

  // notificationType 1 = PURCHASED
  if (notificationType !== 1) return;

  try {
    const purchase = await androidpublisher.purchases.products.get({
      packageName,
      productId,
      token: purchaseToken,
    });

    // purchaseState 0 = Purchased
    if (purchase.data.purchaseState !== 0) return;

    const userId = purchase.data.obfuscatedExternalAccountId;
    if (!userId) {
      console.warn('No userId in one-time purchase:', productId);
      return;
    }

    const userDoc = await findUserByObfuscatedId(firestore, userId);
    if (!userDoc) {
      console.warn('User not found for one-time purchase:', userId);
      return;
    }

    const lang = (userDoc.data()?.selectedLanguage || 'French').toLowerCase();
    const weeks = Array.from({ length: 12 }, (_, i) => i + 1);

    if (productId.includes('lifetime')) {
      // Lifetime Pro: unlocks all paths
      await userDoc.ref.update({
        subscriptionPlan: 'lifetime',
        subscriptionActive: true,
        subscriptionSource: 'google_play',
        subscriptionExpiry: null,
        'unlockedContent.all': true,
      });
      console.log('✅ Lifetime Pro unlocked for:', userId);
    } else if (productId.includes('single_course')) {
      // Survival Pack: unlocks survival + alphabet + numbers for selected language
      await userDoc.ref.update({
        subscriptionActive: true,
        subscriptionSource: 'google_play',
        [`unlockedContent.${lang}_survival`]: weeks,
        [`unlockedContent.${lang}_alphabet`]: weeks,
        [`unlockedContent.${lang}_numbers`]: weeks,
      });
      console.log('✅ Survival Pack unlocked for:', userId, lang);
    }
  } catch (e: any) {
    console.error('One-time product validation error:', e.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { firestore } = initializeFirebase();
    const body = await req.json();

    if (!body.message || !body.message.data) {
      return new NextResponse('Invalid request body', { status: 400 });
    }

    const decodedData = Buffer.from(body.message.data, 'base64').toString('utf-8');
    const notification = JSON.parse(decodedData);

    if (notification.subscriptionNotification) {
      await handleSubscriptionNotification(firestore, notification.subscriptionNotification);
    } else if (notification.oneTimeProductNotification) {
      await handleOneTimeProductNotification(firestore, notification.oneTimeProductNotification);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('Google Play Webhook Error:', error);
    return new NextResponse('Internal Server Error: ' + error.message, { status: 500 });
  }
}