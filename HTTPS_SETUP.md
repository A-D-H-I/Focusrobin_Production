# Quick HTTPS Setup for Mobile Camera Access

To use the camera feature from your mobile device over the network, you need HTTPS. Here's the **easiest way**:

## 🚀 Quick Solution: Use ngrok

### Step 1: Install ngrok
```bash
# Option A: Download from https://ngrok.com/download
# Option B: Install via npm (if you have Node.js)
npm install -g ngrok
```

### Step 2: Start your dev server (in Terminal 1)
```bash
npm run dev
```

### Step 3: Start ngrok (in Terminal 2 - NEW terminal window)
```bash
ngrok http 9002
```

### Step 4: Copy the HTTPS URL
ngrok will display something like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:9002
```

### Step 5: Access from your mobile
1. Open your mobile browser
2. Go to: `https://abc123.ngrok.io` (use the URL from ngrok)
3. The camera will now work! ✅

---

## 📱 Alternative: Use localtunnel (Free, No Signup)

### Step 1: Install localtunnel
```bash
npm install -g localtunnel
```

### Step 2: Start your dev server
```bash
npm run dev
```

### Step 3: Start localtunnel (in a new terminal)
```bash
lt --port 9002
```

### Step 4: Access from mobile
- Use the HTTPS URL provided (e.g., `https://random-name.loca.lt`)

---

## ⚠️ Important Notes

1. **Free ngrok URLs change** each time you restart ngrok
2. **Keep both terminals open** - one for dev server, one for ngrok
3. **HTTPS is required** - mobile browsers block camera access on HTTP
4. **Same network not required** - ngrok works from anywhere!

---

## 🎯 Quick Test

1. Start dev server: `npm run dev`
2. Start ngrok: `ngrok http 9002`
3. Copy the HTTPS URL from ngrok
4. Open on mobile browser
5. Try the camera feature!

That's it! 🎉

