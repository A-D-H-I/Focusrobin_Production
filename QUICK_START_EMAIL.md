# ⚡ Quick Start: Email Invoice System

## 🎯 What You Get

After every order, customers automatically receive **ONE email** with:
- ✅ Beautiful HTML email with order details
- ✅ PDF attachment with **Payment Receipt + Invoice**
- ✅ Same document as in your admin panel

---

## 🚀 5-Minute Setup

### Step 1: Add to `.env.local`

```env
# Required for email
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_VERIFIED_EMAIL=your-email@gmail.com
```

### Step 2: Test It

```bash
npm run dev

# In another terminal, run the test script:
npx tsx scripts/test-email-system.ts
```

### Step 3: Make a Test Purchase

1. Go to your site
2. Add item to cart
3. Checkout with test card: `4242 4242 4242 4242`
4. Check your email inbox!

---

## 📧 Email Preview

**Subject:** Order Confirmation & Documents - ORD-2024-XXXX

**Contains:**
- Payment success badge
- Complete order summary
- List of items ordered
- Shipping address
- PDF attachment (Payment Receipt + Invoice)

---

## 🔧 Production Setup

When ready to go live:

1. Verify your domain in [Resend](https://resend.com/domains)
2. Update `.env.local`:
   ```env
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   # Remove RESEND_VERIFIED_EMAIL
   ```
3. Done!

---

## 📁 Optional: Google Drive Backup

To automatically save invoices to Google Drive, see full instructions in `EMAIL_INVOICES_SETUP.md`

---

## ✅ Checklist

- [ ] Added `RESEND_API_KEY` to `.env.local`
- [ ] Added `RESEND_FROM_EMAIL` to `.env.local`
- [ ] Added `RESEND_VERIFIED_EMAIL` to `.env.local` (for testing)
- [ ] Tested with `npx tsx scripts/test-email-system.ts`
- [ ] Made a test purchase
- [ ] Received email with PDF attachment

---

## 🆘 Troubleshooting

**No email received?**
- Check spam folder
- Verify `RESEND_VERIFIED_EMAIL` is your email
- Check server logs for `[Invoice Email]` messages

**Error: "Email service not configured"**
- Make sure `RESEND_API_KEY` is set in `.env.local`
- Restart your dev server after adding env variables

**PDF not attached?**
- Check server logs for errors
- Make sure `pdf-lib` is installed: `npm install pdf-lib`

---

## 📖 Full Documentation

See `EMAIL_INVOICES_SETUP.md` for complete setup instructions and advanced configuration.

---

**🎉 That's it! The system runs automatically - no manual work needed!**
