import Stripe from 'stripe';

const stripeApiKey = process.env.STRIPE_API_KEY;

if (!stripeApiKey && process.env.NODE_ENV === 'production') {
  console.warn(
    'Stripe API key is not set. Stripe functionality will not work in production.'
  );
}

// Initialize Stripe with the API key. If the key is missing, Stripe functions will
// throw an error at runtime, but the app will build and start successfully.
export const stripe = new Stripe(stripeApiKey || '', {
  apiVersion: '2024-06-20',
  typescript: true,
});
