# 🚀 How to Make Facebook Login Live/Production Mode

Currently, your Facebook login only works with test accounts because the Facebook app is in **Development Mode**. Here's how to switch it to **Live Mode** so all users can log in.

---

## 📋 Step-by-Step Guide

### Step 1: Go to Facebook Developer Console

1. Go to https://developers.facebook.com/apps
2. Log in with your Facebook account
3. Select your app (App ID: `1183026500118174`)

### Step 2: Switch App Mode to Live

1. In your app dashboard, look for the **App Mode** toggle at the top
2. You'll see it's currently set to **"Development"** mode
3. Click the toggle to switch to **"Live"** mode
4. Facebook will show a warning - click **"Switch Mode"** to confirm

**⚠️ Important:** Before switching to Live mode, ensure you've completed all the steps below.

---

### Step 3: Configure Valid OAuth Redirect URIs

1. In your app dashboard, go to **Settings** → **Basic**
2. Scroll down to **"Valid OAuth Redirect URIs"**
3. Add your production callback URL:
   ```
   https://focusrobin.lt/api/auth/callback/facebook
   ```
4. Click **"Save Changes"**

**Note:** Make sure this URL matches exactly what's in your NextAuth configuration.

---

### Step 4: Configure App Domains

1. Still in **Settings** → **Basic**
2. Find **"App Domains"**
3. Add your domain:
   ```
   focusrobin.lt
   ```
4. Click **"Save Changes"**

---

### Step 5: Configure Website Platform

1. In your app dashboard, go to **Settings** → **Basic**
2. Find **"Website"** section
3. Add your site URL:
   ```
   https://focusrobin.lt
   ```
4. Click **"Save Changes"**

---

### Step 6: Review Required Permissions

Your app currently requests these permissions:
- `email` - User's email address
- `public_profile` - Basic profile information

**For Live Mode:**
- `email` and `public_profile` are **standard permissions** and don't require app review
- These permissions are automatically approved for live apps

**If you need additional permissions later** (like `user_birthday`, `user_location`), you'll need to submit your app for review.

---

### Step 7: Submit App for Review (If Required)

**You may need to submit for review if:**
- Facebook flags your app for review
- You want to request additional permissions beyond `email` and `public_profile`
- Your app is in a restricted category

**To submit for review:**
1. Go to **App Review** → **Permissions and Features**
2. Click **"Request"** next to any permissions you need
3. Fill out the review form:
   - **How do you use this permission?** - "We use email to create user accounts and send order confirmations"
   - **Instructions for reviewers** - "Login with Facebook button on https://focusrobin.lt/login"
   - **Screenshot** - Upload a screenshot of your login page
4. Submit for review (usually takes 1-7 days)

---

### Step 8: Verify Environment Variables

Make sure your `.env` file on the VPS has the correct Facebook credentials:

```env
# Facebook OAuth (Production)
AUTH_FACEBOOK_ID=1183026500118174
AUTH_FACEBOOK_SECRET=df2379ba4f5c67f6d2646fbd8f751f41

# OR use these (both work)
FACEBOOK_CLIENT_ID=1183026500118174
FACEBOOK_CLIENT_SECRET=df2379ba4f5c67f6d2646fbd8f751f41
```

**Note:** The App ID and Secret are the same for both Development and Live modes. You don't need to change them.

---

### Step 9: Test the Live Login

After switching to Live mode:

1. **Wait 5-10 minutes** for Facebook to propagate the changes
2. Go to https://focusrobin.lt/login
3. Click "Sign in with Facebook"
4. Try logging in with a **real Facebook account** (not a test account)
5. It should work! ✅

---

## 🔍 Troubleshooting

### Issue: "App Not Setup: This app is still in development mode"

**Solution:**
- Make sure you've switched the app to **Live Mode** in Step 2
- Wait 5-10 minutes for changes to propagate
- Clear your browser cache and cookies
- Try logging in again

### Issue: "Invalid OAuth Redirect URI"

**Solution:**
- Verify the redirect URI in Facebook app settings matches exactly:
  ```
  https://focusrobin.lt/api/auth/callback/facebook
  ```
- Make sure there are no trailing slashes or typos
- Check that your domain is added to "App Domains"

### Issue: "App Review Required"

**Solution:**
- For `email` and `public_profile`, this shouldn't happen
- If it does, submit your app for review (Step 7)
- Make sure your app's privacy policy and terms of service are linked in app settings

### Issue: "Configuration Error" in NextAuth

**Solution:**
- Verify your environment variables are set correctly on the VPS
- Check that `AUTH_FACEBOOK_ID` and `AUTH_FACEBOOK_SECRET` are in your `.env` file
- Restart your Docker container after updating environment variables:
  ```bash
  docker compose restart app
  ```

---

## ✅ Checklist Before Going Live

- [ ] App is switched to **Live Mode** in Facebook Developer Console
- [ ] Valid OAuth Redirect URI is set: `https://focusrobin.lt/api/auth/callback/facebook`
- [ ] App Domain is set: `focusrobin.lt`
- [ ] Website URL is set: `https://focusrobin.lt`
- [ ] Environment variables are set on VPS (`.env` file)
- [ ] Docker container has been restarted after env changes
- [ ] Tested login with a real Facebook account (not test account)

---

## 📝 Quick Reference

**Facebook App Dashboard:** https://developers.facebook.com/apps/1183026500118174

**Current App ID:** `1183026500118174`

**Callback URL:** `https://focusrobin.lt/api/auth/callback/facebook`

**Environment Variables Needed:**
```env
AUTH_FACEBOOK_ID=1183026500118174
AUTH_FACEBOOK_SECRET=df2379ba4f5c67f6d2646fbd8f751f41
```

---

## 🎯 After Going Live

Once your app is in Live mode:
- ✅ All Facebook users can log in (not just test accounts)
- ✅ No app review needed for `email` and `public_profile` permissions
- ✅ Your app will work for all users worldwide

**Note:** If you need to test with specific accounts while in Live mode, you can add them as "Test Users" in **Roles** → **Test Users** in the Facebook Developer Console.


