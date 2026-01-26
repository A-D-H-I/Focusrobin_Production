# 🚀 FocusRobin.lt Test Deployment - Environment Variables

**Domain:** `focusrobin.lt`  
**Environment:** Test/Sandbox  
**Date:** January 26, 2026

---

## ✅ Required Environment Variables for focusrobin.lt

### 🔴 CRITICAL - Must Set

```env
# ============================================
# BASE URLS (focusrobin.lt)
# ============================================
NEXTAUTH_URL=https://focusrobin.lt
NEXT_PUBLIC_SITE_URL=https://focusrobin.lt
NEXT_PUBLIC_URL=https://focusrobin.lt
AUTH_URL=https://focusrobin.lt

# ============================================
# AUTHENTICATION & SECURITY
# ============================================
AUTH_SECRET=your-test-secret-key-minimum-32-characters-long
CSRF_SECRET=your-csrf-secret-minimum-32-characters-long

# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgresql://user:password@host:5432/test_database?sslmode=require

# ============================================
# STRIPE (TEST MODE)
# ============================================
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# ============================================
# PAYPAL (SANDBOX MODE)
# ============================================
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-client-secret
PAYPAL_MODE=sandbox

# ============================================
# FACEBOOK OAUTH (TEST APP)
# ============================================
AUTH_FACEBOOK_ID=your-test-app-id
AUTH_FACEBOOK_SECRET=your-test-app-secret

# ============================================
# GOOGLE OAUTH (TEST)
# ============================================
AUTH_GOOGLE_ID=your-test-client-id
AUTH_GOOGLE_SECRET=your-test-client-secret

# ============================================
# EMAIL (RESEND)
# ============================================
RESEND_API_KEY=re_test_...

# ============================================
# AWS S3 (TEST BUCKET)
# ============================================
AWS_ACCESS_KEY_ID=your-test-access-key
AWS_SECRET_ACCESS_KEY=your-test-secret-key
AWS_S3_REGION=us-east-1
S3_BUCKET_NAME=your-test-bucket-name

# ============================================
# DROPBOX (OPTIONAL)
# ============================================
DROPBOX_ACCESS_TOKEN=your-test-dropbox-token

# ============================================
# ANALYTICS (TEST)
# ============================================
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=your-test-pixel-id
NEXT_PUBLIC_CLARITY_PROJECT_ID=your-test-project-id

# ============================================
# NODE ENVIRONMENT
# ============================================
NODE_ENV=development
```

---

## 🔗 OAuth Redirect URIs to Configure

### Facebook OAuth
Add to Facebook App Settings → Facebook Login → Settings:
```
https://focusrobin.lt/api/auth/callback/facebook
```

### Google OAuth
Add to Google Cloud Console → OAuth 2.0 Client → Authorized redirect URIs:
```
https://focusrobin.lt/api/auth/callback/google
```

---

## 🔔 Webhook URLs to Configure

### Stripe Webhooks
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Add endpoint: `https://focusrobin.lt/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET`

### PayPal Webhooks
1. Go to: https://developer.paypal.com/dashboard/applications/sandbox
2. Select your sandbox app
3. Add webhook URL: `https://focusrobin.lt/api/webhooks/paypal`
4. Select events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`

---

## ✅ Pre-Deployment Checklist

Before deploying to `focusrobin.lt`:

- [ ] All environment variables set in `.env` file
- [ ] `NEXTAUTH_URL=https://focusrobin.lt` is set
- [ ] `NEXT_PUBLIC_SITE_URL=https://focusrobin.lt` is set
- [ ] `NEXT_PUBLIC_URL=https://focusrobin.lt` is set
- [ ] Stripe keys are **test keys** (`sk_test_`, `pk_test_`)
- [ ] `PAYPAL_MODE=sandbox` is set
- [ ] Facebook OAuth redirect URI configured: `https://focusrobin.lt/api/auth/callback/facebook`
- [ ] Google OAuth redirect URI configured: `https://focusrobin.lt/api/auth/callback/google`
- [ ] Stripe webhook configured: `https://focusrobin.lt/api/webhooks/stripe`
- [ ] PayPal webhook configured: `https://focusrobin.lt/api/webhooks/paypal`
- [ ] Database URL points to test/staging database
- [ ] S3 bucket is a separate test bucket
- [ ] SSL certificate configured for `focusrobin.lt`
- [ ] DNS records pointing to your server

---

## 🚨 Important Notes

1. **Never use production credentials** - All keys should be test/sandbox
2. **OAuth redirect URIs must match exactly** - `https://focusrobin.lt/api/auth/callback/[provider]`
3. **Webhook URLs must be HTTPS** - Ensure SSL is configured
4. **Test Stripe webhooks** - Use Stripe CLI for local testing: `stripe listen --forward-to https://focusrobin.lt/api/webhooks/stripe`
5. **Database** - Use a separate test database, not production

---

## 📝 Quick Copy-Paste Template

```env
NEXTAUTH_URL=https://focusrobin.lt
NEXT_PUBLIC_SITE_URL=https://focusrobin.lt
NEXT_PUBLIC_URL=https://focusrobin.lt
AUTH_URL=https://focusrobin.lt
AUTH_SECRET=your-secret-here
DATABASE_URL=your-database-url
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox
AUTH_FACEBOOK_ID=...
AUTH_FACEBOOK_SECRET=...
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
RESEND_API_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_REGION=us-east-1
S3_BUCKET_NAME=...
NODE_ENV=development
```

---

*Domain: focusrobin.lt*  
*Environment: Test/Sandbox*

