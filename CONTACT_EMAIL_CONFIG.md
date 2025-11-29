# Contact Form Email Configuration

## Current Setup

When users submit the contact form, emails are sent to:

**Current Recipient:** `focusrobin25@gmail.com` (your verified Resend email)

## How to Change the Recipient Email

### Option 1: Use a Different Verified Email (Quick Fix)

In your `.env.local` file, add:

```env
RESEND_VERIFIED_EMAIL=your-email@gmail.com
```

**Note:** This email must be the one you used to sign up for Resend, or you need to verify it in your Resend dashboard.

### Option 2: Use Any Email Address (Requires Domain Verification)

1. **Verify your domain in Resend:**
   - Go to https://resend.com/domains
   - Add your domain (e.g., `focusrobin.com`)
   - Add the DNS records provided by Resend
   - Wait for verification

2. **Update `.env.local`:**
   ```env
   RESEND_DOMAIN_VERIFIED=true
   CONTACT_EMAIL=support@focusrobin.com
   # Or any email address you want
   ```

## Email Priority Logic

The system uses emails in this order:

1. **If `RESEND_DOMAIN_VERIFIED=true`:**
   - Uses `TEST_EMAIL` (if set) OR
   - Uses `CONTACT_EMAIL` (if set) OR
   - Falls back to verified email

2. **If domain NOT verified (current situation):**
   - Always uses `RESEND_VERIFIED_EMAIL` (defaults to `focusrobin25@gmail.com`)
   - This is a Resend free tier limitation

## Recommended Setup for Production

```env
# Resend API Key
RESEND_API_KEY=re_your_api_key_here

# Verify your domain first, then set this to true
RESEND_DOMAIN_VERIFIED=true

# Where to receive contact form submissions
CONTACT_EMAIL=support@focusrobin.com

# Email to send from (must be from verified domain)
RESEND_FROM_EMAIL=noreply@focusrobin.com

# Verified email (fallback if domain not verified)
RESEND_VERIFIED_EMAIL=focusrobin25@gmail.com
```

## Current Status

✅ **Working:** Emails are being sent to `focusrobin25@gmail.com`  
⚠️ **Limitation:** Can only send to verified email until domain is verified  
📧 **To receive at different email:** Verify your domain in Resend first

