# HTTPS Setup for Camera Access on Mobile

To access the camera feature from your mobile device over the network, you need HTTPS. Here are the easiest options:

## Option 1: Use ngrok (Easiest - Recommended)

### Step 1: Install ngrok
```bash
# Download from https://ngrok.com/download
# Or install via npm:
npm install -g ngrok
```

### Step 2: Start your dev server
```bash
npm run dev
```

### Step 3: In a NEW terminal, start ngrok
```bash
ngrok http 9002
```

### Step 4: Copy the HTTPS URL
ngrok will show you a URL like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:9002
```

### Step 5: Access from your mobile
- Open the ngrok HTTPS URL on your mobile browser
- Example: `https://abc123.ngrok.io`
- The camera will now work!

**Note:** Free ngrok URLs change each time you restart. For a fixed URL, upgrade to ngrok paid plan.

---

## Option 2: Use localtunnel (Free Alternative)

### Step 1: Install localtunnel
```bash
npm install -g localtunnel
```

### Step 2: Start your dev server
```bash
npm run dev
```

### Step 3: In a NEW terminal, start localtunnel
```bash
lt --port 9002
```

### Step 4: Access from your mobile
- Use the HTTPS URL provided by localtunnel
- Example: `https://random-name.loca.lt`

---

## Option 3: Use Cloudflare Tunnel (Free, More Stable)

### Step 1: Install cloudflared
Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

### Step 2: Start your dev server
```bash
npm run dev
```

### Step 3: In a NEW terminal, start Cloudflare Tunnel
```bash
cloudflared tunnel --url http://localhost:9002
```

### Step 4: Access from your mobile
- Use the HTTPS URL provided by Cloudflare
- This URL is more stable than ngrok free tier

---

## Quick Start Script

I've added a script to make this easier. Just run:

```bash
npm run dev:https
```

This will start both the dev server and ngrok automatically.

