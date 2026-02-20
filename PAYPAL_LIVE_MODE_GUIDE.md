# 🅿️ How to Switch PayPal to Live Mode

You are currently using PayPal in **Sandbox (Test) Mode**. To accept real payments and fix the "PayPal isn't available" error, you need to switch to **Live Mode**.

---

## 🚀 Step 1: Get Live API Credentials

1.  Log in to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/live).
2.  Toggle the switch at the top from **Sandbox** to **Live**.
3.  Click **"Apps & Credentials"**.
4.  Click **"Create App"** (or use an existing one if you have it).
    *   *App Name:* `FocusRobin Live` (or similar)
    *   *App Type:* `Merchant`
5.  Once created, copy the **Client ID**.
6.  Click **"Show"** under Secret and copy the **Secret**.
    *   *Save these temporarily.*

---

## 🔗 Step 2: Configure Live Webhook

1.  In your App settings on the PayPal Developer Dashboard, scroll down to **"Webhooks"**.
2.  Click **"Add Webhook"**.
3.  **Webhook URL:**
    ```
    https://focusrobin.lt/api/webhooks/paypal
    ```
4.  **Event Types:**
    Select **"All events"** OR verify these specific events are checked:
    *   `Checkout order approved` (`CHECKOUT.ORDER.APPROVED`)
    *   `Payment capture completed` (`PAYMENT.CAPTURE.COMPLETED`)
    *   `Payment capture denied` (`PAYMENT.CAPTURE.DENIED`)
    *   `Payment capture refunded` (`PAYMENT.CAPTURE.REFUNDED`)
    *   `Checkout order cancelled` (`CHECKOUT.ORDER.CANCELLED`)
    *   `Checkout order voided` (`CHECKOUT.ORDER.VOIDED`)
5.  Click **"Save"**.
6.  Copy the **Webhook ID** (starts with `4...` or similar).

---

## 🖥️ Step 3: Update Environment Variables

You need to update your `.env` file with the Live credentials.

**Current (Sandbox):**
```env
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
# PAYPAL_WEBHOOK_ID=... (might be missing)
```

**Update to (Live):**
```env
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=your_live_client_id_here
PAYPAL_CLIENT_SECRET=your_live_secret_here
PAYPAL_WEBHOOK_ID=your_live_webhook_id_here
```

---

## ❓ What if I want to keep testing?

If you want to keep testing in **Sandbox Mode**, you must:
1.  Log in to PayPal with a **Sandbox Personal Account** (e.g., `buyer@test.com`) during checkout.
2.  Do NOT use your real PayPal account.
3.  Ensure your Sandbox Merchant account (in `.env`) is still valid and not restricted.
