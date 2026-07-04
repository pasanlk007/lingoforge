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
  if (!obfuscatedAccountId) return null;
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

    const { obfuscatedExternalAccountId, orderId, expiryTimeMillis } = sub.data;
    if (!obfuscatedExternalAccountId) {
      console.log('No user ID (obfuscatedExternalAccountId) found in subscription data.');
      return;
    }

    const userId = obfuscatedExternalAccountId;
    const userDoc = await findUserByObfuscatedId(firestore, userId);
    if (!userDoc) {
      console.log(`User profile not found for ID: ${userId}`);
      return;
    }

    const isStillActive = expiryTimeMillis ? parseInt(expiryTimeMillis, 10) > Date.now() : false;
    const expiryDate = expiryTimeMillis ? new Date(parseInt(expiryTimeMillis, 10)).toISOString() : null;

    // SCENARIO MODE — identified by SKU naming convention
    if (subscriptionId.toLowerCase().includes('scenario')) {
      await userDoc.ref.update({
        scenarioSubscriptionActive: isStillActive,
        scenarioSubscriptionExpiry: expiryDate,
      });
      console.log(`✅ Scenario Mode subscription updated via Google Webhook for ${userId}: active=${isStillActive}`);
      return;
    }

    // Standard Learning Paths
    let plan = 'weekly';
    if (subscriptionId.includes('course')) plan = 'course';
    if (subscriptionId.includes('lifetime')) plan = 'lifetime';

    await userDoc.ref.update({
      subscriptionActive: isStillActive,
      subscriptionSource: 'google_play',
      subscriptionPlan: plan,
      subscriptionExpiry: expiryDate,
      paymentProviderSubscriptionId: orderId || null,
    });
    console.log(`Updated standard subscription for ${userId} (Plan: ${plan}, Active: ${isStillActive})`);
    
  } catch (error: any) {
    console.error('Error processing Google subscription notification:', error.message);
  }
}

async function handleOneTimeProductNotification(firestore: any, notification: any) {
  const { productId, purchaseToken, notificationType } = notification;
  console.log('Google Play one-time product notification:', productId, notificationType);

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
      console.warn('No userId in one-time purchase notification:', productId);
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
      await userDoc.ref.update({
        subscriptionPlan: 'lifetime',
        subscriptionActive: true,
        subscriptionSource: 'google_play',
        subscriptionExpiry: null,
        'unlockedContent.all': true,
      });
      console.log('✅ Lifetime Pro unlocked via Google Webhook for:', userId);
    } else if (productId.includes('single_course')) {
      await userDoc.ref.update({
        subscriptionActive: true,
        subscriptionSource: 'google_play',
        [`unlockedContent.${lang}_survival`]: weeks,
        [`unlockedContent.${lang}_alphabet`]: weeks,
        [`unlockedContent.${lang}_numbers`]: weeks,
      });
      console.log('✅ Survival Pack unlocked via Google Webhook for:', userId, lang);
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