# 📦 Dropbox Integration Setup Guide

Simple and easy setup for automatic invoice backup to Dropbox.

---

## ✨ What This Does

After every order completion, invoice PDFs are **automatically uploaded** to your Dropbox:
- ✅ **Automatic Backup** - Every invoice saved to Dropbox
- ✅ **Organized Storage** - All invoices in one folder
- ✅ **Easy Access** - View from any device
- ✅ **Simple Setup** - Just one access token needed!

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Dropbox App

1. **Go to Dropbox App Console**
   - Open: https://www.dropbox.com/developers/apps
   - Click **"Create app"**

2. **Configure App**
   - Choose API: **"Scoped access"**
   - Access type: **"Full Dropbox"** or **"App folder"** (your choice)
   - Name your app: `FocusRobin Invoice Uploader`
   - Click **"Create app"**

---

### Step 2: Set Permissions

1. **Go to Permissions Tab**
   - In your app settings, click **"Permissions"** tab
   - Find and check these permissions:
     - ✅ `files.content.write` - Write files
     - ✅ `files.content.read` - Read files
     - ✅ `sharing.write` - Create shared links (optional)
   - Click **"Submit"** at the bottom

---

### Step 3: Generate Access Token

1. **Go to Settings Tab**
   - Click **"Settings"** tab
   - Scroll down to **"OAuth 2"** section
   - Find **"Generated access token"**
   - Click **"Generate"** button
   - **Copy the token** (it's long, starts with `sl.`)

⚠️ **IMPORTANT**: Keep this token secure! It gives access to your Dropbox.

---

### Step 4: Add to Environment Variables

Add to your `.env.local` file:

```env
# ==================== Dropbox Configuration ====================

# Dropbox Access Token (from Step 3)
DROPBOX_ACCESS_TOKEN=sl.your-very-long-access-token-here

# Dropbox Folder Path (optional, defaults to /FocusRobin Invoices)
DROPBOX_FOLDER_PATH=/FocusRobin Invoices
```

---

### Step 5: Create Folder in Dropbox

1. **Go to Dropbox**
   - Open: https://www.dropbox.com
   - Click **"Create"** → **"Folder"**
   - Name it: **"FocusRobin Invoices"**

---

### Step 6: Test It

Run the test script:

```powershell
node scripts/test-dropbox.js
```

### ✅ Expected Output:

```
🧪 Testing Dropbox Setup...

📋 Checking environment variables...
✓ DROPBOX_ACCESS_TOKEN is set

🔗 Testing connection to Dropbox...
✓ Connected to Dropbox successfully
  Account: Your Name
  Email: your@email.com

📁 Checking for folder "/FocusRobin Invoices"...
✓ Folder found: /FocusRobin Invoices

📤 Testing file upload...
✓ Test file uploaded successfully
  File ID: id:xxxxx
  File Name: Test-Invoice-1234567890.txt
  Path: /FocusRobin Invoices/Test-Invoice-1234567890.txt

🔗 Creating shared link...
✓ Shared link created
  Link: https://www.dropbox.com/...

✅ All tests passed!

Dropbox is configured correctly and ready to use.
Check your Dropbox folder "/FocusRobin Invoices" to see the test file.
```

---

## 📁 How It Works

```
Customer completes order
    ↓
Stripe processes payment
    ↓
Stripe webhook fires
    ↓
Generate invoice PDF
    ↓
✅ Upload to Dropbox
    ↓
✅ Send email to customer
    ↓
Done! Invoice backed up
```

---

## 📂 Where to Find Your Invoices

1. Go to https://www.dropbox.com
2. Navigate to **"FocusRobin Invoices"** folder
3. All invoice PDFs will be there!

**File naming format:**
```
FocusRobin-Order-ORD-2024-001-Documents-2024-12-25.pdf
```

---

## 🔍 Troubleshooting

### "Authentication failed" (401 error)
**Cause:** Invalid or expired access token

**Solution:**
- Go to your app settings: https://www.dropbox.com/developers/apps
- Generate a new access token
- Update `DROPBOX_ACCESS_TOKEN` in `.env.local`

---

### "Permission denied" (403 error)
**Cause:** Missing permissions

**Solution:**
- Go to your app → Permissions tab
- Enable `files.content.write` and `files.content.read`
- Click "Submit"
- Generate a NEW access token (permissions only apply to new tokens)

---

### "Folder not found"
**Cause:** Folder doesn't exist

**Solution:**
- Go to https://www.dropbox.com
- Create the folder manually
- Make sure the name matches `DROPBOX_FOLDER_PATH` exactly

---

### "Access token not set"
**Cause:** Environment variable not configured

**Solution:**
- Check `.env.local` file exists in project root
- Make sure `DROPBOX_ACCESS_TOKEN=...` is set
- Restart your development server

---

## 🔐 Security Best Practices

1. **Keep token secure**
   - Never commit `.env.local` to Git
   - Don't share your access token
   - Treat it like a password

2. **Token rotation**
   - Periodically generate new tokens
   - Revoke old tokens when no longer needed

3. **App permissions**
   - Only enable permissions you need
   - Use "App folder" access if possible (more restrictive)

---

## 📊 Dropbox Access Types

### **Full Dropbox** (Recommended for this use case)
- ✅ Access to all folders
- ✅ Can create folders anywhere
- ✅ More flexible

### **App Folder**
- Files stored in `/Apps/FocusRobin Invoice Uploader/`
- More restrictive
- Better for security

To change, create a new app with different access type.

---

## ⚙️ Advanced Configuration

### Custom Folder Path

```env
# Use different folder
DROPBOX_FOLDER_PATH=/Business/Invoices

# Use subfolder
DROPBOX_FOLDER_PATH=/Documents/FocusRobin/Invoices
```

### Multiple Environments

```env
# Production
DROPBOX_FOLDER_PATH=/FocusRobin Invoices - Production

# Staging  
DROPBOX_FOLDER_PATH=/FocusRobin Invoices - Staging
```

---

## 💡 Why Dropbox?

✅ **Simple Setup** - Just one access token  
✅ **No Quota Issues** - Uses your Dropbox storage  
✅ **Reliable** - 99.9% uptime  
✅ **Widely Used** - Familiar to everyone  
✅ **Easy Sharing** - Built-in file sharing  
✅ **Cross-Platform** - Works everywhere  

---

## 📝 Environment Variables Summary

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DROPBOX_ACCESS_TOKEN` | Access token from app settings | ✅ Yes | None |
| `DROPBOX_FOLDER_PATH` | Folder path in Dropbox | ❌ No | `/FocusRobin Invoices` |

---

## 🎉 You're All Set!

Once configured, invoices automatically upload to Dropbox after every order!

**What happens:**
- ✅ Customer orders → Invoice generated
- ✅ Invoice uploaded to Dropbox
- ✅ Email sent to customer
- ✅ You have a backup in Dropbox

---

## 📞 Need Help?

Check the logs when an order is placed. Look for:

```
[Dropbox] Uploading to: /FocusRobin Invoices/...
[Dropbox] ✓ File uploaded successfully
```

**Common log messages:**
- `✓ File uploaded successfully` - Working perfectly!
- `Client not available` - Token not set
- `Authentication failed` - Token invalid
- `Permission denied` - Need to enable permissions
- `Folder not found` - Create the folder manually

---

**Happy selling! 🚀**

