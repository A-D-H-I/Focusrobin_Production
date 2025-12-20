# Git Authentication Fix Guide

## ✅ What I Fixed:

1. **Removed expired token** from your remote URL
2. **Fixed credential helper** configuration
3. **Updated remote URL** to use clean authentication

## 🔑 Next Steps: Generate New GitHub Token

You need to create a new Personal Access Token (PAT) for GitHub:

### Step 1: Create GitHub Personal Access Token

1. **Go to GitHub Settings:**
   - Visit: https://github.com/settings/tokens
   - Or: GitHub → Your Profile → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Generate New Token:**
   - Click **"Generate new token"** → **"Generate new token (classic)"**
   - Give it a name: `FocusRobin Site Development`
   - Set expiration (recommend 90 days or custom)
   - **Select scopes:**
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (if you use GitHub Actions)

3. **Generate and Copy:**
   - Click **"Generate token"**
   - **IMPORTANT:** Copy the token immediately - you won't see it again!
   - It will look like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 2: Use the Token

When you push, Git will prompt for credentials:

```bash
cd G:\Dev\focusrobinsite
git push origin main
```

**When prompted:**
- **Username:** `hariharan102`
- **Password:** Paste your new token (NOT your GitHub password)

### Step 3: Store Credentials (Optional but Recommended)

To avoid entering credentials every time:

**Option A: Use Git Credential Manager (Windows)**
```bash
git config --global credential.helper manager-core
```

**Option B: Store in file (Simple)**
```bash
git config --global credential.helper store
```
Then on first push, enter your token once - it will be saved.

### Step 4: Test the Push

```bash
cd G:\Dev\focusrobinsite
git push origin main
```

If it still asks for credentials:
- Username: `hariharan102`
- Password: Your new token

---

## 🔒 Security Notes

- **Never commit tokens to Git** - they're already removed from your remote URL
- **Don't share your token** - treat it like a password
- **Rotate tokens regularly** - especially if you suspect it's been compromised
- **Use fine-grained tokens** if possible (newer GitHub feature)

---

## 🐛 If You Still Get Errors

### Error: "credential-manager-core is not a git command"
```bash
# Use the store method instead
git config --global credential.helper store
```

### Error: "Authentication failed"
- Double-check your token is correct
- Make sure you copied the entire token
- Verify the token hasn't expired
- Check that `repo` scope is selected

### Error: "Permission denied"
- Make sure the token has `repo` scope
- Verify you have push access to the repository

---

## 📝 Quick Reference

```bash
# Check current remote URL
git remote -v

# Update remote URL (if needed)
git remote set-url origin https://github.com/hariharan102/focusrobinsite.git

# Set credential helper
git config --global credential.helper store

# Push (will prompt for token on first use)
git push origin main
```

---

## ✅ Summary

1. ✅ Removed expired token from remote URL
2. ✅ Fixed credential helper
3. ⏳ **You need to:** Generate new token at https://github.com/settings/tokens
4. ⏳ **Then:** Use token as password when pushing

