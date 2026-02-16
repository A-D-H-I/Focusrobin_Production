# 💳 How to Switch Stripe to Live Mode

You are currently using Stripe in **Test Mode**. To accept real payments, you need to switch to **Live Mode** and update your VPS configuration.

---

## 🚀 Step 1: Switch to Live Mode

1.  Log in to your **Stripe Dashboard**.
2.  If you are using a **different account** for production, log out and log in with that account.
3.  In the top-right corner, toggle the **"Test Mode"** switch to **OFF**.
    *   *Note: You may need to activate your account by providing business details if you haven't already.*

---

## 🔑 Step 2: Get Live API Keys

1.  Go to **Developers** → **API Keys**.
2.  Locate the **Standard keys** section.
3.  Copy the **Publishable key** (starts with `pk_live_...`).
4.  Reveal and copy the **Secret key** (starts with `sk_live_...`).
    *   *Save these temporarily (e.g., in a notepad), you will need them for the VPS.*

---

## 🔗 Step 3: Configure Live Webhook

1.  Go to **Developers** → **Webhooks**.
2.  Click **"Add endpoint"** (or "Add an endpoint").
3.  **Endpoint URL:**
    ```
    https://focusrobin.lt/api/webhooks/stripe
    ```
4.  **Select events to listen to:**
    Click **"Select events"** and check the following:
    *   `checkout.session.completed`
    *   `checkout.session.expired`
    *   `payment_intent.succeeded`
    *   `payment_intent.payment_failed`
5.  Click **"Add endpoint"**.
6.  **Get Signing Secret:**
    *   On the enhanced webhook page, locate **"Signing secret"**.
    *   Click **"Reveal"**.
    *   Copy the secret (starts with `whsec_...`).

---

## 🍏 Step 4: Apple Pay Domain Verification (Optional but Recommended)

If you want Apple Pay to work:
1.  Go to **Settings** → **Payment methods** → **Apple Pay**.
2.  Click **"Add new domain"**.
3.  Enter: `focusrobin.lt`
4.  Download the verification file.
5.  *Stripe might ask you to host this file. Since your site is already live, we might need to upload this file to your `public/.well-known` folder if verification fails automatically.*
    *   *Try verifying first. If it fails, let me know.*

---

## 🖥️ Step 5: Update VPS Environment Setting

Now you need to update the `.env` file on your server.

**Variables to Update:**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

I will help you apply these updates once you have the keys ready.
