# 📧 Automatic Invoice & Payment Receipt Email System

## ✨ What This Does

After a customer completes their order, they **automatically receive an email** with:
1. **📄 Payment Receipt** - Confirmation that payment was successful
2. **🧾 Invoice** - Detailed breakdown of their order

Both documents are included in a **single PDF file** attached to the email - the exact same document that you can download from the admin panel!

---

## 🎯 Features

✅ **Automatic Email Sending** - Emails are sent immediately after successful payment  
✅ **Combined Document** - One PDF with both Payment Receipt and Invoice  
✅ **Same as Admin Panel** - The exact same document you can download in admin  
✅ **Professional Design** - Beautiful HTML email with all order details  
✅ **Google Drive Backup** - All documents are also saved to your Google Drive  

---

## 🚀 Setup Instructions

### 1️⃣ Email Configuration (Resend)

You already have Resend configured for your contact form. Just add these environment variables:

```env
# Add these to your .env.local file

# Email "From" address
# Option 1: Use Resend's test domain (development/testing)
RESEND_FROM_EMAIL=onboarding@resend.dev

# Option 2: Use your custom domain (production)
# RESEND_FROM_EMAIL=noreply@focusrobin.com

# IMPORTANT: When using onboarding@resend.dev (test mode)
# Emails can ONLY be sent to your verified email address
RESEND_VERIFIED_EMAIL=your-verified-email@gmail.com
```

**⚠️ Important Notes:**

- **Test Mode (onboarding@resend.dev):**
  - You can test the system immediately
  - All emails will be sent to `RESEND_VERIFIED_EMAIL` instead of the customer
  - Perfect for testing!

- **Production Mode (Custom Domain):**
  - You need to verify your domain with Resend
  - Follow [Resend's domain setup guide](https://resend.com/docs/dashboard/domains/introduction)
  - Once verified, update `RESEND_FROM_EMAIL` to use your domain
  - Remove or comment out `RESEND_VERIFIED_EMAIL`

### 2️⃣ Google Drive Configuration (Optional but Recommended)

To automatically backup invoices to Google Drive:

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project

2. **Enable Google Drive API:**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

3. **Create a Service Account:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Give it a name (e.g., "FocusRobin Invoices")
   - Click "Create and Continue"
   - Skip role assignment
   - Click "Done"

4. **Generate Service Account Key:**
   - Click on the service account you just created
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose "JSON" format
   - Download the JSON file

5. **Create Google Drive Folder:**
   - Go to [Google Drive](https://drive.google.com/)
   - Create a folder named "FocusRobin Invoices"
   - Right-click the folder > "Share"
   - Add the service account email (from the JSON file's `client_email`)
   - Give it "Editor" access
   - Click "Send"

6. **Get Folder ID:**
   - Open the folder you just created
   - Look at the URL: `https://drive.google.com/drive/folders/XXXXXXXXXXXXX`
   - Copy the `XXXXXXXXXXXXX` part

7. **Add to Environment Variables:**

```env
# Google Drive Service Account (from the JSON file)
GOOGLE_DRIVE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# Google Drive Folder ID (from step 6)
GOOGLE_DRIVE_FOLDER_ID=your-folder-id-here
```

---

## 📋 Complete .env.local Example

```env
# ==================== Resend Email ====================
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Test Mode (for development)
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_VERIFIED_EMAIL=focusrobin25@gmail.com

# Production Mode (uncomment when ready)
# RESEND_FROM_EMAIL=noreply@focusrobin.com
# Remove or comment out RESEND_VERIFIED_EMAIL when in production

# ==================== Google Drive (Optional) ====================
GOOGLE_DRIVE_CLIENT_EMAIL=focusrobin-invoices@your-project-id.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=your-folder-id-here
```

---

## 🧪 Testing the System

### Quick Test

1. Make a test purchase on your site
2. Complete the payment with Stripe test card: `4242 4242 4242 4242`
3. Check the email (your verified email in test mode)
4. You should receive:
   - An email with the subject: "Order Confirmation & Documents - ORD-2024-XXXX"
   - A PDF attachment with both Payment Receipt and Invoice
5. Check your Google Drive folder (if configured)

### What the Email Contains

The customer receives a beautiful HTML email with:
- ✅ Payment success confirmation
- 📋 Complete order summary
- 🛍️ List of all items ordered
- 💰 Pricing breakdown (subtotal, shipping, total)
- 📦 Shipping address
- 📎 PDF attachment with Payment Receipt + Invoice

---

## 📁 Files Involved

- `src/lib/invoice-email.ts` - Email generation and sending
- `src/lib/invoice.ts` - Invoice data fetching
- `src/lib/google-drive.ts` - Google Drive upload (optional)
- `src/app/api/webhooks/stripe/route.ts` - Stripe webhook handler
- `src/app/api/admin/orders/[orderId]/invoices/route.ts` - Admin download

---

## 🔍 How It Works

```
Customer completes order
    ↓
Stripe processes payment
    ↓
Stripe webhook fires
    ↓
Order status updated to "CONFIRMED"
    ↓
System generates combined PDF (Payment Receipt + Invoice)
    ↓
PDF uploaded to Google Drive (if configured)
    ↓
Email sent to customer with PDF attachment
    ↓
✅ Done! Customer has their documents
```

---

## 🐛 Troubleshooting

### "Email service not configured"
- Check that `RESEND_API_KEY` is set in `.env.local`
- Verify the key is valid in your [Resend dashboard](https://resend.com/api-keys)

### Emails not being received
- **In test mode:** Check that `RESEND_VERIFIED_EMAIL` is set to your email
- **In production:** Verify your domain is configured correctly in Resend
- Check server logs for errors: Look for `[Invoice Email]` messages

### "Google Drive upload failed"
- Verify all Google Drive environment variables are set
- Check that the service account has access to the folder
- Make sure Google Drive API is enabled in your Google Cloud project
- This is optional - emails will still work without it

### PDF not generating
- Check server logs for `[Invoice]` messages
- Verify order has all required data (customer info, items, etc.)
- Make sure `pdf-lib` is installed: `npm install pdf-lib`

### Webhook not firing
- Verify `STRIPE_WEBHOOK_SECRET` is configured
- Check Stripe webhook logs in your [Stripe dashboard](https://dashboard.stripe.com/webhooks)
- Make sure your webhook endpoint is accessible

---

## 📝 Log Messages

Look for these in your server logs:

```
✅ Success messages:
[Invoice] Starting invoice processing for order ORD-2024-XXXX...
[Invoice] Invoice data retrieved for customer: customer@example.com
[Invoice] Combined PDF generated successfully (12345 bytes)
[Invoice Email] Combined PDF generated successfully (12345 bytes)
[Invoice Email] ✓ Order confirmation email sent successfully
[Invoice] ✓ Invoice processing completed for order ORD-2024-XXXX

❌ Error messages:
[Invoice Email] RESEND_API_KEY is not configured
[Invoice Email] Error sending order confirmation email: ...
[Invoice] ✗ Invoice processing failed: ...
```

---

## 🎉 You're All Set!

Once configured, the system runs completely automatically:
- ✅ Customer completes order → Email sent automatically
- ✅ Same document as admin panel → Consistent experience
- ✅ Backed up to Google Drive → Never lose an invoice
- ✅ Professional appearance → Great customer experience

**No manual intervention needed - it just works!**

---

## 📞 Need Help?

Check the logs first - they provide detailed information about what's happening. Look for messages starting with:
- `[Invoice]` - Invoice processing
- `[Invoice Email]` - Email sending
- `[Stripe Webhook]` - Stripe webhook events

If you're still having issues, check:
1. Environment variables are correctly set
2. Resend API key is valid
3. Stripe webhook is receiving events
4. Server has internet connectivity
