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

5. **Add to Google OAuth Redirect URIs:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services** → **Credentials**
   - Click your OAuth 2.0 Client ID
   - Add: `https://abc123.ngrok.io/api/auth/callback/google`
   - Also keep: `http://localhost:9002/api/auth/callback/google`

6. **Access from iPad:**
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

# Copy the https URL from ngrok
# Add it to Google OAuth redirect URIs
# Access from iPad using the ngrok URL
```

