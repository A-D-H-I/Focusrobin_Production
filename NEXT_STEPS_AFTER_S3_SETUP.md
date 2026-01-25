# Next Steps After S3 Setup ✅

You've added your environment variables! Here's what to do next:

## Step 1: Restart Your Dev Server

**IMPORTANT**: Environment variables are only loaded when the server starts.

1. **Stop** your current dev server (press `Ctrl+C` in terminal)
2. **Start** it again:
   ```powershell
   npm run dev
   ```
3. Wait for it to start (should see "Ready in X.Xs")

---

## Step 2: Test S3 Connection

### Option A: Quick Test (Recommended)
1. Open your browser
2. Go to: **http://localhost:9002/api/test-s3**
3. You should see:
   ```json
   {
     "success": true,
     "message": "S3 connection successful! ✅",
     "details": {
       "bucket": "your-bucket-name",
       "region": "eu-west-1"
     }
   }
   ```

### Option B: Check Console
1. Look at your terminal/console
2. You should see: `[S3] Client initialized successfully`
3. No errors about missing environment variables

---

## Step 3: Test Image Upload

### Test 1: Prescription Upload
1. Go to your website
2. Navigate to a product with prescription option
3. Try uploading a test prescription image
4. Check if you get an S3 URL back (should start with `https://your-bucket.s3...`)

### Test 2: Review Image Upload
1. Go to your account page
2. Try submitting a review with an image
3. Check if images upload successfully

### Test 3: Admin Image Upload
1. Go to your admin panel
2. Try using the ImageUploader component
3. Upload a test image
4. Check if it appears in your S3 bucket

---

## Step 4: Verify in AWS S3 Console

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click on your bucket
3. You should see folders like:
   - `prescriptions/`
   - `reviews/`
   - `admin-{id}/`
4. Click on a folder to see uploaded files

---

## Step 5: Verify Image is Publicly Accessible

1. After uploading an image, copy the S3 URL
2. Open it in a new browser tab (incognito/private window)
3. Image should load directly (not require login)

---

## Troubleshooting

### ❌ Error: "Client not available"
**Problem**: Environment variables not loaded
**Solution**: 
- Make sure you restarted the dev server
- Check `.env.local` file exists and has all 4 variables
- Verify no typos in variable names

### ❌ Error: "Access Denied"
**Problem**: IAM permissions issue
**Solution**:
- Check IAM user has the policy attached
- Verify bucket policy allows public read
- Check access keys are correct

### ❌ Error: "NoSuchBucket"
**Problem**: Bucket name mismatch
**Solution**:
- Verify bucket name in `.env.local` matches exactly
- Check region is correct
- Make sure bucket exists in AWS Console

### ❌ Error: "InvalidAccessKeyId"
**Problem**: Wrong access keys
**Solution**:
- Verify access key ID is correct (no extra spaces)
- Check secret access key is correct
- Make sure you copied the full keys

---

## ✅ Success Checklist

- [ ] Dev server restarted
- [ ] Test endpoint shows success: http://localhost:9002/api/test-s3
- [ ] No errors in console
- [ ] Can upload prescription image
- [ ] Can upload review images
- [ ] Can upload admin images
- [ ] Images appear in S3 bucket
- [ ] Images are publicly accessible

---

## 🎉 You're Ready!

Once all tests pass, you can:

1. **Start using S3** for all new image uploads
2. **Migrate existing images** from Google Drive (see `MIGRATION_GDRIVE_TO_S3.md`)
3. **Update admin forms** to use ImageUploader component
4. **Enjoy faster image loading!** 🚀

---

## Quick Commands

```powershell
# Restart dev server
npm run dev

# Test S3 connection
# Visit: http://localhost:9002/api/test-s3

# Check environment variables are loaded
# Look for: [S3] Client initialized successfully
```

---

## Need Help?

- Check `S3_SETUP_COMPLETE_GUIDE.md` for detailed setup
- Check `AWS_S3_SETUP.md` for technical reference
- Check console logs for specific error messages

