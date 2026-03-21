import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/server-init';
import crypto from 'crypto';

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
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
    const status = payload.data?.attributes?.status;

    const { firestore } = initializeFirebase();

    // Find user by email
    const usersSnapshot = await firestore
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
      // Payment successful - activate subscription
      await userDoc.ref.update({
        subscriptionActive: true,
        subscriptionSource: 'lemonsqueezy',
        subscriptionExpiry: null,
        paymentProviderSubscriptionId: payload.data?.id || null,
      });
      console.log('Subscription activated for:', userEmail);
    }

    if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
      // Subscription cancelled - deactivate
      await userDoc.ref.update({
        subscriptionActive: false,
        subscriptionExpiry: new Date().toISOString(),
      });
      console.log('Subscription cancelled for:', userEmail);
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
