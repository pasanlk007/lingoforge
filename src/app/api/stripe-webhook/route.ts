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

// This function handles the "checkout.session.completed" event.
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
    if (!subscriptionId) {
        console.error('Webhook Error: Missing subscription ID in checkout session.');
        return;
    }
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // For a new subscription, set the user as active.
    await updateDoc(userDocRef, {
      stripeCustomerId: stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      subscriptionActive: true,
      subscriptionSource: 'stripe',
      subscriptionExpiry: new Date(subscription.current_period_end * 1000).toISOString(),
    });

  } else if (session.mode === 'payment') {
    // This is for one-time payments (e.g., lifetime access).
    await updateDoc(userDocRef, {
      stripeCustomerId: stripeCustomerId,
      subscriptionActive: true,
      subscriptionSource: 'stripe',
      subscriptionExpiry: null, // Null expiry means lifetime access
    });
  }
}

// This function handles recurring subscription payments.
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const { firestore } = initializeFirebase();
    // Retrieve the user ID from the subscription metadata, which we set during checkout.
    const userId = subscription.metadata.firebaseUID;
    if (!userId) {
        console.error('Webhook Error: Missing firebaseUID in subscription metadata.');
        return;
    }
    const userDocRef = doc(firestore, 'userProfiles', userId);

    // Update the user's profile with the new subscription details.
    await updateDoc(userDocRef, {
        subscriptionActive: true, // Ensure user is marked as active
        stripeSubscriptionId: subscription.id,
        subscriptionExpiry: new Date(subscription.current_period_end * 1000).toISOString(),
    });
}

// This function handles when a subscription is canceled or expires.
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const { firestore } = initializeFirebase();
    const userId = subscription.metadata.firebaseUID;
    if (!userId) {
        console.error('Webhook Error: Missing firebaseUID in subscription metadata during deletion.');
        return;
    }
    const userDocRef = doc(firestore, 'userProfiles', userId);

    // Revert the user to a free plan.
    await updateDoc(userDocRef, {
        subscriptionActive: false,
        subscriptionSource: 'none',
        subscriptionExpiry: null,
        stripeSubscriptionId: null,
    });
}

// The main webhook handler function.
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
    // Verify the event came from Stripe.
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    // Handle the event based on its type.
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
            // For recurring payments, we get an invoice. We need to fetch the subscription
            // object to get the latest details.
            const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            await handleSubscriptionUpdated(subscription);
        }
        break;
      case 'customer.subscription.deleted':
        // This event fires when a subscription is canceled at the end of the billing period.
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        // Unhandled event type
    }
  } catch (error) {
    console.error("Error handling webhook event:", error);
    return new NextResponse('Webhook handler failed. View logs.', { status: 500 });
  }

  // Acknowledge receipt of the event.
  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}
