# PayPal Payment Integration - Complete Guide

## ✅ Implementation Status

The PayPal payment integration has been fully implemented alongside Stripe and is ready to use.

## 📋 What Was Implemented

### Phase 1: PayPal SDK Library ✅
- ✅ Created `src/lib/paypal.ts` with:
  - Access token generation
  - Order creation
  - Order capture
  - Webhook verification
  - Refund support

### Phase 2: Database Schema ✅
- ✅ Added `paypalOrderId` (String, unique, nullable) to Order model
- ✅ Added `paypalCaptureId` (String, nullable) to Order model

### Phase 3: API Routes ✅

#### Create Order (`src/app/api/paypal/create-order/route.ts`)
- Creates order in database
- Creates PayPal order
- Returns approval URL for redirect

#### Capture Order (`src/app/api/paypal/capture-order/route.ts`)
- Captures payment after customer approval
- Updates order status
- Clears cart
- Updates stock
- Adds cashback
- Sends confirmation email

#### Webhook Handler (`src/app/api/webhooks/paypal/route.ts`)
- Handles PayPal webhook events
- Backup for order updates

### Phase 4: Frontend UI ✅
- ✅ Added payment method selection (Stripe/PayPal)
- ✅ PayPal branded button
- ✅ Success page handles PayPal capture

## 🔧 Required Environment Variables

Add these to your `.env` or `.env.local` file:

```env
# PayPal API Keys (REQUIRED)
PAYPAL_CLIENT_ID="your-client-id"
PAYPAL_CLIENT_SECRET="your-client-secret"

# PayPal Mode (optional, defaults to 'sandbox')
PAYPAL_MODE="sandbox"  # Use 'live' for production

# PayPal Webhook ID (optional but recommended for production)
PAYPAL_WEBHOOK_ID="your-webhook-id"
```

## 🚀 Setup Instructions

### Step 1: Create PayPal Developer Account

1. Go to https://developer.paypal.com/
2. Click **"Log in to Dashboard"** (use your existing PayPal account)
3. If you don't have a developer account yet, it will be automatically created

### Step 2: Create a Sandbox App

1. After logging in, go to **Dashboard** → **Apps & Credentials**
2. Make sure **Sandbox** tab is selected (not Live)
3. Click **"Create App"**
4. Enter:
   - **App Name**: `FocusRobin Store` (or any name)
   - **App Type**: Select **Merchant**
5. Click **"Create App"**

### Step 3: Get Your Credentials

After creating the app, you'll see:
- **Client ID**: Something like `AXs8Kl2j...` (copy this)
- **Secret**: Click "Show" to reveal (copy this)

Add them to your `.env` file:
```env
PAYPAL_CLIENT_ID=AXs8Kl2j...your-client-id
PAYPAL_CLIENT_SECRET=EAm8x...your-client-secret
PAYPAL_MODE=sandbox
```

### Step 4: Get Test Buyer Account

1. Go to **Dashboard** → **Sandbox** → **Accounts**
2. You'll see pre-created test accounts:
   - **Business account** (sb-xxxxx@business.example.com) - for receiving payments
   - **Personal account** (sb-xxxxx@personal.example.com) - for testing purchases
3. Click on the **Personal account** → Click "View/Edit Account"
4. Note the **email** and **password** - you'll use these to test payments

### Step 5: Set Up Webhook (Optional but Recommended)

1. Go to **Dashboard** → **Apps & Credentials** → Click your app
2. Scroll down to **Webhooks**
3. Click **Add Webhook**
4. Enter your webhook URL: `https://yourdomain.com/api/webhooks/paypal`
   - For local testing, use ngrok: `https://your-ngrok-url.ngrok.io/api/webhooks/paypal`
5. Select events:
   - `CHECKOUT.ORDER.APPROVED`
   - `CHECKOUT.ORDER.CANCELLED`
   - `CHECKOUT.ORDER.VOIDED`
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`
6. Click **Save**
7. Copy the **Webhook ID** and add to `.env`:
```env
PAYPAL_WEBHOOK_ID=your-webhook-id
```

### Step 6: Apply Database Migration

Run the following commands:

```bash
# Generate Prisma client with new fields
npx prisma generate

# Push schema changes to database
npx prisma db push
```

Then restart your dev server.

## 🧪 Testing the Integration

### Test Flow:

1. **Add items to cart**
2. **Go to checkout** (`/checkout`)
3. **Fill in shipping address**
4. **Select "PayPal"** as payment method
5. **Click "Pay with PayPal"**
6. **You'll be redirected to PayPal Sandbox**
7. **Log in with your test Personal account credentials**:
   - Email: The sandbox personal email (e.g., sb-xxxxx@personal.example.com)
   - Password: The password you noted/set
8. **Complete payment on PayPal**
9. **You'll be redirected to `/checkout/success`**
10. **Payment is captured and order is confirmed**

### Test Credentials:

For PayPal sandbox, use the personal test account from step 4.

Default sandbox accounts often have:
- Email: sb-xxxxx@personal.example.com
- Password: Check in Sandbox Accounts section

## 📊 Payment Flow Diagram

```
User clicks "Pay with PayPal"
    ↓
/api/paypal/create-order called
    ↓
Order created in DB (status: PENDING, isPaid: false)
    ↓
PayPal Order created via API
    ↓
User redirected to PayPal for approval
    ↓
User logs in and approves payment
    ↓
User redirected to /checkout/success
    ↓
/api/paypal/capture-order called
    ↓
PayPal payment captured
    ↓
Order updated (status: CONFIRMED, isPaid: true)
    ↓
Cart cleared, stock updated, cashback added
    ↓
Confirmation email sent
```

## 🔍 Troubleshooting

### Issue: "PayPal credentials are not configured"
**Solution:** Add `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` to your `.env` file

### Issue: "Failed to create PayPal order"
**Solution:** 
1. Check your PayPal credentials are correct
2. Ensure you're using sandbox credentials for testing
3. Check server logs for detailed error

### Issue: Order not captured after PayPal approval
**Solution:** 
1. Make sure you're redirected to the correct success URL
2. Check if session storage has the pending order data
3. Check server logs for capture errors

### Issue: Webhook not receiving events
**Solution:** 
1. Ensure webhook URL is accessible from internet
2. Check `PAYPAL_WEBHOOK_ID` is set correctly
3. For local testing, use ngrok to expose your local server

### Issue: "Unauthorized" error on capture
**Solution:** 
1. User must be logged in
2. Order must belong to the logged-in user
3. PayPal order ID must match

## 📝 Important Notes

1. **Orders are created BEFORE payment** - This allows tracking even if payment fails
2. **Capture happens on return** - Unlike Stripe, PayPal requires explicit capture after approval
3. **Sandbox vs Live** - Use sandbox credentials for testing, live credentials for production
4. **Currency** - Currently configured for EUR, change in `createPayPalOrder` if needed

## 🔐 Security Considerations

1. Never expose `PAYPAL_CLIENT_SECRET` to the frontend
2. Always verify webhook signatures in production
3. Validate order ownership before capture
4. Store PayPal Order ID and Capture ID for refund support

## 🚀 Going Live

When ready for production:

1. Go to PayPal Dashboard → Apps & Credentials
2. Switch to **Live** tab
3. Create a new app or use existing
4. Get **Live** Client ID and Secret
5. Update `.env`:
```env
PAYPAL_CLIENT_ID=live-client-id
PAYPAL_CLIENT_SECRET=live-client-secret
PAYPAL_MODE=live
```
6. Set up Live webhook with your production URL
7. Test with a small real transaction

## 🎯 Integration Complete!

PayPal is now integrated alongside Stripe. Customers can choose their preferred payment method at checkout! 🎉

