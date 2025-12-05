import Stripe from 'stripe';

// Ensure the secret key exists
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

// Create a singleton Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

export default stripe;

// Export types for convenience
export type { Stripe };


