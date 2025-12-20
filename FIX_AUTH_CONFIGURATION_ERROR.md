# Fix: Server Configuration Error with Login

## Problem

You're seeing this error:
```
Server error
There is a problem with the server configuration.
Check the server logs for more information.
```

And even when logging in through localhost, it redirects to the ngrok URL.

## Root Cause

The `AUTH_URL` environment variable is set in your `.env.local` file, which forces NextAuth to use that URL for all redirects, even when accessing via localhost.

## Solution: Remove AUTH_URL

With `trustHost: true` in the auth configuration, you **should NOT** set `AUTH_URL`. The app will automatically detect whether you're on localhost or ngrok.

### Steps to Fix:

1. **Open your `.env.local` file**

2. **Remove or comment out the AUTH_URL line:**
   ```env
   # Remove this line (or comment it out with #):
   # AUTH_URL=https://jacketless-unsagaciously-denice.ngrok-free.dev
   ```

3. **Save the file**

4. **Restart your dev server:**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

5. **Test both:**
   - **Localhost**: `http://localhost:9002` - Login should work
   - **ngrok**: `https://your-ngrok-url.ngrok-free.dev` - Login should work

## Why This Works

- `trustHost: true` tells NextAuth v5 to automatically detect the host from request headers
- When you access via `localhost:9002`, it uses `http://localhost:9002`
- When you access via ngrok, it uses the ngrok URL
- Setting `AUTH_URL` overrides this automatic detection

## Important Notes

1. **Both URLs must be in Google OAuth settings:**
   - `http://localhost:9002/api/auth/callback/google`
   - `https://your-ngrok-url.ngrok-free.dev/api/auth/callback/google`

2. **No need to update AUTH_URL** when ngrok URL changes - it's automatic!

3. **If you still have issues after removing AUTH_URL:**
   - Clear browser cache
   - Make sure both redirect URIs are in Google Cloud Console
   - Restart your dev server

## Verification

After removing `AUTH_URL` and restarting:

1. ✅ Login on localhost should work
2. ✅ Login on ngrok should work  
3. ✅ Logout on localhost should work
4. ✅ Logout on ngrok should work
5. ✅ No more configuration errors
