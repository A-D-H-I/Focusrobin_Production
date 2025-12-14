# How to Change ngrok Account & Enable Google Login from Other Devices

## Step 1: Change Your ngrok Account

### Option A: Logout and Login with New Account

1. **Logout from current ngrok account:**
   ```bash
   ngrok config add-authtoken --logout
   ```
   Or simply:
   ```bash
   ngrok logout
   ```

2. **Login with your new ngrok account:**
   ```bash
   ngrok config add-authtoken YOUR_NEW_AUTH_TOKEN
   ```
   
   To get your new auth token:
   - Go to https://dashboard.ngrok.com/get-started/your-authtoken
   - Sign in with your new ngrok account
   - Copy the authtoken
   - Run the command above with your new token

### Option B: Directly Add New Auth Token

If you want to switch accounts without logging out first:

```bash
ngrok config add-authtoken YOUR_NEW_AUTH_TOKEN
```

This will automatically replace the old token with the new one.

---

## Step 2: Start ngrok with Your New Account

1. **Make sure your dev server is running:**
   ```bash
   npm run dev
   ```

2. **Start ngrok in a new terminal:**
   ```bash
   ngrok http 9002
   ```

3. **Copy your new ngrok URL:**
   - You'll see something like: `https://abc123.ngrok.io` (or `https://xyz456.ngrok.io`)
   - **Copy this URL** - you'll need it for Google OAuth setup

---

## Step 3: Update Google OAuth Redirect URIs

**Yes, changing your ngrok account WILL allow Google login to work from other devices**, but you MUST update the redirect URIs in Google Cloud Console.

### Steps:

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Make sure you're in the correct project

2. **Navigate to OAuth Credentials:**
   - Go to **APIs & Services** → **Credentials**
   - Find your **OAuth 2.0 Client ID** (the one you're using for this app)
   - Click on it to edit

3. **Update Authorized JavaScript origins:**
   - In the **Authorized JavaScript origins** section, add:
     ```
     https://YOUR_NEW_NGROK_URL.ngrok.io
     ```
   - Example: `https://abc123.ngrok.io`
   - **Keep** `http://localhost:9002` if you want local testing

4. **Update Authorized redirect URIs:**
   - In the **Authorized redirect URIs** section, add:
     ```
     https://YOUR_NEW_NGROK_URL.ngrok.io/api/auth/callback/google
     ```
   - Example: `https://abc123.ngrok.io/api/auth/callback/google`
   - **Keep** `http://localhost:9002/api/auth/callback/google` if you want local testing

5. **Save the changes:**
   - Click **Save** at the bottom
   - Changes may take a few minutes to propagate

---

## Step 4: Test Google Login from Other Devices

1. **Access your app from another device:**
   - Use the ngrok URL: `https://YOUR_NEW_NGROK_URL.ngrok.io`
   - Open it on your phone, tablet, or another computer

2. **Test Google login:**
   - Click "Sign in with Google"
   - You should be redirected to Google's login page
   - After logging in, you should be redirected back to your app

---

## Important Notes

### Free ngrok Account:
- **URLs change every time you restart ngrok**
- You'll need to update Google OAuth redirect URIs each time you get a new URL
- This can be tedious for frequent testing

### Paid ngrok Account (Recommended):
- You can get a **fixed domain** (e.g., `https://focusrobin.ngrok.io`)
- Set it up once in Google OAuth, and it will work permanently
- No need to update redirect URIs every time

### To Get a Fixed Domain with Paid ngrok:

1. **Upgrade to ngrok paid plan** (starts at $8/month)
2. **Reserve a domain:**
   ```bash
   ngrok config edit
   ```
   Add:
   ```yaml
   tunnels:
     focusrobin:
       proto: http
       addr: 9002
       domain: focusrobin.ngrok.io
   ```
3. **Start with your domain:**
   ```bash
   ngrok start focusrobin
   ```
4. **Add to Google OAuth once:**
   - `https://focusrobin.ngrok.io`
   - `https://focusrobin.ngrok.io/api/auth/callback/google`
   - Done! No more updates needed.

---

## Quick Reference Commands

```bash
# Logout from ngrok
ngrok logout

# Login with new account
ngrok config add-authtoken YOUR_NEW_TOKEN

# Start ngrok
ngrok http 9002

# Check current ngrok account
ngrok config check
```

---

## Troubleshooting

### "Redirect URI mismatch" error:
- Make sure you added the EXACT ngrok URL to Google OAuth
- Check for typos (https vs http, trailing slashes, etc.)
- Wait a few minutes after saving - Google needs time to update

### ngrok URL not working:
- Make sure ngrok is running: `ngrok http 9002`
- Check that your dev server is running on port 9002
- Verify your ngrok account is active

### Google login works on localhost but not on ngrok:
- Double-check the redirect URI in Google Cloud Console
- Make sure you're using HTTPS (not HTTP) for the ngrok URL
- Clear browser cache and try again

---

## Summary

✅ **Yes, changing your ngrok account will allow Google login from other devices**
✅ **You MUST update Google OAuth redirect URIs with your new ngrok URL**
✅ **For best experience, consider upgrading to paid ngrok for a fixed domain**

