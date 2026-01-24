# Meta Pixel Setup Guide - Step by Step

## Step 1: Access Facebook Business Manager

1. Go to **https://business.facebook.com/**
2. Sign in with your Facebook account (or create one if needed)
3. If you don't have a Business Manager account yet:
   - Click "Create Account" or "Get Started"
   - Follow the prompts to create your business account
   - You'll need: Business name, your name, business email

---

## Step 2: Navigate to Events Manager

1. Once logged into Business Manager, look for the menu on the left sidebar
2. Click on **"Events Manager"** (or find it under "Measure & Report" section)
3. If you don't see it, click the hamburger menu (☰) to expand all options

---

## Step 3: Create a New Pixel

1. In Events Manager, you'll see a section called **"Data Sources"** or **"Pixels"**
2. Click the **"+ Add"** or **"Connect Data Sources"** button
3. Select **"Web"** as your data source type
4. Choose **"Facebook Pixel"** from the options
5. Click **"Connect"** or **"Get Started"**

---

## Step 4: Name Your Pixel

1. Enter a name for your pixel:
   - Recommended: **"FocusRobin Website"** or **"FocusRobin.lt Pixel"**
2. Enter your website URL: **https://focusrobin.lt**
3. Click **"Continue"**

---

## Step 5: Get Your Pixel ID

1. After creating the pixel, you'll see a page with setup instructions
2. Look for a section that shows your **Pixel ID**
3. The Pixel ID is a **15-16 digit number** (e.g., `123456789012345`)
4. **Copy this number** - you'll need it in the next step

**Where to find it later:**
- Go to Events Manager → Data Sources → Your Pixel
- The Pixel ID is displayed at the top of the page

---

## Step 6: Add Pixel ID to Your Project

### Option A: Using .env.local (Recommended for Development)

1. Open your project folder: `G:\Dev\focusrobinsite`
2. Create or open the file `.env.local` (in the root directory, same level as `package.json`)
3. Add this line:
   ```env
   NEXT_PUBLIC_META_PIXEL_ID=your_pixel_id_here
   ```
   Replace `your_pixel_id_here` with the actual Pixel ID you copied

4. Save the file

### Option B: Using .env (For Production)

1. Create or open `.env` file in the root directory
2. Add the same line:
   ```env
   NEXT_PUBLIC_META_PIXEL_ID=your_pixel_id_here
   ```
3. Save the file

**Important Notes:**
- The variable name **MUST** start with `NEXT_PUBLIC_` for Next.js to expose it to the browser
- Never commit `.env.local` to Git (it should be in `.gitignore`)
- For production deployment, add this to your hosting platform's environment variables

---

## Step 7: Restart Your Development Server

1. Stop your current dev server (Ctrl+C in terminal)
2. Start it again:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

**Why?** Next.js only reads environment variables when the server starts.

---

## Step 8: Verify It's Working

### Check Browser Console

1. Open your site in browser: `http://localhost:3000` (or your dev URL)
2. Open Developer Tools (F12 or Right-click → Inspect)
3. Go to the **Console** tab
4. You should see:
   ```
   ✅ Meta Pixel: Pixel ID loaded abc12345...
   ✅ Meta Pixel: PageView tracked for /
   ```

### Check Network Tab

1. In Developer Tools, go to **Network** tab
2. Filter by "facebook" or "fbevents"
3. You should see requests to:
   - `connect.facebook.net/en_US/fbevents.js`
   - `facebook.com/tr` (for noscript fallback)

### Use Facebook Pixel Helper (Chrome Extension)

1. Install **"Meta Pixel Helper"** from Chrome Web Store:
   https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc

2. Visit your website
3. Click the extension icon
4. You should see:
   - ✅ Pixel ID detected
   - ✅ PageView event fired
   - Any other events (AddToCart, ViewContent, etc.)

### Check Events Manager

1. Go back to Facebook Events Manager
2. Click on your Pixel
3. Go to **"Test Events"** tab
4. Visit your website
5. You should see events appearing in real-time:
   - PageView
   - ViewContent (when viewing products)
   - AddToCart (when adding to cart)
   - etc.

---

## Step 9: Set Up Filters (After Deployment)

Once your site is live, filter out localhost traffic:

1. In Events Manager, go to your Pixel settings
2. Click **"Filters"** or **"Settings"**
3. Add filters to exclude:
   - `localhost`
   - `127.0.0.1`
   - Your staging/dev domains

This ensures you only track real visitors, not your own testing.

---

## Troubleshooting

### Pixel ID Not Loading

**Problem:** Console shows "NEXT_PUBLIC_META_PIXEL_ID is not set"

**Solutions:**
1. ✅ Check `.env.local` file exists in root directory
2. ✅ Verify variable name is exactly `NEXT_PUBLIC_META_PIXEL_ID`
3. ✅ Make sure there are no spaces: `NEXT_PUBLIC_META_PIXEL_ID=123456789012345`
4. ✅ Restart your dev server after adding the variable
5. ✅ Check file is not named `.env.local.txt` (Windows sometimes adds .txt)

### Events Not Showing in Events Manager

**Problem:** Events not appearing in Facebook Events Manager

**Solutions:**
1. ✅ Wait 5-10 minutes (there can be a delay)
2. ✅ Check "Test Events" tab (shows real-time events)
3. ✅ Verify Pixel ID is correct (no typos)
4. ✅ Make sure you're not using an ad blocker
5. ✅ Check browser console for errors

### Pixel Not Tracking on Admin Pages

**This is intentional!** The pixel is configured to NOT load on `/admin/*` pages to avoid tracking your own admin activity.

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Add `NEXT_PUBLIC_META_PIXEL_ID` to your hosting platform's environment variables
  - **Vercel:** Settings → Environment Variables
  - **Netlify:** Site Settings → Environment Variables
  - **Other platforms:** Check their documentation for environment variables

- [ ] Set up filters in Events Manager to exclude localhost

- [ ] Test on production URL to verify events are tracking

- [ ] Set up conversion events in Facebook Ads Manager (if running ads)

---

## Next Steps

Once your pixel is working:

1. **Set up Custom Conversions** (optional)
   - Events Manager → Custom Conversions
   - Create conversions for specific actions (e.g., "Purchase over €100")

2. **Create Facebook Ads**
   - Use your pixel data to create targeted ad campaigns
   - Track conversions and optimize ad performance

3. **Set up Aggregated Event Measurement** (if needed)
   - For iOS 14.5+ tracking compliance

---

## Support Resources

- **Facebook Pixel Documentation:** https://developers.facebook.com/docs/meta-pixel
- **Events Manager Help:** https://www.facebook.com/business/help
- **Pixel Helper Extension:** https://chrome.google.com/webstore/detail/meta-pixel-helper

---

## Quick Reference

**Your Pixel ID Location:**
- Events Manager → Data Sources → [Your Pixel Name] → Pixel ID

**Environment Variable:**
```env
NEXT_PUBLIC_META_PIXEL_ID=your_15_digit_pixel_id
```

**Verify in Console:**
```
✅ Meta Pixel: Pixel ID loaded
✅ Meta Pixel: PageView tracked
```

---

**Need Help?** Check the browser console for error messages and share them for troubleshooting.

