import { NextRequest, NextResponse } from 'next/server';
import { getScenarioFirebaseToken, scenarioFirestoreBaseUrl } from '@/lib/scenarioFirestoreAdmin';

async function getUser(token: string, userId: string) {
  const url = `${scenarioFirestoreBaseUrl()}/userProfiles/${userId}`;
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!res.ok) return null;
  return await res.json();
}

function getField(doc: any, field: string) {
  const f = doc?.fields?.[field];
  if (!f) return undefined;
  return f.stringValue ?? f.booleanValue ?? f.integerValue ?? undefined;
}

async function updateUser(token: string, userId: string, fields: Record<string, any>) {
  const url = `${scenarioFirestoreBaseUrl()}/userProfiles/${userId}`;
  const masks = Object.keys(fields).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');

  const firestoreFields: any = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === null) firestoreFields[key] = { nullValue: null };
    else if (typeof value === 'boolean') firestoreFields[key] = { booleanValue: value };
    else if (Array.isArray(value)) firestoreFields[key] = { arrayValue: { values: value.map(v => ({ integerValue: v })) } };
    else if (typeof value === 'string') firestoreFields[key] = { stringValue: value };
  }

  const res = await fetch(`${url}?${masks}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: firestoreFields }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firestore update failed: ${err}`);
  }
  return res.json();
}

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
    const productId = (event.product_id || '').toLowerCase();
    const entitlementIds: string[] = event.entitlement_ids || [];
    const expirationAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;
    const aliases: string[] = event.aliases || [];

    // Resolve to real Firebase UID - check app_user_id first, then aliases
    let appUserId = event.app_user_id || '';
    if (!appUserId || appUserId.startsWith('$RC')) {
      const realUid = aliases.find((a: string) => a.length === 28 && !a.startsWith('$'));
      if (realUid) appUserId = realUid;
    }

    console.log(`RC webhook [${eventType}] user=${appUserId} product=${productId} entitlements=${JSON.stringify(entitlementIds)}`);

    if (!appUserId || appUserId.startsWith('$RC')) {
      console.warn('No valid Firebase UID found, aliases:', aliases);
      return new NextResponse('OK', { status: 200 });
    }

    const token = await getScenarioFirebaseToken();
    const userDoc = await getUser(token, appUserId);
    if (!userDoc) {
      console.warn(`User ${appUserId} not found in Firestore`);
      return new NextResponse('OK', { status: 200 });
    }

    const selectedLanguage = (getField(userDoc, 'selectedLanguage') || 'French').toLowerCase();
    const isScenario = productId.includes('scenario') || entitlementIds.some((e: string) => e.includes('scenario'));
    const isLifetime = productId === 'lifetime' || entitlementIds.includes('lifetime');
    const isCourse = productId === 'single_course' || entitlementIds.some((e: string) => e.includes('single') || e.includes('course'));

    console.log(`isScenario=${isScenario} isLifetime=${isLifetime} isCourse=${isCourse} lang=${selectedLanguage}`);

    if (isScenario) {
      const isActive = ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'SUBSCRIPTION_EXTENDED', 'NON_SUBSCRIPTION_PURCHASE'].includes(eventType);
      await updateUser(token, appUserId, {
        scenarioSubscriptionActive: isActive,
        scenarioSubscriptionExpiry: expirationAt || '',
      });
      console.log(`Scenario ${isActive ? 'activated' : 'deactivated'} for ${appUserId}`);
      return new NextResponse('OK', { status: 200 });
    }

    const isOneTime = ['INITIAL_PURCHASE', 'NON_SUBSCRIPTION_PURCHASE', 'NON_RENEWING_PURCHASE'].includes(eventType);

    if (isOneTime && isLifetime) {
      await updateUser(token, appUserId, {
        subscriptionPlan: 'lifetime',
        subscriptionActive: true,
        subscriptionSource: 'google_play',
        'unlockedContent.all': true,
      });
      console.log(`Lifetime Pro unlocked for ${appUserId}`);
    } else if (isOneTime && isCourse) {
      const weeks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      await updateUser(token, appUserId, {
        subscriptionActive: true,
        subscriptionSource: 'google_play',
        [`unlockedContent.${selectedLanguage}_survival`]: weeks,
        [`unlockedContent.${selectedLanguage}_alphabet`]: weeks,
        [`unlockedContent.${selectedLanguage}_numbers`]: weeks,
      });
      console.log(`Survival Pack unlocked for ${appUserId} (${selectedLanguage})`);
    } else {
      console.log(`No action: eventType=${eventType} isLifetime=${isLifetime} isCourse=${isCourse}`);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('RC webhook error:', error.message);
    return new NextResponse('Error: ' + error.message, { status: 500 });
  }
}