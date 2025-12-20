# Fix: Facebook Login Server Configuration Error

## Problem

You're seeing this error when trying to log in with Facebook:
```
Server error
There is a problem with the server configuration.
Check the server logs for more information.
```

## Quick Fix Checklist

### 1. Check Facebook Credentials in `.env.local`

Make sure you have these variables set in your `.env.local` file:

```env
AUTH_FACEBOOK_ID=your-facebook-app-id
AUTH_FACEBOOK_SECRET=your-facebook-app-secret
```

**To get these credentials:**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app (or create a new one)
3. Go to **Settings > Basic**
4. Copy the **App ID** → This is your `AUTH_FACEBOOK_ID`
5. Copy the **App Secret** (click "Show") → This is your `AUTH_FACEBOOK_SECRET`

### 2. Configure Facebook Redirect URIs

**Critical:** Facebook requires the exact redirect URI to be registered in your app settings.

1. Go to your Facebook app in [Facebook Developers](https://developers.facebook.com/)
2. Navigate to **Facebook Login > Settings**
3. Under **Valid OAuth Redirect URIs**, add these URIs:

```
http://localhost:9002/api/auth/callback/facebook
https://your-ngrok-url.ngrok-free.dev/api/auth/callback/facebook
```

**Important:** 
- Replace `your-ngrok-url` with your actual ngrok domain if you're using ngrok
- Both localhost and ngrok URLs must be added if you use both
- The URLs must match **exactly** (including `http://` vs `https://`)

### 3. Check AUTH_URL (if set)

If you have `AUTH_URL` set in your `.env.local`, it might be causing issues:

**Option A: Remove AUTH_URL (Recommended)**
```env
# Comment out or remove this line:
# AUTH_URL=https://your-ngrok-url.ngrok-free.dev
```

With `trustHost: true` in the auth config, the app automatically detects the correct domain.

**Option B: Keep AUTH_URL (if needed)**
If you must keep it, make sure it matches your current domain:
```env
AUTH_URL=https://your-current-domain.com
```

**Then restart your dev server** after making changes.

### 4. Verify Facebook App Settings

In your Facebook app settings:

1. **App Domains:** Add your domains:
   - `localhost` (for development)
   - `your-ngrok-url.ngrok-free.dev` (if using ngrok)

2. **Site URL:** Set to your main domain:
   - Development: `http://localhost:9002`
   - Production: `https://your-domain.com`

3. **App Mode:** 
   - For testing: Keep in "Development" mode
   - Add yourself as a test user in **Roles > Test Users**
   - Or add yourself in **Roles > Administrators**

### 5. Restart Your Dev Server

After making any changes to `.env.local`:

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### 6. Check Server Logs

When you start the server, you should see:

**If Facebook is configured correctly:**
```
✅ Facebook OAuth credentials found. Facebook login is enabled.
```

**If Facebook is NOT configured:**
```
⚠️ Facebook OAuth credentials not found. Sign in with Facebook will not work.
   Add AUTH_FACEBOOK_ID and AUTH_FACEBOOK_SECRET to your .env.local file.
```

## Common Issues

### Issue 1: "Configuration" Error
**Cause:** Facebook credentials are missing or invalid.

**Fix:** 
- Check that `AUTH_FACEBOOK_ID` and `AUTH_FACEBOOK_SECRET` are set correctly
- Make sure there are no extra spaces or quotes in the values
- Restart the server after adding credentials

### Issue 2: Redirect URI Mismatch
**Cause:** The redirect URI in Facebook app settings doesn't match what NextAuth is using.

**Fix:**
- Check the exact URL you're accessing (localhost vs ngrok)
- Make sure both redirect URIs are added in Facebook app settings
- The URI must be: `{your-domain}/api/auth/callback/facebook`

### Issue 3: Facebook App Not Approved
**Cause:** Your Facebook app is in development mode and you're not a test user.

**Fix:**
- Add yourself as a test user in **Roles > Test Users**
- Or add yourself in **Roles > Administrators**
- Or switch app to "Live" mode (requires app review for production)

### Issue 4: AUTH_URL Conflicts
**Cause:** `AUTH_URL` is set but doesn't match your current domain.

**Fix:**
- Remove `AUTH_URL` from `.env.local` (recommended)
- Or update `AUTH_URL` to match your current domain
- Restart the server

## Testing

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Check the console** for Facebook configuration messages

3. **Visit the login page:**
   - `http://localhost:9002/login`
   - Or `https://your-ngrok-url/login`

4. **Click "Continue with Facebook"**

5. **If it works:** You'll be redirected to Facebook for authentication

6. **If it fails:** Check the error message on the login page and refer to the troubleshooting steps above

## Still Having Issues?

1. **Check browser console** for any JavaScript errors
2. **Check server logs** for detailed error messages
3. **Verify Facebook app is active** in Facebook Developers console
4. **Test with a different browser** or incognito mode
5. **Clear browser cache** and cookies

## Need More Help?

See the detailed setup guide: `FACEBOOK_LOGIN_SETUP.md`
