# 🔧 Dropbox Invoice Upload Troubleshooting Guide

If invoices are not being saved to Dropbox after orders, follow this troubleshooting guide.

## Quick Diagnosis

### Step 1: Check Environment Variables

Make sure `DROPBOX_ACCESS_TOKEN` is set in your `.env.local` file:

```env
DROPBOX_ACCESS_TOKEN=sl.your-access-token-here
```

**Important:** After adding or changing environment variables, **restart your server**.

### Step 2: Test Dropbox Connection

Run the test script to verify your Dropbox configuration:

```bash
node scripts/test-dropbox.js
```

This will:
- ✅ Check if `DROPBOX_ACCESS_TOKEN` is set
- ✅ Test connection to Dropbox
- ✅ Verify permissions
- ✅ Create a test file upload

### Step 3: Check Server Logs

When an order is placed, check your server logs for Dropbox-related messages. Look for:

**Success messages:**
```
[Invoice] ✓ Uploaded to Dropbox: https://...
[Dropbox] ✓ File uploaded successfully
```

**Error messages:**
```
[Invoice] ✗ Dropbox upload error: ...
[Dropbox] Client not available, skipping upload
```

## Common Issues and Solutions

### Issue 1: "DROPBOX_ACCESS_TOKEN not set"

**Symptoms:**
- Log shows: `[Invoice] ⚠️ DROPBOX_ACCESS_TOKEN not set - skipping Dropbox upload`
- No Dropbox upload attempted

**Solution:**
1. Go to https://www.dropbox.com/developers/apps
2. Create an app or select existing one
3. Go to **Settings** tab → Generate access token
4. Copy the token (starts with `sl.`)
5. Add to `.env.local`:
   ```env
   DROPBOX_ACCESS_TOKEN=sl.your-token-here
   ```
6. **Restart your server**

### Issue 2: "Authentication failed" (401 error)

**Symptoms:**
- Log shows: `[Dropbox] Authentication failed. Check your DROPBOX_ACCESS_TOKEN`
- Error status: 401

**Solution:**
- Your access token is invalid or expired
- Generate a new access token from Dropbox App Console
- Update `DROPBOX_ACCESS_TOKEN` in `.env.local`
- **Restart your server**

### Issue 3: "Permission denied" (403 error)

**Symptoms:**
- Log shows: `[Dropbox] Permission denied. Make sure the token has files.content.write permission`
- Error status: 403

**Solution:**
1. Go to your Dropbox app → **Permissions** tab
2. Enable these permissions:
   - ✅ `files.content.write` - Write files
   - ✅ `files.content.read` - Read files
   - ✅ `sharing.write` - Create shared links (optional)
3. Click **Submit**
4. **Generate a NEW access token** (permissions only apply to new tokens)
5. Update `DROPBOX_ACCESS_TOKEN` in `.env.local`
6. **Restart your server**

### Issue 4: "Path error" or "Folder not found" (409 error)

**Symptoms:**
- Log shows: `[Dropbox] Path error. The folder might not exist or path is invalid`
- Error status: 409

**Solution:**
1. Check your `DROPBOX_FOLDER_PATH` in `.env.local` (default: `/FocusRobin Invoices`)
2. Go to https://www.dropbox.com
3. Create the folder manually if it doesn't exist
4. Make sure the folder name matches exactly (case-sensitive)
5. If using "App folder" access type, folder must be in `/Apps/YourAppName/`

### Issue 5: "Client not available"

**Symptoms:**
- Log shows: `[Dropbox] Client not available, skipping upload`

**Solution:**
- This means `DROPBOX_ACCESS_TOKEN` is not set or the client failed to initialize
- Follow **Issue 1** solution above

## Debugging Steps

### 1. Enable Detailed Logging

The code now includes detailed error logging. Check your server console/logs for:
- Error messages
- Stack traces
- Error status codes
- Error details

### 2. Verify Webhook is Triggered

Make sure the Stripe webhook is being called:
- Look for: `[Stripe Webhook] Received event: checkout.session.completed`
- Look for: `[Stripe Webhook] Starting invoice processing for order...`

### 3. Check Invoice Processing

Look for these log messages in order:
1. `[Invoice] Starting invoice processing for order...`
2. `[Invoice] Fetching invoice data...`
3. `[Invoice] Invoice data retrieved...`
4. `[Invoice] Generating combined PDF...`
5. `[Invoice] Attempting Dropbox upload...`
6. `[Dropbox] Uploading to: ...`
7. `[Dropbox] ✓ File uploaded successfully` (or error message)

### 4. Test Dropbox Manually

Run the test script:
```bash
node scripts/test-dropbox.js
```

This will verify:
- ✅ Token is set
- ✅ Token is valid
- ✅ Permissions are correct
- ✅ Upload works

## Verification

After fixing the issue, place a test order and check:

1. **Server logs** - Should show successful upload
2. **Dropbox folder** - Check your Dropbox folder for the invoice PDF
3. **File name format** - Should be: `FocusRobin-Order-ORD-YYYY-XXXXX-Documents-YYYY-MM-DD.pdf`

## Still Not Working?

If you've tried all the above and it's still not working:

1. **Check server logs** - Look for any error messages
2. **Run test script** - `node scripts/test-dropbox.js`
3. **Verify webhook** - Make sure Stripe webhook is configured correctly
4. **Check environment** - Ensure `.env.local` is being loaded (restart server after changes)

## Recent Improvements

The code has been updated with:
- ✅ Better error handling and logging
- ✅ Clear error messages with troubleshooting hints
- ✅ Proper error propagation (errors are thrown, not silently ignored)
- ✅ Detailed logging at each step

All errors are now logged with full details, making it easier to diagnose issues.


