# 🔐 Facebook Login Setup Guide

## ✨ What's Been Implemented

Your site now has a **professional login page** with:
- ✅ **Google Sign-In** (already configured)
- ✅ **Facebook Sign-In** (needs configuration)
- ✅ Beautiful, modern UI
- ✅ Error handling
- ✅ Secure OAuth 2.0 authentication
- ✅ Mobile responsive

---

## 🚀 Quick Start

### Access Your New Login Page

Visit: **`http://localhost:9002/login`** or **`https://your-ngrok-url/login`**

---

## 📋 Facebook OAuth Setup (Step-by-Step)

### Step 1: Create a Facebook App

1. **Go to Facebook Developers:**
   - Visit [https://developers.facebook.com/](https://developers.facebook.com/)
   - Sign in with your Facebook account

2. **Create a New App:**
   - Click **"Create App"**
   - Select **"Consumer"** (for logging in users)
   - Click **"Next"**

3. **Fill in App Details:**
   - **App Name:** FocusRobin (or your preferred name)
   - **App Contact Email:** your-email@example.com
   - Click **"Create App"**

### Step 2: Add Facebook Login Product

1. **In your app dashboard:**
   - Find **"Facebook Login"** in the products list
   - Click **"Set Up"**
   - Choose **"Web"**

2. **Set Site URL:**
   - Enter your site URL (for development, use your ngrok URL)
   - Example: `https://your-ngrok-url.ngrok.io`
   - Click **"Save"**
   - Click **"Continue"**

### Step 3: Configure OAuth Settings

1. **Go to Settings > Basic:**
   - Note your **App ID** (you'll need this)
   - Note your **App Secret** (click "Show" to reveal it)

2. **Add App Domains:**
   - Scroll down to **"App Domains"**
   - Add your domain(s):
     - Development: `your-ngrok-url.ngrok.io`
     - Production: `focusrobin.com`
   - Click **"Save Changes"**

3. **Go to Facebook Login > Settings:**
   - Find **"Valid OAuth Redirect URIs"**
   - Add these URLs:
     ```
     http://localhost:9002/api/auth/callback/facebook
     https://your-ngrok-url.ngrok.io/api/auth/callback/facebook
     ```
   - Replace `your-ngrok-url` with your actual ngrok domain
   - Click **"Save Changes"**

### Step 4: Switch App to Live Mode

1. **In the top navigation:**
   - Toggle the switch from **"In Development"** to **"Live"**
   - You may need to:
     - Add a Privacy Policy URL
     - Add a Terms of Service URL
     - Complete Business Verification (for production)

2. **For Development/Testing:**
   - You can keep it in **"Development"** mode
   - Add test users in **Roles > Test Users**
   - Or add your own Facebook account in **Roles > Administrators**

### Step 5: Get Your Credentials

From **Settings > Basic**, copy:
- **App ID** (this is your Client ID)
- **App Secret** (this is your Client Secret)

---

## 🔧 Environment Configuration

Add these to your `.env.local` file:

```env
# ==================== FACEBOOK OAUTH ====================
# Get these from Facebook Developers Console
# https://developers.facebook.com/apps/

# Facebook App ID (Client ID)
AUTH_FACEBOOK_ID=your-facebook-app-id-here

# Facebook App Secret (Client Secret)
AUTH_FACEBOOK_SECRET=your-facebook-app-secret-here

# Alternative names (for compatibility)
FACEBOOK_CLIENT_ID=your-facebook-app-id-here
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret-here

# ==================== GOOGLE OAUTH (EXISTING) ====================
# Your existing Google credentials
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# ==================== AUTH SECRET ====================
# Your existing auth secret
AUTH_SECRET=your-auth-secret-here
```

---

## 📝 Complete .env.local Example

```env
# NextAuth Secret
AUTH_SECRET=your-random-secret-key-here
NEXTAUTH_SECRET=your-random-secret-key-here

# Google OAuth
AUTH_GOOGLE_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-your-google-secret
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-secret

# Facebook OAuth
AUTH_FACEBOOK_ID=1234567890123456
AUTH_FACEBOOK_SECRET=abcdef1234567890abcdef1234567890
FACEBOOK_CLIENT_ID=1234567890123456
FACEBOOK_CLIENT_SECRET=abcdef1234567890abcdef1234567890

# Database
DATABASE_URL=your-database-url

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-public-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_VERIFIED_EMAIL=your-email@gmail.com
```

---

## ✅ Testing

### 1. Restart Your Dev Server

```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. Test the Login Flow

1. **Go to the login page:**
   ```
   http://localhost:9002/login
   ```
   Or:
   ```
   https://your-ngrok-url.ngrok.io/login
   ```

2. **Click "Continue with Facebook"**
   - You should be redirected to Facebook
   - Facebook will ask for permission
   - After approval, you'll be redirected back to your site
   - You should be logged in!

3. **Test "Continue with Google"**
   - Should work as before
   - Make sure both providers work

### 3. Check for Errors

If something goes wrong:
- Check browser console for errors
- Check terminal logs for NextAuth errors
- Verify environment variables are set
- Make sure redirect URIs match exactly

---

## 🎨 Login Page Features

Your new login page includes:

### ✨ Design Features
- ✅ Beautiful gradient background
- ✅ Modern card layout with blur effect
- ✅ Responsive design (mobile-friendly)
- ✅ Smooth animations and transitions
- ✅ Brand colors (teal theme)
- ✅ Loading states for both buttons
- ✅ Professional look and feel

### 🔒 Security Features
- ✅ OAuth 2.0 secure authentication
- ✅ Error handling and user feedback
- ✅ No passwords stored
- ✅ Account linking prevention
- ✅ HTTPS required for production

### 🎯 User Experience
- ✅ Clear call-to-actions
- ✅ Loading indicators
- ✅ Error messages
- ✅ "Back to home" link
- ✅ Privacy policy links
- ✅ Callback URL preservation (returns to previous page)

---

## 🔍 Troubleshooting

### "Facebook login button doesn't do anything"
**Solution:** Make sure you added Facebook credentials to `.env.local` and restarted your server.

### "Redirect URI Mismatch" error
**Solution:** 
- Check Facebook Login > Settings > Valid OAuth Redirect URIs
- Make sure the URL exactly matches:
  ```
  https://your-actual-ngrok-domain.ngrok.io/api/auth/callback/facebook
  ```
- Note: The URL is case-sensitive

### "App Not Set Up" error
**Solution:**
- Make sure you completed the Facebook Login setup
- Check that your app is in the correct mode (Development or Live)
- Add yourself as a test user if app is in Development mode

### Facebook button shows but login fails
**Check:**
1. ✅ `AUTH_FACEBOOK_ID` is set correctly
2. ✅ `AUTH_FACEBOOK_SECRET` is set correctly
3. ✅ Both are from the same Facebook app
4. ✅ App is not restricted to certain users
5. ✅ Redirect URI is configured correctly

### "This email is already associated with another account"
**Solution:** This is expected! It means:
- You already signed up with Google using that email
- You need to sign in with Google, not Facebook
- Or vice versa

---

## 🌐 Production Setup

Before going live:

### 1. Update Facebook App Settings

1. **App Mode:**
   - Switch app to **"Live"** mode
   - Complete Business Verification if required

2. **Production URLs:**
   - Add your production domain to **App Domains**
   - Add production redirect URI:
     ```
     https://focusrobin.com/api/auth/callback/facebook
     ```

3. **Required Pages:**
   - Add Privacy Policy URL
   - Add Terms of Service URL
   - Add User Data Deletion URL (if required)

### 2. Update Environment Variables

```env
# Production .env
AUTH_FACEBOOK_ID=your-production-app-id
AUTH_FACEBOOK_SECRET=your-production-app-secret
```

### 3. Test in Production

- Make a test account
- Try logging in with Facebook
- Verify user data is saved correctly
- Check that welcome bonus is applied

---

## 📊 What Data Facebook Provides

When users sign in with Facebook, you receive:
- ✅ **Name** - User's full name
- ✅ **Email** - User's email address
- ✅ **Profile Picture** - User's Facebook profile photo
- ✅ **User ID** - Unique Facebook ID

**Note:** You only get basic profile information. No access to:
- ❌ Friends list
- ❌ Posts or activity
- ❌ Private messages
- ❌ Any other personal data

---

## 🎉 You're All Set!

Your login system now supports:
- ✅ Google Sign-In
- ✅ Facebook Sign-In
- ✅ Beautiful UI
- ✅ Secure authentication
- ✅ Welcome bonus on signup
- ✅ Session management

---

## 📁 Files Modified

1. **`src/auth.ts`** - Added Facebook provider
2. **`src/app/login/page.tsx`** - New login page (created)
3. **`src/components/auth/UserMenu.tsx`** - Updated to use login page
4. **`FACEBOOK_LOGIN_SETUP.md`** - This documentation

---

## 🔗 Useful Links

- [Facebook Developers](https://developers.facebook.com/)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/web)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [NextAuth Facebook Provider](https://next-auth.js.org/providers/facebook)

---

## 💡 Tips

1. **During Development:**
   - Use ngrok for testing Facebook login
   - Add yourself as app administrator
   - Keep app in Development mode

2. **For Production:**
   - Switch app to Live mode
   - Add proper privacy policy
   - Complete business verification
   - Use production domain

3. **Best Practices:**
   - Always use HTTPS (required by Facebook)
   - Keep your App Secret secure
   - Never commit credentials to Git
   - Test both sign-in methods regularly

---

**Need help?** Check the troubleshooting section above or review your Facebook app settings!






