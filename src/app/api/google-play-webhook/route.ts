import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { initializeFirebase } from '@/firebase/server-init';

// firestore is initialized lazily inside POST() and threaded through to avoid
// crashing during Next.js build-time page-data collection (same fix pattern
// as src/firebase/server-init.ts's lazy init).
const packageName = 'com.lingoforge.app';

// Initialize the Google API client
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_PLAY_CLIENT_EMAIL,
    private_key: (process.env.GOOGLE_PLAY_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/androidpublisher'],
});

const androidpublisher = google.androidpublisher({
  version: 'v3',
  auth: auth,
});

async function findUserByObfuscatedId(firestore: any, obfuscatedAccountId: string) {
  // In our app, the obfuscatedAccountId IS the Firebase UID.
  const userRef = firestore.collection('userProfiles').doc(obfuscatedAccountId);
  const userDoc = await userRef.get();
  if (userDoc.exists) {
    return userDoc;
  }
  return null;
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
    
    // In our app, we set this to the Firebase UID
    const userId = obfuscatedExternalAccountId;
    const userDoc = await findUserByObfuscatedId(firestore, userId);

    if (!userDoc) {
      console.log(`User not found for obfuscated ID: ${userId}`);
      return;
    }

    const isAcknowledged = acknowledgementState === 1;
    const isStillActive = sub.data.expiryTimeMillis ? parseInt(sub.data.expiryTimeMillis, 10) > Date.now() : false;

    // SCENARIO MODE (isolated recurring subscription, separate from the
    // permanent unlockedContent model below used by Survival/Pro). Checked
    // first and returns early — does not touch unlockedContent at all.
    if (subscriptionId.includes('scenario')) {
      await userDoc.ref.update({
        scenarioSubscriptionActive: isStillActive,
        scenarioSubscriptionExpiry: sub.data.expiryTimeMillis ? new Date(parseInt(sub.data.expiryTimeMillis, 10)).toISOString() : null,
      });
      console.log(`Updated user ${userId} Scenario Mode subscription: active=${isStillActive}`);
      return;
    }

    let plan = 'weekly'; // Default
    if (subscriptionId.includes('course')) plan = 'course';
    if (subscriptionId.includes('lifetime')) plan = 'lifetime';

    let fieldsToUpdate: any = {
      subscriptionActive: isStillActive,
      subscriptionSource: 'google_play',
      subscriptionPlan: plan,
      subscriptionExpiry: sub.data.expiryTimeMillis ? new Date(parseInt(sub.data.expiryTimeMillis, 10)).toISOString() : null,
      paymentProviderSubscriptionId: orderId,
    };
    
    // Logic for permanent unlocks
    if (isAcknowledged) {
        const userProfile = userDoc.data() || {};
        const language = (userProfile.selectedLanguage || 'french').toLowerCase();
        const contentKey = `${language}_survival`;
        
        let unlockedContentChanges = userProfile.unlockedContent || {};

        if (plan === 'lifetime') {
            unlockedContentChanges.all = true;
        } else if (plan === 'course') {
            unlockedContentChanges[contentKey] = Array.from({length: 12}, (_, i) => i + 1);
        } else if (plan === 'weekly') {
            const existingWeeks = unlockedContentChanges[contentKey] || [];
            const nextWeek = existingWeeks.length > 0 ? Math.max(...existingWeeks) + 1 : 2;
            unlockedContentChanges[contentKey] = [...new Set([...existingWeeks, nextWeek])];
        }
        fieldsToUpdate.unlockedContent = unlockedContentChanges;
    }

    await userDoc.ref.update(fieldsToUpdate);
    console.log(`Updated user ${userId} with new subscription status for plan ${plan}.`);

  } catch (error: any) {
    console.error('Error processing subscription notification:', error.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { firestore } = initializeFirebase();
    const body = await req.json();
    
    // The actual notification is base64-encoded in the 'data' field
    if (!body.message || !body.message.data) {
      return new NextResponse('Invalid request body', { status: 400 });
    }

    const decodedData = Buffer.from(body.message.data, 'base64').toString('utf-8');
    const notification = JSON.parse(decodedData);
    
    // Differentiate between subscription and one-time product notifications
    if (notification.subscriptionNotification) {
       await handleSubscriptionNotification(firestore, notification.subscriptionNotification);
    } else if (notification.oneTimeProductNotification) {
      // TODO: Handle one-time product purchases if needed in the future
      console.log('Received one-time product notification:', notification.oneTimeProductNotification);
    }

    // Acknowledge the message so Pub/Sub doesn't resend it
    return new NextResponse('OK', { status: 200 });

  } catch (error: any) {
    console.error('Google Play Webhook Error:', error);
    return new NextResponse('Internal Server Error: ' + error.message, { status: 500 });
  }
}
