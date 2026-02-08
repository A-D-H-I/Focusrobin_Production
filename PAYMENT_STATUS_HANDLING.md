# Payment Status Handling Implementation

## Overview
This document describes the payment status handling system that properly handles all payment scenarios: **Success**, **Pending**, **Failed**, and **Returned** (user navigated back without completing payment).

## Local Testing with Stripe CLI

For local testing, use Stripe CLI to forward webhooks:

```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

This will forward Stripe webhook events to your local server for testing.

## Payment Status Handling

### 1. **Success** ✅
- Payment completed successfully
- Order marked as `COMPLETED` and `CONFIRMED`
- Cart cleared
- Analytics tracking (Meta Pixel, GA4)
- Invoice generated and sent

### 2. **Pending** ⏳
- Payment confirmed by Stripe but order not updated yet (webhook delay)
- Shows "Payment confirmed! Processing your order..."
- Automatically polls for order completion
- No wallet refund needed (payment is processing)

### 3. **Failed** ❌
- Payment was declined or failed
- Order marked as `FAILED` or `CANCELLED`
- **Wallet automatically refunded** if wallet amount was used
- User can try again with different payment method

### 4. **Returned** (User navigated back) 🔄
- User returned from payment page without completing payment
- Stripe session status checked:
  - If `unpaid` or `expired`: Payment not completed
  - If `paid` but order not updated: Payment pending (webhook delay)
- **Wallet automatically refunded** if payment wasn't completed
- User can try again

## Implementation Details

### New API Route: `/api/checkout/verify-session`

**Purpose:** Verify Stripe checkout session status in real-time

**Request:**
```json
POST /api/checkout/verify-session
{
  "orderId": "order_123"
}
```

**Response:**
```json
{
  "success": true,
  "paymentStatus": "COMPLETED" | "PENDING" | "FAILED",
  "stripePaymentStatus": "paid" | "unpaid",
  "stripeSessionStatus": "complete" | "expired" | "open",
  "orderStatus": "CONFIRMED" | "PENDING" | "CANCELLED",
  "isPaid": true | false,
  "message": "Payment completed successfully",
  "shouldRefundWallet": false
}
```

### Updated Checkout Success Page

The `/checkout/success` page now:

1. **Verifies Stripe session status** when orderId is present
2. **Handles all payment statuses** correctly
3. **Automatically refunds wallet** when payment wasn't completed
4. **Polls for completion** when payment is confirmed but order not updated yet
5. **Shows appropriate messages** for each status

### Payment Flow

```
User completes checkout
    ↓
Redirected to Stripe
    ↓
User returns to /checkout/success?orderId=...
    ↓
Check Stripe session status (verify-session API)
    ↓
┌─────────────────────────────────────┐
│ Payment Status Check                 │
├─────────────────────────────────────┤
│ ✅ paid + complete → SUCCESS         │
│ ⏳ paid + order not updated → PENDING│
│ ❌ unpaid/expired → FAILED           │
│ 🔄 open/expired → RETURNED           │
└─────────────────────────────────────┘
    ↓
If FAILED or RETURNED:
    → Refund wallet (if used)
    → Show error message
    → Allow user to try again

If PENDING:
    → Poll for order completion
    → Show "Processing..." message

If SUCCESS:
    → Clear cart
    → Track analytics
    → Show success message
```

## Wallet Refund Logic

Wallet is automatically refunded when:
- Payment status is `FAILED`
- Payment status is `CANCELLED`
- Stripe session status is `unpaid` or `expired`
- Order is not paid (`isPaid = false`)
- Wallet amount was used (`walletAmountUsed > 0`)

Wallet is **NOT** refunded when:
- Payment is completed successfully
- Payment is pending (webhook delay)
- Order is already paid

## Webhook Events (Production)

In production, Stripe webhooks handle payment status updates:

1. **`checkout.session.completed`** - Payment successful
2. **`checkout.session.expired`** - Session expired, refund wallet
3. **`payment_intent.succeeded`** - Backup confirmation
4. **`payment_intent.payment_failed`** - Payment failed, refund wallet
5. **`charge.refunded`** - Refund processed

## Testing Checklist

- [ ] Test successful payment flow
- [ ] Test payment failure (declined card)
- [ ] Test user returning without completing payment
- [ ] Test wallet refund for failed payments
- [ ] Test wallet refund for returned payments
- [ ] Test pending payment (webhook delay)
- [ ] Test with Stripe CLI locally
- [ ] Verify webhook events in production

## Files Modified

1. **`src/app/api/checkout/verify-session/route.ts`** - New API route for session verification
2. **`src/app/checkout/success/page.tsx`** - Updated to handle all payment statuses

## Environment Variables

No new environment variables required. Uses existing:
- `STRIPE_SECRET_KEY` - For Stripe API calls
- `STRIPE_WEBHOOK_SECRET` - For webhook verification (production)

## Notes

- The system checks Stripe session status in real-time, not just order status
- This ensures accurate payment status even if webhooks are delayed
- Wallet refunds are automatic and prevent users from losing wallet balance
- All payment scenarios are handled gracefully with appropriate user messages








