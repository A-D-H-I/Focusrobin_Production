# Network Login Setup Guide

Google OAuth doesn't accept IP addresses in redirect URIs. Here are solutions for accessing your app from iPad/network devices:

## Option 1: Use ngrok (Recommended)

### Setup Steps:

1. **Install ngrok:**
   ```bash
   # Download from https://ngrok.com/download
   # Or use npm:
   npm install -g ngrok
   ```

2. **Start your dev server:**
   ```bash
   npm run dev
   ```

3. **In another terminal, start ngrok:**
   ```bash
   ngrok http 9002
   ```

4. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)

5. **Set AUTH_URL environment variable (Optional):**
   - **Note:** With `trustHost: true` in the auth config, login/logout should work automatically for both localhost and ngrok!
   - If you experience issues, you can optionally add to your `.env.local` file:
     ```
     AUTH_URL=https://abc123.ngrok.io
     ```
   - **Important:** If you set AUTH_URL, you must restart your dev server after setting this!
   - **Note:** If using AUTH_URL, you'll need to update it each time you restart ngrok (free plan)
   - **Recommended:** Leave AUTH_URL unset - the app will automatically detect the correct domain

6. **Add to Google OAuth Redirect URIs:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services** → **Credentials**
   - Click your OAuth 2.0 Client ID
   - **Authorized JavaScript origins:** Add `https://abc123.ngrok.io`
   - **Authorized redirect URIs:** Add `https://abc123.ngrok.io/api/auth/callback/google`
   - Also keep: `http://localhost:9002/api/auth/callback/google` for local testing

7. **Access from iPad:**
   - Use the ngrok URL: `https://abc123.ngrok.io`
   - Login will work!

### Note:
- Free ngrok URLs change each time you restart
- For a fixed URL, upgrade to ngrok paid plan
- Or use ngrok config file for custom domain

---

## Option 2: Use Computer Hostname

If your computer hostname resolves on your network:

1. **Find your hostname:**
   ```bash
   hostname
   # Output: DESKTOP-9RT5CTT
   ```

2. **Try accessing from iPad:**
   ```
   http://DESKTOP-9RT5CTT:9002
   ```

3. **Add to Google OAuth (if it works):**
   - `http://DESKTOP-9RT5CTT:9002/api/auth/callback/google`
   - Note: Google may still reject this if it's not a proper domain

---

## Option 3: Use localhost with Proxy

If you have a router that supports port forwarding or a proxy:

1. Set up a reverse proxy pointing to `localhost:9002`
2. Use a domain name (even a free one like `yourname.ddns.net`)
3. Add that domain to Google OAuth redirect URIs

---

## Option 4: Development Mode - Disable OAuth Check (Not Recommended)

For testing only, you could temporarily use a mock auth, but this is not recommended for production.

---

## Recommended Solution

**Use ngrok** - it's the easiest and most reliable way to test OAuth on network devices during development.

### Quick Start with ngrok:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Start ngrok
ngrok http 9002

# Copy the https URL from ngrok (e.g., https://abc123.ngrok.io)
# Add AUTH_URL=https://abc123.ngrok.io to .env.local
# Restart dev server
# Add it to Google OAuth redirect URIs
# Access from iPad using the ngrok URL
```

### ✅ Login & Logout Work Automatically!

**Good news!** The app has been configured to work with **both localhost and ngrok automatically**:

- ✅ **Login works** on both `http://localhost:9002` and your ngrok URL
- ✅ **Logout works** on both `http://localhost:9002` and your ngrok URL
- ✅ **No AUTH_URL needed** - the app automatically detects the current domain
- ✅ **Works seamlessly** - switch between localhost and ngrok without any changes

The app uses `trustHost: true` in NextAuth configuration, which allows it to automatically detect whether you're accessing via localhost or ngrok and handle redirects correctly.

### ⚠️ Troubleshooting: If Redirects Still Go to localhost

If you still experience issues with redirects going to localhost instead of ngrok:

1. **Make sure you're accessing via the ngrok URL** on your mobile device (not localhost)
2. **Clear your browser cache** on the mobile device
3. **Check Google OAuth settings** - make sure both URLs are added:
   - `http://localhost:9002/api/auth/callback/google`
   - `https://your-ngrok-url.ngrok-free.dev/api/auth/callback/google`
4. **Optional:** If issues persist, you can set `AUTH_URL` in `.env.local`:
   ```env
   AUTH_URL=https://your-ngrok-url.ngrok-free.dev
   ```
   Then restart your dev server. **Note:** This will make it only work with ngrok, not localhost.

