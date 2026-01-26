# 🧪 Test Deployment Environment Variables Guide

This guide lists all environment variables you need to configure for **TEST/SANDBOX** deployment.

---

## 🔴 CRITICAL - Must Set (Application Won't Work Without These)

### Authentication & Security
```env
# NextAuth Configuration
AUTH_SECRET=your-test-secret-key-min-32-chars
# OR (legacy)
NEXTAUTH_SECRET=your-test-secret-key-min-32-chars

# Base URL for your test deployment
NEXTAUTH_URL=https://focusrobin.lt
NEXT_PUBLIC_SITE_URL=https://focusrobin.lt
NEXT_PUBLIC_URL=https://focusrobin.lt
AUTH_URL=https://focusrobin.lt

# CSRF Protection (optional - will use AUTH_SECRET if not set)
CSRF_SECRET=your-csrf-secret-min-32-chars
```

### Database
```env
# PostgreSQL Database (use test/staging database)
DATABASE_URL=postgresql://user:password@host:5432/database_name?sslmode=require
```

---

## 💳 Payment Gateways (TEST/SANDBOX MODE)

### Stripe (Test Mode)
```env
# Stripe Test Keys (from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Webhook Secret (for test webhook endpoint)
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

**How to get Stripe test keys:**
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy "Publishable key" → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Copy "Secret key" → `STRIPE_SECRET_KEY`
4. For webhook: https://dashboard.stripe.com/test/webhooks → Create endpoint → Copy signing secret

### PayPal (Sandbox Mode)
```env
# PayPal Sandbox Credentials (from https://developer.paypal.com/dashboard/applications/sandbox)
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-client-secret

# IMPORTANT: Set to 'sandbox' for test deployment
PAYPAL_MODE=sandbox
```

**How to get PayPal sandbox credentials:**
1. Go to https://developer.paypal.com/dashboard/applications/sandbox
2. Create a new app or use existing
3. Copy "Client ID" → `PAYPAL_CLIENT_ID`
4. Copy "Secret" → `PAYPAL_CLIENT_SECRET`
5. Set `PAYPAL_MODE=sandbox`

---

## 🔐 OAuth Providers (TEST/SANDBOX)

### Facebook (Test App)
```env
# Facebook Test App Credentials (from https://developers.facebook.com/apps)
AUTH_FACEBOOK_ID=your-test-app-id
AUTH_FACEBOOK_SECRET=your-test-app-secret
# OR (legacy)
FACEBOOK_CLIENT_ID=your-test-app-id
FACEBOOK_CLIENT_SECRET=your-test-app-secret
```

**How to get Facebook test credentials:**
1. Go to https://developers.facebook.com/apps
2. Create a new app or use existing test app
3. Go to Settings → Basic
4. Copy "App ID" → `AUTH_FACEBOOK_ID`
5. Copy "App Secret" → `AUTH_FACEBOOK_SECRET`
6. Add test user in Roles → Test Users

### Google OAuth (Test)
```env
# Google OAuth Test Credentials (from https://console.cloud.google.com/apis/credentials)
AUTH_GOOGLE_ID=your-test-client-id
AUTH_GOOGLE_SECRET=your-test-client-secret
# OR (legacy)
GOOGLE_CLIENT_ID=your-test-client-id
GOOGLE_CLIENT_SECRET=your-test-client-secret
```

**How to get Google test credentials:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (or use existing)
3. Set authorized redirect URIs: `https://your-test-domain.com/api/auth/callback/google`
4. Copy "Client ID" → `AUTH_GOOGLE_ID`
5. Copy "Client secret" → `AUTH_GOOGLE_SECRET`

---

## 📧 Email Service (Test/Development)

### Resend (Test API Key)
```env
# Resend Test API Key (from https://resend.com/api-keys)
RESEND_API_KEY=re_test_...
```

**Note:** Resend test keys work the same way but emails won't actually be sent in test mode.

---

## ☁️ Cloud Storage (Test/Development)

### AWS S3 (Test Bucket)
```env
# AWS S3 Configuration (use separate test bucket)
AWS_ACCESS_KEY_ID=your-test-access-key
AWS_SECRET_ACCESS_KEY=your-test-secret-key
AWS_S3_REGION=us-east-1
S3_BUCKET_NAME=your-test-bucket-name
```

**Recommendation:** Create a separate S3 bucket for testing (e.g., `focusrobin-test`)

### Dropbox (Optional - Test Folder)
```env
# Dropbox Access Token (from https://www.dropbox.com/developers/apps)
DROPBOX_ACCESS_TOKEN=your-test-dropbox-token
```

**Note:** Use a test Dropbox app or separate folder for test deployment.

---

## 📊 Analytics (Test/Development)

### Google Analytics 4 (Test Property)
```env
# GA4 Measurement ID (create test property)
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Note:** Create a separate GA4 property for testing, or use existing test property.

### Meta (Facebook) Pixel (Test)
```env
# Meta Pixel ID (from https://business.facebook.com/events_manager)
NEXT_PUBLIC_META_PIXEL_ID=your-test-pixel-id
```

**Note:** Use test pixel or disable in test environment.

### Microsoft Clarity (Test)
```env
# Microsoft Clarity Project ID (from https://clarity.microsoft.com/)
NEXT_PUBLIC_CLARITY_PROJECT_ID=your-test-project-id
```

**Note:** Create separate Clarity project for testing, or disable in test environment.

---

## 🤖 AI Services (Optional - Test)

### Google Generative AI (Test)
```env
# Google AI API Key (from https://makersuite.google.com/app/apikey)
GOOGLE_GENERATIVE_AI_API_KEY=your-test-api-key
```

### Google Translation API (Test)
```env
# Option 1: Service Account JSON file path
GOOGLE_APPLICATION_CREDENTIALS=./path/to/test-service-account.json

# Option 2: Individual credentials
GOOGLE_TRANSLATE_PROJECT_ID=your-test-project-id
GOOGLE_TRANSLATE_CLIENT_EMAIL=your-test-service-account@project.iam.gserviceaccount.com
GOOGLE_TRANSLATE_PRIVATE_KEY=your-test-private-key
```

---

## 🌍 Other Configuration

### Node Environment
```env
# Set to 'development' or 'test' (NOT 'production')
NODE_ENV=development
```

### Currency API (Optional)
```env
# Exchange Rate API (free tier works for testing)
EXCHANGE_RATE_API_KEY=your-api-key
```

---

## ✅ Complete Test Deployment .env File Template

```env
# ============================================
# TEST DEPLOYMENT ENVIRONMENT VARIABLES
# ============================================

# Node Environment
NODE_ENV=development

# Base URLs
NEXTAUTH_URL=https://focusrobin.lt
NEXT_PUBLIC_SITE_URL=https://focusrobin.lt
NEXT_PUBLIC_URL=https://focusrobin.lt

# Authentication
AUTH_SECRET=your-test-secret-key-minimum-32-characters-long
CSRF_SECRET=your-csrf-secret-minimum-32-characters-long

# Database
DATABASE_URL=postgresql://user:password@host:5432/test_database?sslmode=require

# Stripe (TEST MODE)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# PayPal (SANDBOX MODE)
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-client-secret
PAYPAL_MODE=sandbox

# Facebook OAuth (TEST APP)
AUTH_FACEBOOK_ID=your-test-app-id
AUTH_FACEBOOK_SECRET=your-test-app-secret

# Google OAuth (TEST)
AUTH_GOOGLE_ID=your-test-client-id
AUTH_GOOGLE_SECRET=your-test-client-secret

# Email (Resend)
RESEND_API_KEY=re_test_...

# AWS S3 (TEST BUCKET)
AWS_ACCESS_KEY_ID=your-test-access-key
AWS_SECRET_ACCESS_KEY=your-test-secret-key
AWS_S3_REGION=us-east-1
S3_BUCKET_NAME=your-test-bucket-name

# Dropbox (Optional - Test)
DROPBOX_ACCESS_TOKEN=your-test-dropbox-token

# Analytics (Test Properties)
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=your-test-pixel-id
NEXT_PUBLIC_CLARITY_PROJECT_ID=your-test-project-id

# AI Services (Optional - Test)
GOOGLE_GENERATIVE_AI_API_KEY=your-test-api-key
```

---

## 🔍 Verification Checklist

Before deploying to test, verify:

- [ ] All payment gateways use **TEST/SANDBOX** credentials
- [ ] `PAYPAL_MODE=sandbox` is set
- [ ] Stripe keys start with `sk_test_` and `pk_test_`
- [ ] Database URL points to **test/staging** database
- [ ] OAuth apps configured with **test domain** redirect URIs
- [ ] S3 bucket is a **separate test bucket**
- [ ] Analytics properties are **test properties** (or disabled)
- [ ] `NODE_ENV` is NOT set to `production`
- [ ] All webhook URLs point to **test domain**

---

## ⚠️ Important Notes

1. **Never use production credentials in test deployment**
2. **Test Stripe webhooks** must be configured separately in Stripe dashboard
3. **Test PayPal webhooks** must be configured in PayPal developer dashboard
4. **OAuth redirect URIs** must match your test domain exactly
5. **Database** should be a separate test/staging database
6. **S3 bucket** should be separate to avoid mixing test/production data

---

## 🚀 Quick Start

1. Copy this template to `.env.local` (for local testing) or `.env` (for server)
2. Replace all placeholder values with your actual test credentials
3. Verify all services are in test/sandbox mode
4. Deploy and test!

---

*Last updated: January 26, 2026*

