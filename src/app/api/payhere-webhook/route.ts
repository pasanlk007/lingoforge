
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const merchant_id = body.get('merchant_id') as string;
    const order_id = body.get('order_id') as string;
    const payhere_amount = body.get('payhere_amount') as string;
    const payhere_currency = body.get('payhere_currency') as string;
    const status_code = body.get('status_code') as string;
    const md5sig = body.get('md5sig') as string;

    const secret = process.env.PAYHERE_MERCHANT_SECRET!;
    const secretHash = crypto.createHash('md5').update(secret).digest('hex').toUpperCase();
    const hash = crypto.createHash('md5')
      .update(merchant_id + order_id + payhere_amount + payhere_currency + status_code + secretHash)
      .digest('hex').toUpperCase();

    if (hash !== md5sig) {
      return new NextResponse('Invalid signature', { status: 400 });
    }

    if (status_code !== '2') {
      return new NextResponse('OK', { status: 200 });
    }

    const parts = order_id.split('_');
    const plan = parts[0];
    const language = parts[1];
    const userId = parts.slice(2).join('_');

    const projectId = process.env.FIREBASE_PROJECT_ID!;
    const token = await getFirebaseToken();
    
    // Fetch the user document to read existing unlocked content
    const userDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/userProfiles/${userId}`;
    const userDocRes = await fetch(userDocUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!userDocRes.ok) {
        console.error('PayHere webhook: Failed to fetch user doc for ID:', userId);
        return new NextResponse('User not found', { status: 404 });
    }
    const userDoc = await userDocRes.json();

    const fields: Record<string, unknown> = {
      subscriptionActive: { booleanValue: true },
      subscriptionPlan: { stringValue: plan },
      subscriptionSource: { stringValue: 'payhere' },
    };
    if (language) fields.subscriptionLanguage = { stringValue: language };
    
    const expiry = plan === 'weekly' 
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
      : null;
    if (expiry) fields.subscriptionExpiry = { stringValue: expiry };

    // Handle permanent content unlocks
    const contentKey = `${language}_survival`;
    const existingContent = userDoc.fields?.unlockedContent?.mapValue?.fields || {};
    let unlockedContentChanges = {};

    if (plan === 'lifetime') {
        unlockedContentChanges = { all: { booleanValue: true } };
    } else if (plan === 'course') {
        unlockedContentChanges = {
            ...existingContent,
            [contentKey]: {
                arrayValue: { values: Array.from({length: 12}, (_, i) => ({ integerValue: (i + 1).toString() })) }
            }
        };
    } else if (plan === 'weekly') {
        const existingWeeksArray = existingContent[contentKey]?.arrayValue?.values || [];
        const existingWeeks = existingWeeksArray.map((v: any) => parseInt(v.integerValue || '0', 10)).filter(Boolean);

        const nextWeek = existingWeeks.length > 0 ? Math.max(...existingWeeks) + 1 : 2; // Week 1 is free
        const newUnlockedWeeks = [...new Set([...existingWeeks, nextWeek])].sort((a,b) => a-b);
        
        unlockedContentChanges = {
            ...existingContent,
            [contentKey]: { arrayValue: { values: newUnlockedWeeks.map(w => ({ integerValue: w.toString() })) } }
        };
    }

    if (Object.keys(unlockedContentChanges).length > 0) {
        fields.unlockedContent = { mapValue: { fields: unlockedContentChanges } };
    }

    const fieldPaths = Object.keys(fields).map(k => `updateMask.fieldPaths=${k}`).join('&');
    const url = `https://firestore.googleapis.com/v1/${userDoc.name}?${fieldPaths}`;

    await fetch(url, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('PayHere webhook error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}

async function getFirebaseToken(): Promise<string> {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
  const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY!;
  const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf8');
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail, sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore'
  };

  const { SignJWT } = await import('jose');
  const key = require('crypto').createPrivateKey(privateKey);
  
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256' })
    .sign(key);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  const data = await response.json();
  return data.access_token;
}
