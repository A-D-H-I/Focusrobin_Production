# Network Login Alternatives to ngrok

Here are several alternatives for testing OAuth login from your iPad:

## Option 1: Cloudflare Tunnel (Free, Recommended)

Cloudflare Tunnel (formerly Argo Tunnel) is free and more stable than ngrok free tier.

### Setup:

1. **Install Cloudflare Tunnel:**
   ```bash
   # Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
   # Or use npm:
   npm install -g cloudflared
   ```

2. **Start your dev server:**
   ```bash
   npm run dev
   ```

3. **In another terminal, start Cloudflare Tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:9002
   ```

4. **Copy the Cloudflare URL** (e.g., `https://abc123.trycloudflare.com`)

5. **Add to Google OAuth:**
   - **Authorized JavaScript origins:** `https://abc123.trycloudflare.com`
   - **Authorized redirect URIs:** `https://abc123.trycloudflare.com/api/auth/callback/google`

**Pros:** Free, more stable than ngrok free, HTTPS by default
**Cons:** URL still changes on restart (unless you set up a named tunnel)

---

## Option 2: localtunnel (Free, Simple)

Very simple alternative to ngrok.

### Setup:

1. **Install localtunnel:**
   ```bash
   npm install -g localtunnel
   ```

2. **Start your dev server:**
   ```bash
   npm run dev
   ```

3. **In another terminal, start localtunnel:**
   ```bash
   lt --port 9002
   ```

4. **Copy the localtunnel URL** (e.g., `https://abc123.loca.lt`)

5. **Add to Google OAuth:**
   - **Authorized JavaScript origins:** `https://abc123.loca.lt`
   - **Authorized redirect URIs:** `https://abc123.loca.lt/api/auth/callback/google`

**Pros:** Very simple, free
**Cons:** URLs change, less reliable than ngrok/Cloudflare

---

## Option 3: Use Computer Hostname (If Resolvable)

If your computer's hostname resolves on your network:

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
   - **Authorized JavaScript origins:** `http://DESKTOP-9RT5CTT:9002`
   - **Authorized redirect URIs:** `http://DESKTOP-9RT5CTT:9002/api/auth/callback/google`

**Note:** Google may reject this if it's not a proper domain. This often doesn't work.

---

## Option 4: Use a Free Dynamic DNS Service

Set up a free domain that points to your IP:

1. **Sign up for a free DDNS service:**
   - No-IP: https://www.noip.com/
   - DuckDNS: https://www.duckdns.org/
   - FreeDNS: https://freedns.afraid.org/

2. **Get a free subdomain** (e.g., `focusrobin.ddns.net`)

3. **Configure it to point to your network IP**

4. **Set up port forwarding on your router** (port 9002)

5. **Add to Google OAuth:**
   - **Authorized JavaScript origins:** `http://focusrobin.ddns.net:9002`
   - **Authorized redirect URIs:** `http://focusrobin.ddns.net:9002/api/auth/callback/google`

**Pros:** Fixed domain name, free
**Cons:** Requires router configuration, may need static IP or DDNS client

---

## Option 5: Deploy to Cloud for Testing

Deploy your app to a cloud service for testing:

- **Vercel** (free tier, easy Next.js deployment)
- **Netlify** (free tier)
- **Railway** (free tier)
- **Render** (free tier)

Then use the production URL for OAuth.

**Pros:** Real domain, stable, production-like environment
**Cons:** Requires deployment setup, not truly "local" development

---

## Option 6: Use localhost Only (No Network Access)

Just test on your computer browser only:

- Use `http://localhost:9002` on your computer
- Don't test from iPad
- Add only localhost to Google OAuth

**Pros:** Simplest, no extra setup
**Cons:** Can't test on iPad/network devices

---

## Recommendation

**For quick testing:** Use **Cloudflare Tunnel** - it's free, stable, and easy to set up.

**For long-term development:** Consider **Vercel** deployment for a stable testing environment, or set up a **free DDNS** service if you want to keep it local.

---

## Quick Comparison

| Solution | Free | Stable URL | Setup Difficulty | Best For |
|----------|------|------------|------------------|----------|
| ngrok | ✅ | ❌ (free) | Easy | Quick testing |
| Cloudflare Tunnel | ✅ | ❌ (free) | Easy | Better alternative to ngrok |
| localtunnel | ✅ | ❌ | Very Easy | Simplest option |
| DDNS | ✅ | ✅ | Medium | Long-term local dev |
| Cloud Deploy | ✅ | ✅ | Medium | Production-like testing |
| localhost only | ✅ | ✅ | Very Easy | Computer-only testing |

