import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

function getStripeInstance(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    });
  }
  return stripeInstance;
}

// Lazily initializes on first actual property access rather than at module
// load - Next.js's build step imports this module while statically
// generating pages, before STRIPE_SECRET_KEY is available in that context,
// so an eager check here broke the production build.
const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripeInstance(), prop, receiver);
  },
});

export default stripe;

// Export types for convenience
export type { Stripe };


