# AWS S3 Setup - Quick Checklist

Follow this checklist step by step. Check off each item as you complete it.

## ✅ Pre-Setup
- [ ] Have an email address ready
- [ ] Have a credit card ready (for verification, won't be charged on free tier)
- [ ] Set aside 15-20 minutes

---

## ✅ Step 1: Create AWS Account
- [ ] Go to https://aws.amazon.com/
- [ ] Click "Create an AWS Account"
- [ ] Enter email and password
- [ ] Fill in contact information
- [ ] Enter credit card (for verification)
- [ ] Verify phone number
- [ ] Select Basic Plan (Free)
- [ ] Confirm email address
- [ ] ✅ AWS Account Created!

---

## ✅ Step 2: Create S3 Bucket
- [ ] Search for "S3" in AWS Console
- [ ] Click "Create bucket"
- [ ] Enter bucket name: `_________________` (e.g., focusrobin-images)
- [ ] Select region: `_________________` (e.g., eu-west-1)
- [ ] Enable ACLs: "ACLs enabled" + "Bucket owner preferred"
- [ ] **Uncheck** "Block all public access"
- [ ] Confirm warning
- [ ] Click "Create bucket"
- [ ] ✅ Bucket Created!

**Write down:**
- Bucket Name: `_________________`
- Region: `_________________`

---

## ✅ Step 3: Configure Bucket Policy
- [ ] Click on your bucket name
- [ ] Go to "Permissions" tab
- [ ] Click "Edit" on Bucket policy
- [ ] Paste policy (replace YOUR-BUCKET-NAME):
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
- [ ] Click "Save changes"
- [ ] ✅ Bucket Policy Set!

---

## ✅ Step 4: Configure CORS (Optional)
- [ ] Still in Permissions tab
- [ ] Click "Edit" on CORS
- [ ] Paste CORS config:
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
- [ ] Click "Save changes"
- [ ] ✅ CORS Configured!

---

## ✅ Step 5: Create IAM User
- [ ] Search for "IAM" in AWS Console
- [ ] Click "Users" → "Create user"
- [ ] Enter username: `focusrobin-s3-user`
- [ ] Click "Next"
- [ ] Select "Attach policies directly"
- [ ] Click "Create policy"
- [ ] Click "JSON" tab
- [ ] Paste policy (replace YOUR-BUCKET-NAME):
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
            "Action": ["s3:ListBucket"],
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME"
        }
    ]
}
```
- [ ] Click "Next"
- [ ] Policy name: `FocusRobin-S3-ImageUpload`
- [ ] Click "Create policy"
- [ ] Go back to user creation tab
- [ ] Refresh page (F5)
- [ ] Search for `FocusRobin-S3-ImageUpload`
- [ ] Check the policy box
- [ ] Click "Next" → "Create user"
- [ ] ✅ IAM User Created!

---

## ✅ Step 6: Create Access Keys
- [ ] Click on the user you created
- [ ] Go to "Security credentials" tab
- [ ] Scroll to "Access keys"
- [ ] Click "Create access key"
- [ ] Select "Application running outside AWS"
- [ ] Click "Next" → "Create access key"
- [ ] **COPY BOTH KEYS NOW** (you won't see them again!)
- [ ] Access Key ID: `_________________`
- [ ] Secret Access Key: `_________________`
- [ ] Click "Done"
- [ ] ✅ Access Keys Created!

**⚠️ IMPORTANT: Save these keys securely!**

---

## ✅ Step 7: Configure Application
- [ ] Open your project folder
- [ ] Open or create `.env.local` file
- [ ] Add these lines:
```env
AWS_S3_REGION=eu-west-1
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```
- [ ] Replace with YOUR actual values:
  - Region: `_________________`
  - Bucket Name: `_________________`
  - Access Key ID: `_________________`
  - Secret Key: `_________________`
- [ ] Save file
- [ ] ✅ Environment Variables Set!

---

## ✅ Step 8: Test Setup
- [ ] Restart dev server: `npm run dev`
- [ ] Check for errors in console
- [ ] Go to admin panel
- [ ] Try uploading a test image
- [ ] Check S3 bucket - file should appear
- [ ] ✅ Everything Working!

---

## ✅ Verification Checklist
- [ ] Bucket exists and is accessible
- [ ] Bucket policy allows public read
- [ ] IAM user has correct permissions
- [ ] Access keys are saved securely
- [ ] Environment variables are set
- [ ] Dev server starts without errors
- [ ] Test upload works
- [ ] Images appear in S3 bucket
- [ ] Images are publicly accessible

---

## 🎉 Setup Complete!

Your S3 is now configured and ready to use!

**Next Steps:**
1. Start uploading images via your admin panel
2. See `MIGRATION_GDRIVE_TO_S3.md` to migrate existing images
3. See `MANAGING_IMAGES_S3.md` for daily usage

**Need Help?**
- See `S3_SETUP_COMPLETE_GUIDE.md` for detailed instructions
- See `AWS_S3_SETUP.md` for technical reference

