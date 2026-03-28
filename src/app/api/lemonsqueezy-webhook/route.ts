import { NextResponse } from 'next/server';
import crypto from 'crypto';

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

async function getFirestoreToken(): Promise<string> {
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/datastore'],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token || '';
}

async function findUserByEmail(email: string) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const token = await getFirestoreToken();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'userProfiles' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'email' },
            op: 'EQUAL',
            value: { stringValue: email },
          },
        },
        limit: 1,
      },
    }),
  });
  
  const data = await response.json();
  if (data[0]?.document) {
    return data[0].document;
  }
  return null;
}

async function updateUserSubscription(docName: string, active: boolean, expiry: string | null) {
  const token = await getFirestoreToken();
  const url = `https://firestore.googleapis.com/v1/${docName}?updateMask.fieldPaths=subscriptionActive&updateMask.fieldPaths=subscriptionSource&updateMask.fieldPaths=subscriptionExpiry`;
  
  await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        subscriptionActive: { booleanValue: active },
        subscriptionSource: { stringValue: 'lemonsqueezy' },
        subscriptionExpiry: expiry ? { stringValue: expiry } : { nullValue: null },
      },
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

    if (!userEmail) {
      return new NextResponse('No email', { status: 200 });
    }

    const userDoc = await findUserByEmail(userEmail);

    if (!userDoc) {
      console.log('User not found:', userEmail);
      return new NextResponse('OK', { status: 200 });
    }

    const docName = userDoc.name;

    if (eventName === 'subscription_created' || eventName === 'order_created') {
      const renewsAt = payload.data?.attributes?.renews_at || null;
      const endsAt = payload.data?.attributes?.ends_at || null;
      const expiryDate = renewsAt || endsAt || null;
      await updateUserSubscription(docName, true, expiryDate);
      console.log('Subscription activated for:', userEmail);
    }

    if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
      await updateUserSubscription(docName, false, new Date().toISOString());
      console.log('Subscription cancelled for:', userEmail);
    }

    if (eventName === 'subscription_resumed') {
      await updateUserSubscription(docName, true, null);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
