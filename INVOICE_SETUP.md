# Invoice System Setup Guide

This guide explains how to set up the automated invoice system that sends invoices to customers and stores them in Google Drive.

## Features

✅ **Automatic Invoice Generation** - PDF invoices are generated automatically after successful payment  
✅ **Email Notifications** - Customers receive:
   - Payment confirmation email
   - Invoice email with PDF attachment
✅ **Google Drive Storage** - All invoices are automatically uploaded to your Google Drive

## Prerequisites

1. **Resend Account** (already set up for contact form)
2. **Google Cloud Project** with Drive API enabled
3. **Service Account** for Google Drive access

## Setup Steps

### 1. Google Drive API Setup

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google Drive API:**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

3. **Create a Service Account:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Give it a name (e.g., "FocusRobin Invoices")
   - Click "Create and Continue"
   - Skip role assignment (optional)
   - Click "Done"

4. **Create and Download Service Account Key:**
   - Click on the service account you just created
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose "JSON" format
   - Download the JSON file

5. **Create and Share Google Drive Folder:**
   - Go to [Google Drive](https://drive.google.com/)
   - Create a folder named "FocusRobin Invoices"
   - Right-click the folder > "Share"
   - Add the service account email (from the JSON file's `client_email`)
   - Give it "Editor" access
   - Click "Send"

6. **Get the Folder ID:**
   - Open the folder you just created
   - Look at the URL: `https://drive.google.com/drive/folders/XXXXXXXXXXXXX`
   - Copy the `XXXXXXXXXXXXX` part - this is your folder ID
   - You'll need this for the environment variable

### 2. Environment Variables

Add these to your `.env.local` file:

```env
# Resend (already configured)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Email "From" address
# Option 1: Use Resend's test domain (development only)
RESEND_FROM_EMAIL=onboarding@resend.dev
# Option 2: Use your verified domain (production)
# RESEND_FROM_EMAIL=noreply@yourdomain.com

# IMPORTANT: When using onboarding@resend.dev, emails can ONLY be sent to 
# the verified email address on your Resend account. Set this to the email
# you used to sign up for Resend:
RESEND_VERIFIED_EMAIL=focusrobin25@gmail.com

# Google Drive Service Account
GOOGLE_DRIVE_CLIENT_EMAIL=focusrobin-invoices@your-project-id.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# Google Drive Folder ID (REQUIRED!)
# Get this from the folder URL: drive.google.com/drive/folders/XXXXX
GOOGLE_DRIVE_FOLDER_ID=your-folder-id-here
```

**⚠️ CRITICAL: RESEND_VERIFIED_EMAIL is REQUIRED when using `onboarding@resend.dev`!**

When using Resend's test domain (`onboarding@resend.dev`), emails can only be sent to the email address that is verified on your Resend account. Until you set up a custom domain, all invoice emails will be sent to this verified email address instead of the customer's email.

**Important Notes:**
- `GOOGLE_DRIVE_CLIENT_EMAIL` is the `client_email` from the JSON file
- `GOOGLE_DRIVE_PRIVATE_KEY` is the `private_key` from the JSON file
- The private key must include the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines
- Replace `\n` with actual newlines or use the format shown above

### 3. Extract Credentials from JSON

From the downloaded JSON file, you need:

```json
{
  "client_email": "your-service-account@project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

Copy these values to your `.env.local` file.

## How It Works

1. **Payment Success:**
   - Stripe webhook receives `checkout.session.completed` event
   - Order status is updated to `PAID`

2. **Invoice Generation:**
   - System generates PDF invoice with order details
   - Invoice includes: customer info, items, prices, totals

3. **Email Sending:**
   - **Payment Confirmation Email** - Sent immediately
   - **Invoice Email** - Sent with PDF attachment

4. **Google Drive Upload:**
   - Invoice PDF is uploaded to "FocusRobin Invoices" folder
   - File name: `Invoice-ORD-2024-XXXX-YYYY-MM-DD.pdf`

## Testing

1. Complete a test purchase
2. Check customer email for:
   - Payment confirmation email
   - Invoice email with PDF attachment
3. Check Google Drive "FocusRobin Invoices" folder for the PDF

## Troubleshooting

### "Google Drive credentials not configured"
- Make sure `GOOGLE_DRIVE_CLIENT_EMAIL` and `GOOGLE_DRIVE_PRIVATE_KEY` are set
- Check that the private key includes the BEGIN/END markers

### "Failed to upload invoice to Google Drive"
- Verify the service account email has access to the folder
- Check that Google Drive API is enabled
- Ensure the folder exists and is shared with the service account

### "Email service not configured"
- Verify `RESEND_API_KEY` is set
- Check Resend dashboard for any errors

### Invoices not being generated
- Check server logs for errors
- Verify the webhook is receiving events
- Check that order status is being updated to `PAID`

## File Structure

- `src/lib/invoice.ts` - PDF invoice generation
- `src/lib/invoice-email.ts` - Email templates and sending
- `src/lib/google-drive.ts` - Google Drive upload functionality
- `src/app/api/webhooks/stripe/route.ts` - Webhook handler (integrated)

## Notes

- Invoices are generated asynchronously (won't block payment processing)
- If invoice generation fails, payment still succeeds
- All errors are logged for debugging
- Google Drive folder is created automatically if it doesn't exist

