# Complete AWS S3 Setup Guide - Step by Step

This is a complete, beginner-friendly guide to set up AWS S3 for your FocusRobin site.

## Prerequisites

- An email address (to create AWS account)
- Credit card (AWS free tier available, won't be charged unless you exceed limits)
- 15-20 minutes

---

## Step 1: Create AWS Account

### 1.1 Go to AWS Website
1. Open your browser
2. Go to: **https://aws.amazon.com/**
3. Click **"Create an AWS Account"** (top right)

### 1.2 Sign Up Process
1. Enter your **email address**
2. Choose a **password** (must be strong)
3. Enter **account name** (e.g., "FocusRobin")
4. Click **"Continue"**

### 1.3 Contact Information
1. Fill in your details:
   - Full name
   - Company name (optional)
   - Phone number
   - Country/Region
   - Address
2. Click **"Create account and continue"**

### 1.4 Payment Information
1. Enter **credit card** details
   - **Don't worry!** AWS Free Tier includes:
     - 5GB S3 storage free for 12 months
     - 20,000 GET requests free
     - 2,000 PUT requests free
   - You won't be charged unless you exceed free tier
2. Click **"Secure Submit"**

### 1.5 Identity Verification
1. AWS will call your phone number
2. Enter the **PIN** you receive
3. Click **"Continue"**

### 1.6 Support Plan
1. Select **"Basic Plan"** (Free)
2. Click **"Complete sign up"**

### 1.7 Confirmation
- Check your email for confirmation
- Click the confirmation link
- You're now signed in to AWS!

---

## Step 2: Create S3 Bucket

### 2.1 Navigate to S3
1. In AWS Console, search for **"S3"** in the top search bar
2. Click on **"S3"** service

### 2.2 Create Bucket
1. Click the orange **"Create bucket"** button

### 2.3 General Configuration
1. **Bucket name**: Enter a unique name
   - Example: `focusrobin-images` or `yourdomain-images`
   - Must be globally unique (AWS will tell you if taken)
   - Use lowercase letters, numbers, and hyphens only
   - **Note this name** - you'll need it later!

2. **AWS Region**: Select your region
   - Recommended: **Europe (Ireland) eu-west-1** (closest to EU)
   - Or choose based on your location
   - **Note this region** - you'll need it later!

3. **Object Ownership**: 
   - Select **"ACLs enabled"**
   - Select **"Bucket owner preferred"**

### 2.4 Block Public Access Settings
⚠️ **IMPORTANT**: We need public read access for images

1. **Uncheck** "Block all public access"
2. Check the warning box to confirm
3. This allows images to be publicly viewable (needed for your website)

### 2.5 Bucket Versioning
- Leave as **"Disable"** (unless you need versioning)

### 2.6 Default Encryption
- Leave as **"Server-side encryption with Amazon S3 managed keys (SSE-S3)"**

### 2.7 Advanced Settings
- Leave all defaults

### 2.8 Create Bucket
1. Scroll down
2. Click **"Create bucket"**
3. ✅ Success! Your bucket is created

---

## Step 3: Configure Bucket Policy (Make Images Public)

### 3.1 Open Bucket
1. Click on your bucket name in the S3 console

### 3.2 Go to Permissions
1. Click the **"Permissions"** tab

### 3.3 Edit Bucket Policy
1. Scroll to **"Bucket policy"** section
2. Click **"Edit"**

### 3.4 Add Policy
1. Click **"Policy generator"** (or paste directly)
2. Copy and paste this policy (replace `YOUR-BUCKET-NAME` with your actual bucket name):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}
```

**Example** (if your bucket is `focusrobin-images`):
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::focusrobin-images/*"
        }
    ]
}
```

3. Click **"Save changes"**

---

## Step 4: Configure CORS (Optional but Recommended)

### 4.1 Still in Permissions Tab
1. Scroll to **"Cross-origin resource sharing (CORS)"**
2. Click **"Edit"**

### 4.2 Add CORS Configuration
1. Paste this configuration:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

**For Production** (replace with your domain):
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": [
            "https://yourdomain.com",
            "https://www.yourdomain.com",
            "http://localhost:9002"
        ],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

2. Click **"Save changes"**

---

## Step 5: Create IAM User (For Application Access)

### 5.1 Navigate to IAM
1. Search for **"IAM"** in AWS Console
2. Click on **"IAM"** service

### 5.2 Create User
1. Click **"Users"** in left sidebar
2. Click **"Create user"** button

### 5.3 User Details
1. **User name**: Enter `focusrobin-s3-user` (or any name)
2. Click **"Next"**

### 5.4 Set Permissions
1. Select **"Attach policies directly"**
2. Click **"Create policy"** button (opens new tab)

### 5.5 Create Policy (New Tab)
1. Click **"JSON"** tab
2. Paste this policy (replace `YOUR-BUCKET-NAME`):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "S3ImageUploadPermissions",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:HeadObject"
            ],
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        },
        {
            "Sid": "S3BucketListPermissions",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME"
        }
    ]
}
```

**Example** (if bucket is `focusrobin-images`):
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "S3ImageUploadPermissions",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:HeadObject"
            ],
            "Resource": "arn:aws:s3:::focusrobin-images/*"
        },
        {
            "Sid": "S3BucketListPermissions",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::focusrobin-images"
        }
    ]
}
```

3. Click **"Next"**
4. **Policy name**: Enter `FocusRobin-S3-ImageUpload`
5. Click **"Create policy"**
6. **Close this tab** and go back to IAM user creation

### 5.6 Attach Policy to User
1. Refresh the page (F5)
2. Search for `FocusRobin-S3-ImageUpload`
3. Check the box next to your policy
4. Click **"Next"**

### 5.7 Review and Create
1. Review the user details
2. Click **"Create user"**
3. ✅ User created!

---

## Step 6: Create Access Keys

### 6.1 Open User
1. Click on the user you just created (`focusrobin-s3-user`)

### 6.2 Security Credentials Tab
1. Click **"Security credentials"** tab
2. Scroll to **"Access keys"** section
3. Click **"Create access key"**

### 6.3 Access Key Type
1. Select **"Application running outside AWS"**
2. Click **"Next"**

### 6.4 Description (Optional)
1. Add description: `FocusRobin S3 Upload`
2. Click **"Create access key"**

### 6.5 ⚠️ IMPORTANT: Save Your Keys!
**You will only see these once!**

1. **Access Key ID**: Copy this (starts with `AKIA...`)
2. **Secret Access Key**: Click "Show" and copy this
3. **Save both** in a secure place (password manager, text file, etc.)

**Example:**
```
Access Key ID: AKIAIOSFODNN7EXAMPLE
Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

4. Click **"Done"**

---

## Step 7: Configure Your Application

### 7.1 Open Your Project
1. Open your project in your code editor
2. Navigate to `.env.local` file (or create it if it doesn't exist)

### 7.2 Add Environment Variables
Add these lines to `.env.local`:

```env
# AWS S3 Configuration
AWS_S3_REGION=eu-west-1
AWS_S3_BUCKET_NAME=focusrobin-images
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**Replace with your actual values:**
- `AWS_S3_REGION`: The region you selected (e.g., `eu-west-1`)
- `AWS_S3_BUCKET_NAME`: Your bucket name (e.g., `focusrobin-images`)
- `AWS_ACCESS_KEY_ID`: Your access key ID from Step 6
- `AWS_SECRET_ACCESS_KEY`: Your secret access key from Step 6

### 7.3 Save File
1. Save `.env.local`
2. **IMPORTANT**: Make sure `.env.local` is in `.gitignore` (don't commit secrets!)

---

## Step 8: Test S3 Connection

### 8.1 Restart Your Dev Server
1. Stop your dev server (Ctrl+C)
2. Start it again: `npm run dev`

### 8.2 Test Upload (Optional)
You can test by:
1. Going to your admin panel
2. Using the ImageUploader component
3. Uploading a test image
4. Check if it appears in your S3 bucket

### 8.3 Verify in S3 Console
1. Go back to AWS S3 Console
2. Click on your bucket
3. You should see uploaded files in folders like:
   - `prescriptions/`
   - `reviews/`
   - `admin-{id}/products/`

---

## Step 9: Verify Everything Works

### 9.1 Check Environment Variables
Make sure all 4 variables are set:
- ✅ `AWS_S3_REGION`
- ✅ `AWS_S3_BUCKET_NAME`
- ✅ `AWS_ACCESS_KEY_ID`
- ✅ `AWS_SECRET_ACCESS_KEY`

### 9.2 Test Image Upload
1. Go to your prescription form
2. Upload a test prescription image
3. Check if URL is returned (should start with `https://your-bucket.s3...`)

### 9.3 Check S3 Bucket
1. Go to AWS S3 Console
2. Open your bucket
3. Verify files are being uploaded

---

## Troubleshooting

### Error: "Access Denied"
**Solution:**
- Check IAM user has the policy attached
- Verify bucket policy allows public read
- Check access keys are correct

### Error: "NoSuchBucket"
**Solution:**
- Verify bucket name in `.env.local` matches exactly
- Check region is correct

### Error: "InvalidAccessKeyId"
**Solution:**
- Verify access key ID is correct (no extra spaces)
- Check secret access key is correct
- Make sure you copied the full keys

### Images Not Loading
**Solution:**
- Check bucket policy allows public read
- Verify CORS is configured
- Check file permissions in S3

### Upload Fails
**Solution:**
- Check IAM policy includes `s3:PutObject` and `s3:PutObjectAcl`
- Verify bucket exists and is in correct region
- Check network connection

---

## Security Best Practices

### ✅ DO:
- Keep access keys secret (never commit to git)
- Use IAM user (not root account) for application
- Regularly rotate access keys
- Monitor S3 usage in AWS Console

### ❌ DON'T:
- Share access keys publicly
- Commit `.env.local` to git
- Use root account credentials
- Give more permissions than needed

---

## Cost Monitoring

### Free Tier (First 12 Months)
- 5GB storage
- 20,000 GET requests
- 2,000 PUT requests
- 100GB data transfer out

### After Free Tier
- Storage: ~$0.023/GB/month
- PUT requests: ~$0.005 per 1,000
- GET requests: ~$0.0004 per 1,000
- Data transfer: First 100GB free, then ~$0.09/GB

**Typical small e-commerce site**: $2-5/month

### Set Up Billing Alerts
1. Go to AWS Billing Console
2. Set up billing alerts
3. Get notified if costs exceed threshold

---

## Quick Reference

### Your S3 Configuration
```
Bucket Name: focusrobin-images
Region: eu-west-1
Base URL: https://focusrobin-images.s3.eu-west-1.amazonaws.com/
```

### Environment Variables Needed
```env
AWS_S3_REGION=eu-west-1
AWS_S3_BUCKET_NAME=focusrobin-images
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

### Test Upload URL Format
```
https://focusrobin-images.s3.eu-west-1.amazonaws.com/prescriptions/user-id/timestamp-random-filename.jpg
```

---

## Next Steps

1. ✅ S3 is set up and configured
2. ✅ Your application can upload images
3. 📸 Start uploading images via your admin panel
4. 🚀 Migrate existing images from Google Drive (see `MIGRATION_GDRIVE_TO_S3.md`)

## Need Help?

- AWS S3 Documentation: https://docs.aws.amazon.com/s3/
- AWS Support: https://aws.amazon.com/support/
- Check your project's `AWS_S3_SETUP.md` for more details

---

**Congratulations! 🎉 Your S3 is set up and ready to use!**

