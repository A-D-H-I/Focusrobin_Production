# AWS S3 Setup for FocusRobin

This guide explains how to set up Amazon S3 for storing prescription and review images.

## Overview

The application uses AWS S3 for:
- **Prescription Images**: Uploaded by users when submitting their prescription
- **Review Images**: Attached to product reviews by customers
- **Admin Images**: Product images, category images, hero images, and other content images uploaded by admins

## Prerequisites

1. An AWS account
2. AWS CLI installed (optional, for testing)

## Step 1: Create an S3 Bucket

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click **Create bucket**
3. Enter a bucket name (e.g., `focusrobin-images` or `your-domain-images`)
4. Select your preferred region (e.g., `eu-west-1` for Ireland)
5. **Object Ownership**: ACLs enabled, Bucket owner preferred
6. **Block Public Access**: Uncheck "Block all public access" (we need public read for images)
7. Acknowledge the warning about public access
8. Click **Create bucket**

## Step 2: Configure Bucket Policy

1. Go to your bucket → **Permissions** tab
2. Edit **Bucket policy** and add:

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

Replace `YOUR-BUCKET-NAME` with your actual bucket name.

## Step 3: Configure CORS (Optional but Recommended)

1. Go to your bucket → **Permissions** tab
2. Edit **Cross-origin resource sharing (CORS)** and add:

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

For production, replace `"AllowedOrigins": ["*"]` with your specific domains:
```json
"AllowedOrigins": ["https://yourdomain.com", "https://www.yourdomain.com"]
```

## Step 4: Create IAM User for Application

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Navigate to **Users** → **Create user**
3. Enter a username (e.g., `focusrobin-s3-user`)
4. Click **Next**
5. Select **Attach policies directly**
6. Create a new policy with the following JSON:

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

7. Name the policy (e.g., `FocusRobin-S3-ImageUpload`)
8. Attach this policy to the user
9. Click **Next** → **Create user**

## Step 5: Create Access Keys

1. Go to the IAM user you just created
2. Navigate to **Security credentials** tab
3. Under **Access keys**, click **Create access key**
4. Select **Application running outside AWS**
5. Click **Create access key**
6. **IMPORTANT**: Save both the Access Key ID and Secret Access Key securely

## Step 6: Configure Environment Variables

Add the following to your `.env.local` file:

```env
# AWS S3 Configuration
AWS_S3_REGION=eu-west-1
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_S3_REGION` | AWS region where your bucket is located | `eu-west-1` |
| `AWS_S3_BUCKET_NAME` | Name of your S3 bucket | `focusrobin-images` |
| `AWS_ACCESS_KEY_ID` | IAM user access key ID | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret access key | `wJal...` |

## Step 7: Test the Connection

You can test the S3 connection by calling the test function:

```typescript
import { testS3Connection } from '@/lib/s3';

// In your server-side code or API route
const isConnected = await testS3Connection();
console.log('S3 Connected:', isConnected);
```

## Folder Structure in S3

The application organizes files as follows:

```
your-bucket/
├── prescriptions/
│   └── {userId}/
│       └── {timestamp}-{random}-{filename}
└── reviews/
    └── {userId}/
        └── {timestamp}-{random}-{filename}
```

## File Types Supported

### Prescription Images
- JPEG/JPG
- PNG
- WebP
- HEIC/HEIF
- PDF
- Maximum size: 10MB

### Review Images
- JPEG/JPG
- PNG
- WebP
- HEIC/HEIF
- Maximum size: 5MB per image
- Maximum images: 5 per review

## API Endpoints

### Upload Prescription Image
```
POST /api/upload/prescription
Content-Type: multipart/form-data
Body: file (File)

Response:
{
  "success": true,
  "url": "https://bucket.s3.region.amazonaws.com/prescriptions/..."
}
```

### Upload Review Images
```
POST /api/upload/review
Content-Type: multipart/form-data
Body: files (File[])

Response:
{
  "success": true,
  "urls": ["https://bucket.s3.region.amazonaws.com/reviews/...", ...],
  "uploadedCount": 3
}
```

### Upload Admin Images
```
POST /api/upload/admin
Content-Type: multipart/form-data
Body: 
  - file (File)
  - folder (string) - Optional, defaults to "other"

Response:
{
  "success": true,
  "url": "https://bucket.s3.region.amazonaws.com/admin-{id}/folder/...",
  "key": "admin-{id}/folder/{timestamp}-{random}-{filename}"
}
```

**Note**: Admin upload requires authentication and ADMIN role.

## Security Considerations

1. **Public Access**: Images are publicly readable. Never store sensitive data other than images.
2. **Access Keys**: Keep your AWS credentials secure. Never commit them to version control.
3. **IAM Permissions**: The IAM user has minimal permissions (only what's needed for image uploads).
4. **File Validation**: All uploads are validated for type and size on the server.
5. **User Authentication**: Upload endpoints require user authentication.

## Troubleshooting

### "Access Denied" Error
- Check that your IAM user has the correct policy attached
- Verify the bucket policy allows public read
- Ensure ACLs are enabled on the bucket

### "NoSuchBucket" Error
- Verify the bucket name in your environment variables
- Check that the bucket exists in the correct region

### Images Not Loading
- Check the bucket's public access settings
- Verify the bucket policy is correctly configured
- Ensure CORS is properly set up for your domain

### Upload Timeout
- Check your network connection
- For large files, consider implementing multipart uploads

## Cost Considerations

AWS S3 pricing includes:
- **Storage**: ~$0.023 per GB/month (varies by region)
- **PUT requests**: ~$0.005 per 1,000 requests
- **GET requests**: ~$0.0004 per 1,000 requests
- **Data transfer out**: First 100GB/month free, then ~$0.09/GB

For a typical e-commerce site with moderate image uploads, expect costs of $5-20/month.

## Migration from Base64 Storage

If you have existing reviews with base64 images:

1. The application will continue to display base64 images from existing reviews
2. New reviews will use S3 URLs
3. Consider writing a migration script to move existing base64 images to S3

## Admin Image Uploads

For admin users, you can use the `ImageUploader` component to upload images directly to S3 from admin forms.

### Using ImageUploader Component

```tsx
import { ImageUploader } from "@/components/admin/ImageUploader";

function MyAdminForm() {
  const [imageUrl, setImageUrl] = useState("");

  return (
    <ImageUploader
      value={imageUrl}
      onChange={setImageUrl}
      folder="categories" // or "products", "hero", "instagram", etc.
      label="Category Image"
      description="Upload category image"
      maxSizeMB={10}
    />
  );
}
```

### Available Folders

- `products` - Product images and assets
- `categories` - Category banner images
- `hero` - Hero carousel images
- `instagram` - Instagram feed images
- `iconic` - Iconic section images
- `prescription-glasses` - Prescription glasses landing images
- `gift-banners` - Gift banner images
- `shapes` - Glass shape images
- `lens-images` - Prescription lens preview images
- `other` - General purpose (default)

### Features

- **Automatic S3 Upload**: Files are uploaded to S3 automatically
- **Image Preview**: Shows preview of uploaded images
- **Manual URL Entry**: Still supports manual URL entry for existing images
- **Error Handling**: Displays upload errors and validation messages
- **File Validation**: Validates file type and size before upload

### Example: Updating Category Image Form

Replace URL input fields with ImageUploader:

```tsx
// Before (manual URL entry)
<Input
  value={imageUrl}
  onChange={(e) => setImageUrl(e.target.value)}
  placeholder="Enter image URL"
/>

// After (S3 upload)
<ImageUploader
  value={imageUrl}
  onChange={setImageUrl}
  folder="categories"
  label="Category Image"
/>
```

See `src/components/admin/ImageUploader.example.tsx` for more examples.

## Related Files

- `src/lib/s3.ts` - S3 utility functions
- `src/app/api/upload/prescription/route.ts` - Prescription upload endpoint
- `src/app/api/upload/review/route.ts` - Review images upload endpoint
- `src/app/api/upload/admin/route.ts` - Admin image upload endpoint
- `src/components/admin/ImageUploader.tsx` - Reusable image upload component
- `src/components/admin/ImageUploader.example.tsx` - Usage examples
- `src/app/shop/[slug]/prescription/steps/Step1PrescriptionForm.tsx` - Prescription upload UI
- `src/app/account/page.tsx` - Review submission with image upload

