# Stripe Payment Integration - Complete Guide

## ✅ Implementation Status

The Stripe payment integration has been fully implemented and is ready to use.

## 📋 What Was Implemented

### Phase 1: Dependencies & Config ✅
- ✅ Installed `stripe` and `@stripe/stripe-js` packages
- ✅ Created `src/lib/stripe.ts` with singleton Stripe instance
- ✅ Environment variables configured

### Phase 2: Database Schema ✅
- ✅ Added `stripeSessionId` (String, unique, nullable) to Order model
- ✅ Added `stripePaymentIntentId` (String, nullable) to Order model
- ✅ Added `isPaid` (Boolean, default false) to Order model
- ✅ Updated `OrderStatus` enum to include `PAID`
- ✅ Database schema updated

### Phase 3: Backend Logic ✅

#### Checkout Action (`src/app/actions/checkout.ts`)
- ✅ `createCheckoutSession()` function:
  - Gets user session
  - Fetches cart with items
  - Creates Order in database with `isPaid: false`, `status: 'PENDING'`
  - Creates Stripe Checkout Session
  - Passes `orderId` in metadata (CRITICAL)
  - Sets success URL: `/checkout/success?orderId={orderId}`
  - Returns Stripe checkout URL

#### Webhook Handler (`src/app/api/webhooks/stripe/route.ts`)
- ✅ Handles `checkout.session.completed` event
- ✅ Verifies signature using `STRIPE_WEBHOOK_SECRET`
- ✅ Extracts `orderId` from metadata
- ✅ Updates Order: `isPaid: true`, `status: 'PAID'`
- ✅ Clears user's cart
- ✅ Updates product stock
- ✅ Adds cashback to wallet
- ✅ Handles expired sessions, failed payments, and refunds

### Phase 4: Frontend UI ✅

#### Checkout Page (`src/app/checkout/page.tsx`)
- ✅ Updated to use `createCheckoutSession()` for card payments
- ✅ Redirects to Stripe Checkout on success
- ✅ Falls back to original flow for wallet-only or other payment methods

#### Success Page (`src/app/checkout/success/page.tsx`)
- ✅ Displays "Payment Successful" message
- ✅ Shows order details using `orderId` parameter
- ✅ Fetches order from `/api/orders/[orderId]` endpoint
- ✅ Clears cart on successful payment

#### API Route (`src/app/api/orders/[orderId]/route.ts`)
- ✅ GET endpoint to fetch order details
- ✅ User authentication and authorization
- ✅ Returns order with items and shipping address

## 🔧 Required Environment Variables

Add these to your `.env` or `.env.local` file:

```env
# Stripe Keys (REQUIRED)
STRIPE_SECRET_KEY="sk_test_..."  # Get from https://dashboard.stripe.com/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."  # Get from https://dashboard.stripe.com/apikeys
STRIPE_WEBHOOK_SECRET="whsec_..."  # Get from Stripe CLI or Dashboard

# App URL (REQUIRED)
NEXT_PUBLIC_URL="http://localhost:9002"  # Change to production URL when deploying
```

## 🚀 Setup Instructions

### 1. Get Stripe API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Test** keys (or **Live** keys for production)
3. Add them to your `.env` file

### 2. Setup Webhook (For Local Testing)

#### Option A: Using Stripe CLI (Recommended for Development)

1. **Download Stripe CLI:**
   - Go to https://github.com/stripe/stripe-cli/releases/latest
   - Download `stripe_X.X.X_windows_x86_64.zip`
   - Extract and add to PATH

2. **Login:**
   ```bash
   stripe login
   ```

3. **Start Webhook Forwarding:**
   ```bash
   stripe listen --forward-to localhost:9002/api/webhooks/stripe
   ```

4. **Copy the Webhook Secret:**
   - The terminal will print: `whsec_...`
   - Add it to your `.env` as `STRIPE_WEBHOOK_SECRET`

#### Option B: Using Stripe Dashboard (For Production)

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`, `charge.refunded`
5. Copy the "Signing secret" and add to `.env`

### 3. Regenerate Prisma Client

**Important:** Stop your dev server first, then run:

```bash
npx prisma generate
```

Then restart your dev server.

## 🧪 Testing the Integration

### Test Flow:

1. **Add items to cart**
2. **Go to checkout** (`/checkout`)
3. **Fill in shipping address**
4. **Select "Credit/Debit Card"** payment method
5. **Click "Complete Order"**
6. **You'll be redirected to Stripe Checkout**
7. **Use test card:**
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
8. **Complete payment**
9. **You'll be redirected to `/checkout/success?orderId=...`**
10. **Order automatically updates to `PAID` via webhook**

### Test Cards:

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires Authentication:** `4000 0025 0000 3155`

See more: https://stripe.com/docs/testing

## 📊 Payment Flow Diagram

```
User clicks "Complete Order"
    ↓
createCheckoutSession() called
    ↓
Order created in DB (status: PENDING, isPaid: false)
    ↓
Stripe Checkout Session created
    ↓
User redirected to Stripe
    ↓
User completes payment
    ↓
Stripe sends webhook to /api/webhooks/stripe
    ↓
Webhook verifies signature
    ↓
Order updated (status: PAID, isPaid: true)
    ↓
Cart cleared, stock updated, cashback added
    ↓
User redirected to /checkout/success
```

## 🔍 Troubleshooting

### Issue: "STRIPE_SECRET_KEY is not set"
**Solution:** Add `STRIPE_SECRET_KEY` to your `.env` file

### Issue: Webhook not updating orders
**Solution:** 
1. Check `STRIPE_WEBHOOK_SECRET` is set correctly
2. Make sure Stripe CLI is forwarding to correct URL
3. Check server logs for webhook errors

### Issue: "Order not found" on success page
**Solution:** 
1. Check the `orderId` parameter in URL
2. Verify the order exists in database
3. Check user authentication

### Issue: Prisma client generation fails
**Solution:** 
1. Stop your dev server
2. Run `npx prisma generate`
3. Restart dev server

## 📝 Important Notes

1. **Orders are created BEFORE payment** - This allows tracking even if payment fails
2. **Webhook is critical** - Without it, orders won't update to PAID automatically
3. **Test mode vs Live mode** - Use test keys for development, live keys for production
4. **Webhook secret changes** - Each Stripe CLI session generates a new secret, update your `.env` accordingly

## 🎯 Next Steps

1. ✅ Add environment variables
2. ✅ Setup Stripe CLI (for local testing)
3. ✅ Test the checkout flow
4. ✅ Verify webhook is receiving events (check server logs)
5. ✅ Test with different payment scenarios

The integration is complete and ready to use! 🎉


