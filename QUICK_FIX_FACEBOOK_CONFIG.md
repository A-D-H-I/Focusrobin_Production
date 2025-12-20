# Quick Fix: Facebook Configuration Error

## You're Seeing This Error:
```
Server error
There is a problem with the server configuration.
```

URL: `https://jacketless-unsagaciously-denice.ngrok-free.dev/api/auth/error?error=Configuration`

## Immediate Steps to Fix:

### Step 1: Check Your Server Logs

When you start your dev server, look for these messages:

**✅ If you see this:**
```
✅ Facebook OAuth credentials found. Facebook login is enabled.
✅ Facebook OAuth provider configured
```
→ Facebook is configured correctly. The issue is likely the redirect URI.

**❌ If you see this:**
```
⚠️ Facebook OAuth credentials not found. Sign in with Facebook will not work.
```
→ You need to add Facebook credentials to `.env.local`

**❌ If you see this:**
```
❌ Error configuring Facebook provider: ...
```
→ Your Facebook credentials are invalid. Check the values in `.env.local`

### Step 2: Verify Facebook Credentials in `.env.local`

Open your `.env.local` file and check:

```env
AUTH_FACEBOOK_ID=your-app-id-here
AUTH_FACEBOOK_SECRET=your-app-secret-here
```

**Important:**
- No quotes around the values
- No spaces before/after the `=`
- Values should be long (App ID ~15-17 digits, Secret ~32+ characters)

### Step 3: Configure Facebook Redirect URI (CRITICAL)

This is the **most common cause** of the Configuration error.

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Go to **Facebook Login > Settings**
4. Under **Valid OAuth Redirect URIs**, add:

```
https://jacketless-unsagaciously-denice.ngrok-free.dev/api/auth/callback/facebook
```

**Also add localhost for local testing:**
```
http://localhost:9002/api/auth/callback/facebook
```

5. Click **Save Changes**

### Step 4: Check Facebook App Settings

1. **App Domains** (Settings > Basic):
   - Add: `jacketless-unsagaciously-denice.ngrok-free.dev`
   - Add: `localhost` (for local testing)

2. **Site URL** (Settings > Basic):
   - Set to: `https://jacketless-unsagaciously-denice.ngrok-free.dev`

3. **App Mode**:
   - If in Development mode, add yourself as a test user or administrator
   - Go to **Roles > Test Users** or **Roles > Administrators**

### Step 5: Restart Your Server

After making any changes:

```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 6: Test Again

1. Visit: `https://jacketless-unsagaciously-denice.ngrok-free.dev/login`
2. Click "Continue with Facebook"
3. Check server logs for any error messages

## Common Issues:

### Issue: "Redirect URI mismatch"
**Solution:** The redirect URI in Facebook must match **exactly**:
- Protocol: `https://` (not `http://`)
- Domain: `jacketless-unsagaciously-denice.ngrok-free.dev`
- Path: `/api/auth/callback/facebook`
- No trailing slash

### Issue: "App not in correct mode"
**Solution:** 
- If app is in Development mode, you must be a test user or administrator
- Add yourself in **Roles > Administrators** in Facebook app settings

### Issue: "Invalid credentials"
**Solution:**
- Double-check App ID and App Secret in `.env.local`
- Make sure you copied the full values (no truncation)
- Restart server after updating `.env.local`

## Still Not Working?

1. **Check browser console** for JavaScript errors
2. **Check server terminal** for detailed error messages
3. **Try with localhost** first: `http://localhost:9002/login`
4. **Clear browser cache** and cookies
5. **Test in incognito mode**

## Need the Full Setup Guide?

See: `FACEBOOK_LOGIN_SETUP.md` for complete step-by-step instructions.
