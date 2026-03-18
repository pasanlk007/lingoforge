import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { initializeFirebase } from '@/firebase/server-init';
import type { UserProfile } from '@/lib/types';

// This function handles POST requests to create a Stripe Checkout session.
export async function POST(req: Request) {
  try {
    const { auth, firestore } = initializeFirebase();
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];

    if (!token) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { priceId, mode, successPath, cancelPath } = await req.json();

    if (!priceId || !mode || !successPath || !cancelPath) {
      return new NextResponse(JSON.stringify({ error: 'Missing required parameters' }), { status: 400 });
    }

    const userDocRef = firestore.collection('userProfiles').doc(userId);
    const userDoc = await userDocRef.get();
    let userProfile = userDoc.data() as UserProfile;

    let stripeCustomerId = userProfile?.stripeCustomerId;

    // Create a new Stripe customer if one doesn't exist for the user
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userProfile.email,
        name: userProfile.displayName,
        metadata: {
          firebaseUID: userId,
        },
      });
      stripeCustomerId = customer.id;
      // Note: The webhook will also save this to prevent race conditions.
      await userDocRef.update({ stripeCustomerId: stripeCustomerId });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const successUrl = `${appUrl}${successPath}`;
    const cancelUrl = `${appUrl}${cancelPath}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: mode,
      customer: stripeCustomerId,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Pass the user's UID to the webhook
      client_reference_id: userId,
      // For subscriptions, pass the subscription data
      ...(mode === 'subscription' && {
        subscription_data: {
          metadata: {
            firebaseUID: userId,
          }
        }
      })
    });

    return new NextResponse(JSON.stringify({ sessionId: session.id, url: session.url }), { status: 200 });

  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
