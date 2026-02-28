# 🔔 Stripe Webhook Events Configuration

**Webhook URL:** `https://focusrobin.lt/api/webhooks/stripe`

---

## ✅ Required Events (Must Configure)

Your application handles these Stripe webhook events. Configure them in your Stripe Dashboard:

### 1. **checkout.session.completed** ⭐ PRIMARY
- **Purpose:** Main event for successful payments
- **What it does:**
  - Marks order as `COMPLETED` and `CONFIRMED`
  - Clears user's cart
  - Updates product stock
  - Adds cashback to user wallet
  - Generates and sends invoice email with PDF
  - Uploads invoice to Dropbox

**Status:** ✅ **REQUIRED** - This is the main payment success event

---

### 2. **checkout.session.expired**
- **Purpose:** Handles expired checkout sessions
- **What it does:**
  - Marks order as `CANCELLED` and `FAILED`
  - Refunds wallet amount if used
  - Prevents orders from staying in pending state

**Status:** ✅ **REQUIRED** - Prevents stuck orders

---

### 3. **payment_intent.succeeded**
- **Purpose:** Backup confirmation for successful payments
- **What it does:**
  - Ensures order is marked as paid (backup to checkout.session.completed)
  - Updates order status if checkout.session.completed didn't fire

**Status:** ✅ **RECOMMENDED** - Backup confirmation

---

### 4. **payment_intent.payment_failed**
- **Purpose:** Handles failed payment attempts
- **What it does:**
  - Marks order payment as `FAILED`
  - Refunds wallet amount if used
  - Updates order status

**Status:** ✅ **REQUIRED** - Handles payment failures

---

### 5. **charge.refunded**
- **Purpose:** Handles refunds processed in Stripe
- **What it does:**
  - Marks order as `REFUNDED`
  - Updates payment status to `REFUNDED`
  - Updates order status

**Status:** ✅ **REQUIRED** - If you process refunds through Stripe

---

## 📋 Complete Event List for Stripe Dashboard

When configuring your webhook endpoint in Stripe Dashboard, select these events:

```
✅ checkout.session.completed
✅ checkout.session.expired
✅ payment_intent.succeeded
✅ payment_intent.payment_failed
✅ charge.refunded
```

---

## 🚀 How to Configure in Stripe Dashboard

### Step 1: Go to Webhooks
1. Navigate to: https://dashboard.stripe.com/test/webhooks (for test mode)
2. Click **"+ Add endpoint"**

### Step 2: Enter Webhook URL
```
https://focusrobin.lt/api/webhooks/stripe
```

### Step 3: Select Events
Click **"Select events"** and choose:

**Minimum Required:**
- ✅ `checkout.session.completed`
- ✅ `checkout.session.expired`
- ✅ `payment_intent.payment_failed`

**Recommended (Full Coverage):**
- ✅ `checkout.session.completed`
- ✅ `checkout.session.expired`
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`
- ✅ `charge.refunded`

### Step 4: Copy Webhook Secret
After creating the endpoint:
1. Click on the webhook endpoint
2. Click **"Reveal"** next to "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Add to your `.env` file:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## ⚠️ Important Notes

1. **Test vs Live Mode:**
   - Configure **separate webhooks** for test and live modes
   - Test webhook: https://dashboard.stripe.com/test/webhooks
   - Live webhook: https://dashboard.stripe.com/webhooks

2. **Webhook Secret:**
   - Each webhook endpoint has its own secret
   - Test webhook secret starts with `whsec_test_`
   - Live webhook secret starts with `whsec_live_`
   - Use the correct secret for your environment

3. **Event Order:**
   - `checkout.session.completed` is the primary event
   - `payment_intent.succeeded` is a backup/confirmation
   - Both may fire for the same payment (this is normal)

4. **Testing:**
   - Use Stripe CLI to test webhooks locally:
     ```bash
     stripe listen --forward-to https://focusrobin.lt/api/webhooks/stripe
     ```
   - Or use Stripe Dashboard → Webhooks → Send test webhook

---

## 📊 Event Flow Diagram

```
Customer completes checkout
         ↓
checkout.session.completed (PRIMARY)
  → Updates order to CONFIRMED
  → Clears cart
  → Updates stock
  → Adds cashback
  → Sends invoice email
         ↓
payment_intent.succeeded (BACKUP)
  → Ensures order is marked as paid
  → Updates if checkout.session.completed didn't fire
```

**If payment fails:**
```
Payment fails
         ↓
payment_intent.payment_failed
  → Marks order as FAILED
  → Refunds wallet amount
```

**If checkout expires:**
```
Checkout session expires
         ↓
checkout.session.expired
  → Marks order as CANCELLED
  → Refunds wallet amount
```

**If refund processed:**
```
Refund processed in Stripe
         ↓
charge.refunded
  → Marks order as REFUNDED
  → Updates payment status
```

---

## ✅ Quick Checklist

- [ ] Webhook endpoint created: `https://focusrobin.lt/api/webhooks/stripe`
- [ ] All 5 events selected in Stripe Dashboard
- [ ] Webhook secret copied to `.env` as `STRIPE_WEBHOOK_SECRET`
- [ ] Test webhook sent and verified working
- [ ] Separate webhooks configured for test and live modes

---

*Last updated: January 26, 2026*  
*Domain: focusrobin.lt*
















