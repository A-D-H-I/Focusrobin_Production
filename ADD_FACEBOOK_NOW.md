# ⚡ Add Facebook Login in 3 Minutes

## Current Status

Your login page will show:
- ✅ **"Continue with Google"** - Working now!
- ⚠️ **Message about Facebook** - Not configured yet

---

## Quick Fix (3 Steps)

### Step 1: Add Temporary Credentials to `.env.local`

Add these lines to your `.env.local` file:

```env
# Facebook OAuth (add these)
AUTH_FACEBOOK_ID=your-app-id-here
AUTH_FACEBOOK_SECRET=your-app-secret-here
```

### Step 2: Restart Your Server

```bash
# Stop server: Ctrl+C
# Then restart:
npm run dev
```

### Step 3: Check the Login Page

Visit: `http://localhost:9002/login`

You should now see **BOTH** buttons:
- ✅ Continue with Google
- ✅ Continue with Facebook

---

## To Make Facebook Actually Work

You need to get real credentials from Facebook:

### Quick Steps:

1. **Go to:** [https://developers.facebook.com/](https://developers.facebook.com/)

2. **Create App:**
   - Click "Create App"
   - Choose "Consumer"
   - Name it "FocusRobin"

3. **Add Facebook Login:**
   - Click "Set Up" on Facebook Login
   - Choose "Web"

4. **Get Credentials:**
   - Go to Settings > Basic
   - Copy **App ID**
   - Copy **App Secret** (click Show)

5. **Add Redirect URI:**
   - Go to Facebook Login > Settings
   - Add: `http://localhost:9002/api/auth/callback/facebook`
   - Add: `https://your-ngrok-url/api/auth/callback/facebook`
   - Click Save

6. **Update `.env.local`:**
   ```env
   AUTH_FACEBOOK_ID=paste-your-real-app-id
   AUTH_FACEBOOK_SECRET=paste-your-real-app-secret
   ```

7. **Restart server and test!**

---

## Test Credentials (For Display Only)

⚠️ **These won't work for actual login, but will make the button appear:**

```env
AUTH_FACEBOOK_ID=123456789012345
AUTH_FACEBOOK_SECRET=abcdef1234567890abcdef1234567890
```

**To actually log in with Facebook, you MUST use real credentials from Facebook Developers.**

---

## Why Isn't Facebook Showing?

The system automatically hides login providers that aren't configured. This is a **security feature** to prevent errors.

**What you'll see:**
- **Without credentials:** Only Google button + warning message
- **With credentials:** Both Google AND Facebook buttons

---

## Full Documentation

For complete Facebook setup, see: **`FACEBOOK_LOGIN_SETUP.md`**

---

**Need it working NOW?**

1. Add any values to `AUTH_FACEBOOK_ID` and `AUTH_FACEBOOK_SECRET` in `.env.local`
2. Restart server
3. Facebook button will appear (won't work until you add real credentials)

**To actually use Facebook login:**
- Follow the steps above to get real credentials from Facebook Developers
- Takes about 5-10 minutes total







