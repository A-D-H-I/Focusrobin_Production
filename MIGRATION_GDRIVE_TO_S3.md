# Migration from Google Drive to AWS S3

This guide will help you migrate all images from Google Drive to AWS S3.

## Why Migrate to S3?

✅ **Faster** - Direct CDN delivery, lower latency
✅ **More Reliable** - 99.99% uptime SLA
✅ **Better Performance** - No Google Drive API rate limits
✅ **Scalable** - Handles unlimited traffic
✅ **Cost Effective** - Pay only for what you use
✅ **Professional** - Industry standard for e-commerce

## Pre-Migration Checklist

- [x] AWS S3 bucket created
- [x] Environment variables configured
- [x] S3 upload endpoints implemented
- [x] ImageUploader component ready
- [ ] Download all existing images from Google Drive
- [ ] Upload images to S3
- [ ] Update database URLs
- [ ] Test all images load correctly
- [ ] Remove Google Drive integration (optional)

## Step-by-Step Migration

### Phase 1: Download Images from Google Drive

#### Option A: Manual Download (For few images)
1. Open your Google Drive folder
2. Select all images
3. Download as ZIP
4. Extract to a local folder (e.g., `D:\images-backup`)

#### Option B: Google Drive Desktop App
1. Install Google Drive Desktop
2. Sync your images folder
3. Images will be in `C:\Users\YourName\Google Drive\images`

#### Option C: Using rclone (For bulk download)
```bash
# Install rclone
winget install Rclone.Rclone

# Configure Google Drive
rclone config

# Download all images
rclone copy "gdrive:YourFolder" "D:\images-backup" --progress
```

### Phase 2: Organize Images Locally

Organize your downloaded images into folders matching your S3 structure:

```
images-backup/
├── products/
│   ├── gallery/
│   ├── nobg/
│   ├── tryon/
│   └── hover/
├── categories/
├── hero/
├── instagram/
├── iconic/
├── prescription-glasses/
├── gift-banners/
└── shapes/
```

### Phase 3: Upload to S3

#### Method 1: Using AWS S3 Console (Drag & Drop)

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Open your bucket (e.g., `focusrobin-images`)
3. Create folders: `products/`, `categories/`, etc.
4. **Drag and drop** images into respective folders
5. Wait for upload to complete
6. Verify images are visible

#### Method 2: Using AWS CLI (Recommended for Bulk)

```powershell
# Configure AWS CLI (one time)
aws configure
# Enter: Access Key ID, Secret Key, Region (eu-west-1), Output (json)

# Upload products folder
aws s3 sync "D:\images-backup\products" s3://focusrobin-images/products --acl public-read --content-type "image/jpeg"

# Upload categories
aws s3 sync "D:\images-backup\categories" s3://focusrobin-images/categories --acl public-read

# Upload hero images
aws s3 sync "D:\images-backup\hero" s3://focusrobin-images/hero --acl public-read

# Upload all at once
aws s3 sync "D:\images-backup" s3://focusrobin-images --acl public-read --exclude "*.DS_Store" --exclude "thumbs.db"
```

#### Method 3: Using S3 Browser (GUI - Easiest)

1. Download [S3 Browser](https://s3browser.com/) (Free for Windows)
2. Add Account → Enter AWS credentials
3. Navigate to your bucket
4. **Drag and drop** entire folders
5. Right-click → "Make Public" if needed
6. Copy URLs easily

### Phase 4: Get S3 URLs

After upload, your image URLs will be:

```
https://focusrobin-images.s3.eu-west-1.amazonaws.com/products/image.jpg
```

#### Quick URL Generator Script

Create `scripts/generate-s3-urls.ts`:

```typescript
// Generate S3 URLs for migrated images
const bucket = "focusrobin-images";
const region = "eu-west-1";

function getS3Url(folder: string, filename: string): string {
  return `https://${bucket}.s3.${region}.amazonaws.com/${folder}/${filename}`;
}

// Example usage
const urls = {
  product1Gallery: getS3Url("products/gallery", "blue-frame-001.jpg"),
  product1NoBg: getS3Url("products/nobg", "blue-frame-001-nobg.png"),
  categoryMen: getS3Url("categories", "men-banner.jpg"),
};

console.log(urls);
```

### Phase 5: Update Database URLs

#### Option A: SQL Script (Direct Update)

```sql
-- Example: Update product assets
UPDATE "ProductAsset" 
SET url = REPLACE(url, 
  'https://drive.google.com/uc?export=view&id=', 
  'https://focusrobin-images.s3.eu-west-1.amazonaws.com/products/'
)
WHERE url LIKE '%drive.google.com%';

-- Update category images
UPDATE "CategoryImage"
SET "imageUrl" = REPLACE("imageUrl",
  'OLD_GDRIVE_URL',
  'NEW_S3_URL'
);

-- Update hero images
UPDATE "HeroImage"
SET "desktopImageUrl" = REPLACE("desktopImageUrl",
  'OLD_URL',
  'NEW_S3_URL'
);
```

#### Option B: Migration Script (Safer)

Create `scripts/migrate-database-urls.ts`:

```typescript
import { prisma } from '@/lib/prisma';

const S3_BASE = 'https://focusrobin-images.s3.eu-west-1.amazonaws.com';

async function migrateProductAssets() {
  const assets = await prisma.productAsset.findMany({
    where: {
      url: { contains: 'drive.google.com' }
    }
  });

  console.log(`Found ${assets.length} assets to migrate`);

  for (const asset of assets) {
    // Map old URL to new S3 URL
    // You need to create this mapping based on your file structure
    const newUrl = mapGDriveToS3(asset.url);
    
    await prisma.productAsset.update({
      where: { id: asset.id },
      data: { url: newUrl }
    });
    
    console.log(`✓ Updated: ${asset.id}`);
  }
}

async function migrateCategoryImages() {
  const categories = await prisma.categoryImage.findMany({
    where: {
      imageUrl: { contains: 'drive.google.com' }
    }
  });

  for (const category of categories) {
    const newUrl = `${S3_BASE}/categories/${category.category.toLowerCase()}.jpg`;
    
    await prisma.categoryImage.update({
      where: { id: category.id },
      data: { imageUrl: newUrl }
    });
    
    console.log(`✓ Updated category: ${category.category}`);
  }
}

async function migrateHeroImages() {
  const heroes = await prisma.heroImage.findMany({
    where: {
      OR: [
        { desktopImageUrl: { contains: 'drive.google.com' } },
        { mobileImageUrl: { contains: 'drive.google.com' } }
      ]
    }
  });

  for (const hero of heroes) {
    const updates: any = {};
    
    if (hero.desktopImageUrl.includes('drive.google.com')) {
      updates.desktopImageUrl = `${S3_BASE}/hero/desktop-${hero.order}.jpg`;
    }
    
    if (hero.mobileImageUrl.includes('drive.google.com')) {
      updates.mobileImageUrl = `${S3_BASE}/hero/mobile-${hero.order}.jpg`;
    }
    
    await prisma.heroImage.update({
      where: { id: hero.id },
      data: updates
    });
    
    console.log(`✓ Updated hero: ${hero.id}`);
  }
}

// Run all migrations
async function main() {
  console.log('Starting migration...\n');
  
  await migrateProductAssets();
  await migrateCategoryImages();
  await migrateHeroImages();
  
  console.log('\n✅ Migration complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run with:
```bash
npx tsx scripts/migrate-database-urls.ts
```

#### Option C: Manual Update via Admin Panel

For small numbers of images:
1. Go to your admin panel
2. Edit each record
3. Use the new `ImageUploader` component
4. Upload or paste new S3 URL
5. Save

### Phase 6: Test Everything

```typescript
// Test script to verify all images load
import { prisma } from '@/lib/prisma';

async function testImages() {
  // Get sample of images
  const assets = await prisma.productAsset.findMany({ take: 10 });
  
  for (const asset of assets) {
    try {
      const response = await fetch(asset.url, { method: 'HEAD' });
      if (response.ok) {
        console.log(`✓ ${asset.url}`);
      } else {
        console.error(`✗ ${asset.url} - Status: ${response.status}`);
      }
    } catch (error) {
      console.error(`✗ ${asset.url} - Error: ${error.message}`);
    }
  }
}

testImages();
```

### Phase 7: Clean Up (Optional)

After successful migration and testing:

1. **Remove Google Drive Integration Code**
   - Delete `src/lib/normalize-image-url.ts` (if exists)
   - Remove Google Drive URL conversion functions
   - Clean up any Google Drive specific code

2. **Update Documentation**
   - Update README to mention S3 instead of Google Drive
   - Remove Google Drive setup instructions

3. **Backup Old Images**
   - Keep a backup of downloaded images for 30 days
   - After verification, you can delete from Google Drive

## Quick Migration Checklist

- [ ] Download all images from Google Drive
- [ ] Organize into folders (products, categories, hero, etc.)
- [ ] Upload to S3 using AWS CLI or S3 Browser
- [ ] Verify all images are in S3 and publicly accessible
- [ ] Create URL mapping (old → new)
- [ ] Run database migration script
- [ ] Test random sample of images
- [ ] Test website thoroughly (all pages)
- [ ] Monitor for broken images for 1-2 days
- [ ] Clean up Google Drive (after verification)
- [ ] Update admin forms to use ImageUploader component

## Estimated Time

- **Small site** (< 100 images): 1-2 hours
- **Medium site** (100-500 images): 2-4 hours  
- **Large site** (500+ images): 4-8 hours

Most time is spent on organizing and uploading images. The database update is quick with scripts.

## Troubleshooting

### Images not loading after migration
- Check bucket policy allows public read
- Verify ACL is set to `public-read`
- Check CORS configuration
- Verify file extensions are correct

### Database update failed
- Make backup before updating
- Test on staging database first
- Update in batches (e.g., 100 at a time)

### Some images missing
- Check source folder organization
- Verify upload completed successfully
- Check S3 console for uploaded files

## Rollback Plan

If something goes wrong:
1. Database URLs are still stored (can rollback)
2. Google Drive images still exist
3. Revert database changes
4. Or use mixed URLs temporarily

## Post-Migration

### Update Admin Forms

Replace URL inputs with `ImageUploader`:

```tsx
// Before
<Input
  value={imageUrl}
  onChange={(e) => setImageUrl(e.target.value)}
/>

// After  
<ImageUploader
  value={imageUrl}
  onChange={setImageUrl}
  folder="products"
  label="Product Image"
/>
```

### Future Image Uploads

All new images will automatically go to S3 via the `ImageUploader` component. No more manual URL management!

## Need Help?

See:
- `AWS_S3_SETUP.md` - S3 configuration
- `MANAGING_IMAGES_S3.md` - Daily usage guide
- AWS S3 Documentation - https://docs.aws.amazon.com/s3/

