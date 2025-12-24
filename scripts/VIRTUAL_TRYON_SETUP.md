# Virtual Try-On Image Setup Guide

## Overview

For the virtual try-on to work properly, glasses images need to be pre-processed to:
1. Remove background (make transparent)
2. Make lenses semi-transparent (sunglasses effect)
3. Crop to fit tightly

## Step 1: Install Python Dependencies

```bash
pip install rembg opencv-python pillow numpy
```

## Step 2: Process All Product Images

Run the batch processing script:

```bash
cd g:\Dev\focusrobinsite
python scripts/process-all-glasses.py
```

This will:
- Scan all product folders in `/public/`
- Process each image (remove bg, transparent lenses)
- Save as `tryon-{original-name}.png`

## Step 3: Add Processed Images to Database

After processing, you need to add the processed images as `TRY_ON_2D` assets for each product variant.

### Option A: Via Admin Panel

1. Go to Admin > Products > Edit Product
2. For each variant, upload the `tryon-*.png` file as "Try-On (2D)" asset

### Option B: Via Database Script

Run this SQL or Prisma script to update assets:

```sql
-- Example: Add TRY_ON_2D asset for a variant
INSERT INTO "ProductAsset" ("id", "variantId", "url", "type", "isPrimary", "createdAt")
VALUES (
  gen_random_uuid(),
  'your-variant-id',
  '/public/ProductFolder/tryon-image.png',
  'TRY_ON_2D',
  false,
  NOW()
);
```

## Step 4: Verify

1. Open a product page
2. Click "Virtual Try-On"
3. Upload a photo
4. Switch between color variants - should show different processed glasses

## Image Processing Details

The Python script does:
1. **Background Removal**: Uses `rembg` (AI-powered) 
2. **Lens Detection**: Finds pixels that are visible but lighter than the frame
3. **Transparency**: Sets lens opacity to 160/255 (62% transparent)
4. **Cropping**: Removes excess transparent padding

## Troubleshooting

### Glasses appear too small
- Increase `SCALE_FACTOR` in virtual-tryon.tsx (default: 1.05)
- Or use the Width Adjustment slider

### Glasses position is wrong
- Adjust the Height Position slider
- Or modify `VERTICAL_OFFSET` in the code

### Lenses not transparent
- The Python script may not be detecting lenses correctly
- Adjust `brightness > 60` threshold in process-all-glasses.py
