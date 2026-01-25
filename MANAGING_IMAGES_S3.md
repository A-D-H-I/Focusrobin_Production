# Managing Existing Images & S3 Upload Options

This guide explains how to handle existing images and upload new images to S3.

## For Existing Images (Already in Database)

You have two options:

### Option 1: Keep Using Current URLs (Recommended Initially)
- **No migration needed**: Your existing image URLs (Google Drive, Dropbox, or direct links) will continue to work
- The database already stores URLs as strings
- New uploads will automatically use S3 URLs
- Gradually migrate images as you edit/update them

### Option 2: Migrate to S3
If you want to move existing images to S3, you can:
1. Download images from current sources
2. Upload them to S3 using one of the methods below
3. Update database URLs to point to S3

## Ways to Upload Images to S3

### Method 1: Using the ImageUploader Component (Best for Admins)

Use the `ImageUploader` component in your admin forms:

```tsx
import { ImageUploader } from "@/components/admin/ImageUploader";

function AdminForm() {
  const [imageUrl, setImageUrl] = useState("");

  return (
    <ImageUploader
      value={imageUrl}
      onChange={setImageUrl}
      folder="products"
      label="Product Image"
    />
  );
}
```

**Advantages:**
- ✅ Upload directly from browser
- ✅ Shows preview
- ✅ Handles errors
- ✅ Organized into folders
- ✅ URL is automatically returned

### Method 2: AWS S3 Console (Manual Upload)

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Navigate to your bucket
3. **Drag and drop files** or click "Upload"
4. Select folder/prefix (e.g., `products/`, `categories/`)
5. Upload files
6. After upload, click on the file → Copy URL
7. Paste URL in your database

**Note**: Make sure files have public read permissions (set via bucket policy).

### Method 3: AWS CLI (Bulk Upload)

For uploading many images at once:

```bash
# Install AWS CLI first (if not installed)
# Windows: winget install Amazon.AWSCLI

# Configure AWS credentials
aws configure

# Upload single file
aws s3 cp image.jpg s3://your-bucket-name/products/image.jpg --acl public-read

# Upload entire folder
aws s3 cp ./images/ s3://your-bucket-name/products/ --recursive --acl public-read

# Get public URL format
# https://your-bucket-name.s3.your-region.amazonaws.com/products/image.jpg
```

### Method 4: S3 Browser Tools (GUI)

Use desktop applications for easier management:
- **S3 Browser** (Windows) - Free
- **Cyberduck** (Cross-platform) - Free
- **CloudBerry Explorer** - Free tier available

These tools offer:
- Drag and drop
- Batch uploads
- Folder synchronization
- Visual file management

### Method 5: Programmatic Upload Script

Create a migration script to bulk-upload existing images:

```typescript
// scripts/migrate-images-to-s3.ts
import { uploadToS3 } from '@/lib/s3';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import https from 'https';

async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
  });
}

async function migrateProductImages() {
  const products = await prisma.product.findMany({
    include: { ProductVariant: { include: { ProductAsset: true } } }
  });

  for (const product of products) {
    for (const variant of product.ProductVariant) {
      for (const asset of variant.ProductAsset) {
        if (!asset.url.includes('s3.amazonaws.com')) {
          try {
            // Download image
            const imageBuffer = await downloadImage(asset.url);
            
            // Upload to S3
            const result = await uploadToS3(
              imageBuffer,
              'products',
              `${variant.sku}-${asset.type}.jpg`,
              'image/jpeg'
            );

            if (result) {
              // Update database
              await prisma.productAsset.update({
                where: { id: asset.id },
                data: { url: result.url }
              });
              console.log(`✓ Migrated: ${asset.id}`);
            }
          } catch (error) {
            console.error(`✗ Failed: ${asset.id}`, error);
          }
        }
      }
    }
  }
}

migrateProductImages().then(() => console.log('Migration complete'));
```

Run with:
```bash
npx tsx scripts/migrate-images-to-s3.ts
```

## Recommended Workflow

### For New Images
1. Use the `ImageUploader` component in admin forms
2. Upload → Get S3 URL → Save to database automatically
3. Done! ✅

### For Existing Images
Choose based on your situation:

**If you have few images (< 50):**
- Use AWS S3 Console (drag & drop)
- Copy URLs manually
- Update database records

**If you have many images (> 50):**
- Use AWS CLI or S3 Browser for batch upload
- Or create a migration script

**If images are working fine:**
- Don't migrate yet
- Only upload new images to S3
- Migrate gradually when editing products

## Example: Updating Category Images

### Before (Manual URL)
```tsx
<Input
  value={imageUrl}
  onChange={(e) => setImageUrl(e.target.value)}
  placeholder="https://example.com/image.jpg"
/>
```

### After (S3 Upload)
```tsx
<ImageUploader
  value={imageUrl}
  onChange={setImageUrl}
  folder="categories"
  label="Category Image"
/>
```

The `ImageUploader`:
- Lets user upload file → Uploads to S3 → Returns S3 URL
- Still allows manual URL entry for existing images
- Shows preview of current image

## URL Format

Your S3 URLs will look like:
```
https://your-bucket-name.s3.eu-west-1.amazonaws.com/folder/timestamp-random-filename.jpg
```

Example:
```
https://focusrobin-images.s3.eu-west-1.amazonaws.com/products/1738012345-abc123-blue-frame.jpg
```

## Database Compatibility

✅ **No database changes needed!**
- Your database already stores image URLs as strings
- S3 URLs work exactly like any other URL
- Mix of old URLs and S3 URLs is fine
- Migrate at your own pace

## Summary

**For adding new images:**
- Use `ImageUploader` component in admin forms
- It handles S3 upload and returns the URL automatically

**For existing images:**
- Keep current URLs (they still work)
- OR manually upload to S3 via console/drag-drop
- OR bulk upload using AWS CLI
- OR create migration script for automation

**Best approach:**
1. Set up S3 (you already have!)
2. Update admin forms to use `ImageUploader` component
3. New images → automatically to S3
4. Existing images → migrate gradually or leave as-is

