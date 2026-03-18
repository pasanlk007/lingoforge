import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { initializeFirebase } from '@/firebase/server-init';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

export const config = {
  api: {
    bodyParser: false,
  },
};

const getSubscriptionTypeFromPriceId = (priceId: string | undefined): 'monthly' | 'course' | 'lifetime' | 'free' => {
  if (!priceId) return 'free';

  if (priceId === process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID) {
    return 'monthly';
  }
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_COURSE_PRICE_ID) {
    return 'course';
  }
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID) {
    return 'lifetime';
  }
  return 'free';
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { firestore } = initializeFirebase();
  const userId = session.client_reference_id;
  const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

  if (!userId) {
    console.error('Webhook Error: Missing client_reference_id (Firebase UID) in checkout session.');
    return;
  }

  const userDocRef = doc(firestore, 'userProfiles', userId);

  if (session.mode === 'subscription') {
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId!);

    await updateDoc(userDocRef, {
      stripeCustomerId: stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      subscriptionType: getSubscriptionTypeFromPriceId(subscription.items.data[0].price.id),
      subscriptionExpiry: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
    });
  } else if (session.mode === 'payment') {
    const priceId = session.line_items?.data[0].price?.id;
    await updateDoc(userDocRef, {
      stripeCustomerId: stripeCustomerId,
      stripePriceId: priceId,
      subscriptionType: getSubscriptionTypeFromPriceId(priceId),
      subscriptionExpiry: null, // one-time payments do not expire
    });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const { firestore } = initializeFirebase();
    const userId = subscription.metadata.firebaseUID;
    if (!userId) {
        console.error('Webhook Error: Missing firebaseUID in subscription metadata.');
        return;
    }
    const userDocRef = doc(firestore, 'userProfiles', userId);
    await updateDoc(userDocRef, {
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        subscriptionType: getSubscriptionTypeFromPriceId(subscription.items.data[0].price.id),
        subscriptionExpiry: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
    });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const { firestore } = initializeFirebase();
    const userId = subscription.metadata.firebaseUID;
    if (!userId) {
        console.error('Webhook Error: Missing firebaseUID in subscription metadata during deletion.');
        return;
    }
    const userDocRef = doc(firestore, 'userProfiles', userId);
    await updateDoc(userDocRef, {
        subscriptionType: 'free',
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
        subscriptionExpiry: null,
    });
}


export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
      console.error("Webhook secret or signature not found.");
      return new NextResponse('Webhook secret not configured', { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
            const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            await handleSubscriptionUpdated(subscription);
        }
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        // console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error("Error handling webhook event:", error);
    return new NextResponse('Webhook handler failed. View logs.', { status: 500 });
  }

  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}
