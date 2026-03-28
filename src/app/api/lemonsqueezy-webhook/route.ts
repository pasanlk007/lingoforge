
import { NextResponse } from 'next/server';
import crypto from 'crypto';

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

function createJWT(): string {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim();

  // --- DEBUG LOGGING ---
  console.log('Using client email:', clientEmail);
  console.log('Using private key (first 50 chars):', privateKey.substring(0, 50));
  // --- END DEBUG LOGGING ---
  
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore',
  })).toString('base64url');
  
  const signingInput = `${header}.${payload}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = sign.sign(privateKey, 'base64url');
  
  const jwt = `${signingInput}.${signature}`;

  // --- DEBUG LOGGING ---
  console.log('Generated JWT:', jwt);
  // --- END DEBUG LOGGING ---

  return jwt;
}

async function getAccessToken(): Promise<string> {
  const jwt = createJWT();
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await response.json();

  if (!data.access_token) {
    // --- DEBUG LOGGING ---
    console.error('Failed to get access token. Google response:', data);
    // --- END DEBUG LOGGING ---
    throw new Error('Failed to get access token: ' + JSON.stringify(data));
  }

  return data.access_token;
}

async function findUserByEmail(email: string, token: string) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
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
            value: { stringValue: email.toLowerCase() },
          },
        },
        limit: 1,
      },
    }),
  });
  
  const data = await response.json();
  if (data[0]?.document) return data[0].document;
  return null;
}

async function updateUserDoc(docName: string, active: boolean, expiry: string | null, token: string, plan?: string) {
  const fields: any = {
    subscriptionActive: { booleanValue: active },
    subscriptionSource: { stringValue: 'lemonsqueezy' },
  };
  if (expiry) fields.subscriptionExpiry = { stringValue: expiry };
  if (plan) fields.subscriptionPlan = { stringValue: plan };

  const fieldPaths = Object.keys(fields).map(k => `updateMask.fieldPaths=${k}`).join('&');
  const url = `https://firestore.googleapis.com/v1/${docName}?${fieldPaths}`;
  
  await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
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
    const testMode = payload.meta?.test_mode || payload.data?.attributes?.test_mode;

    if (testMode) {
      console.log('Test mode skipped');
      return new NextResponse('OK', { status: 200 });
    }

    if (!userEmail) return new NextResponse('OK', { status: 200 });

    const token = await getAccessToken();
    const userDoc = await findUserByEmail(userEmail, token);

    if (!userDoc) {
      console.log('User not found:', userEmail);
      return new NextResponse('OK', { status: 200 });
    }

    if (eventName === 'subscription_created' || eventName === 'order_created' || eventName === 'subscription_updated') {
      const renewsAt = payload.data?.attributes?.renews_at || null;
      const endsAt = payload.data?.attributes?.ends_at || null;
      const productName = (payload.data?.attributes?.product_name || '').toLowerCase();
      const customLanguage = payload.meta?.custom_data?.language || null;
      
      let plan = 'weekly';
      if (productName.includes('lifetime')) plan = 'lifetime';
      else if (productName.includes('course')) plan = 'course';
      else plan = 'weekly';

      await updateUserDoc(userDoc.name, true, renewsAt || endsAt, token, plan);
      console.log('✅ Subscription activated for:', userEmail, 'plan:', plan);
    }

    if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
      await updateUserDoc(userDoc.name, false, new Date().toISOString(), token);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}
