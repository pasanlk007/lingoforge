import { NextResponse } from 'next/server';
import crypto from 'crypto';
import * as admin from 'firebase-admin';

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

function getAdminApp() {
  if (admin.apps.length > 0) return admin.apps[0]!;
  
  const privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY || '', 'base64').toString('utf8');

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-signature') || '';
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '';

    if (!verifySignature(rawBody, signature, secret)) {
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    const userEmail = payload.data?.attributes?.user_email;
    const testMode = payload.data?.attributes?.test_mode;

    if (testMode) {
      console.log('Test mode order skipped');
      return new NextResponse('OK', { status: 200 });
    }

    if (!userEmail) {
      return new NextResponse('No email', { status: 200 });
    }

    const app = getAdminApp();
    const db = admin.firestore(app);

    const usersSnapshot = await db
      .collection('userProfiles')
      .where('email', '==', userEmail)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log('User not found:', userEmail);
      return new NextResponse('OK', { status: 200 });
    }

    const userDoc = usersSnapshot.docs[0];

    if (eventName === 'subscription_created' || eventName === 'order_created') {
      const renewsAt = payload.data?.attributes?.renews_at || null;
      const endsAt = payload.data?.attributes?.ends_at || null;
      const expiryDate = renewsAt || endsAt || null;
      await userDoc.ref.update({
        subscriptionActive: true,
        subscriptionSource: 'lemonsqueezy',
        subscriptionExpiry: expiryDate,
        paymentProviderSubscriptionId: payload.data?.id || null,
      });
      console.log('Subscription activated for:', userEmail);
    }

    if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
      await userDoc.ref.update({
        subscriptionActive: false,
        subscriptionExpiry: new Date().toISOString(),
      });
    }

    if (eventName === 'subscription_resumed') {
      await userDoc.ref.update({
        subscriptionActive: true,
        subscriptionExpiry: null,
      });
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
