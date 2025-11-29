# Email Setup Guide

This guide explains how to configure email sending for the contact form using Resend.

## Prerequisites

1. Sign up for a free Resend account at [https://resend.com](https://resend.com)
2. Get your API key from the Resend dashboard

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Resend API Key (required)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Email address to send contact form submissions to (required)
CONTACT_EMAIL=support@focusrobin.com

# Email address to send from (optional, defaults to onboarding@resend.dev)
# Note: You must verify this domain/email in Resend before using it
RESEND_FROM_EMAIL=noreply@focusrobin.com

# Send confirmation email to users (optional, defaults to false)
SEND_CONFIRMATION_EMAIL=true
```

## Setup Steps

1. **Get your Resend API Key:**
   - Go to [https://resend.com/api-keys](https://resend.com/api-keys)
   - Create a new API key
   - Copy the key and add it to your `.env.local` file as `RESEND_API_KEY`

2. **Verify your domain (recommended):**
   - Go to [https://resend.com/domains](https://resend.com/domains)
   - Add and verify your domain (e.g., `focusrobin.com`)
   - This allows you to send emails from addresses like `noreply@focusrobin.com`
   - If you don't verify a domain, you can use the default `onboarding@resend.dev` for testing

3. **Set the recipient email:**
   - Set `CONTACT_EMAIL` to the email address where you want to receive contact form submissions
   - This should be your support email address

4. **Optional: Enable confirmation emails:**
   - Set `SEND_CONFIRMATION_EMAIL=true` to send an automatic confirmation email to users after they submit the form
   - This is disabled by default

## Testing

1. Fill out the contact form on your website
2. Submit the form
3. Check the email inbox specified in `CONTACT_EMAIL`
4. You should receive a formatted email with all the form details

## Email Features

- **HTML Email Template:** The contact form submission is sent as a beautifully formatted HTML email
- **Reply-To:** The email includes the user's email as the reply-to address, so you can reply directly
- **Subject Mapping:** Form subjects are mapped to readable labels (e.g., "order-support" → "Order Support")
- **Optional Confirmation:** Users can receive an automatic confirmation email (if enabled)

## Troubleshooting

### "Email service is not configured"
- Make sure `RESEND_API_KEY` is set in your `.env.local` file
- Restart your development server after adding environment variables

### "Failed to send email"
- Check that your Resend API key is valid
- Verify your domain in Resend (if using a custom from email)
- Check the Resend dashboard for any error messages
- Make sure you haven't exceeded your Resend rate limits

### Emails going to spam
- Verify your domain in Resend
- Set up SPF and DKIM records (Resend provides instructions)
- Use a verified domain email address instead of `onboarding@resend.dev`

## Resend Free Tier Limits

- 3,000 emails per month
- 100 emails per day
- Perfect for small to medium websites

## Production Deployment

When deploying to production:

1. Add the environment variables to your hosting platform (Vercel, Netlify, etc.)
2. Make sure `RESEND_API_KEY` is set as a secret/environment variable
3. Verify your domain in Resend for production use
4. Test the contact form after deployment

