# Fixes Applied

## Issue 1: Admin Access ✅ FIXED

### Problem
- User `adaikkappanhariharan@gmail.com` had role `USER` instead of `ADMIN`
- Admin pages were redirecting to home page

### Solution Applied
✅ Updated user role to `ADMIN` in database

### Action Required
**You MUST sign out and sign back in** for the changes to take effect!

The session needs to be refreshed to pick up the new role. After signing back in, you should be able to access `/admin` pages.

### Verify Admin Access
After signing back in, try accessing:
- `/admin` - Should show admin dashboard
- `/admin/products` - Should show products management
- `/admin/users` - Should show user management

---

## Issue 2: Product Images Not Visible ❌ NEEDS FIX

### Problem
- Product images are not showing because image paths in database don't match actual file locations
- Seed data references `/images/products/` but files don't exist there
- Actual images are in `/Products_new/` folder

### Current Status
- **2 products** in database
- **5 missing image files** found
- Images referenced but files don't exist at those paths

### Solution Options

#### Option 1: Update Image Paths via Admin Panel (Recommended)
1. Sign in as admin (after signing out/in)
2. Go to `/admin/products`
3. Click on each product
4. Edit the product variants and update image paths to match actual file locations

**Example:**
- Current path: `/images/products/horizon-blue-main.jpg`
- Should be: `/Products_new/Alfie - Piano Black/t.png` (or appropriate path)

#### Option 2: Use Database Directly
Update `ProductAsset` table with correct paths:
```sql
-- Example: Update image paths
UPDATE "ProductAsset" 
SET url = '/Products_new/Alfie - Piano Black/t.png'
WHERE url = '/images/products/horizon-blue-main.jpg';
```

#### Option 3: Move/Copy Images
Create the expected folder structure and copy images:
```bash
mkdir -p public/images/products
# Copy your product images to public/images/products/
```

### Image Path Guidelines
- Paths should be **relative to `/public` folder**
- Start with `/` (e.g., `/Products_new/Agnes - Dame Wood/t.jpg`)
- Use forward slashes `/` (not backslashes `\`)
- Match actual file names exactly (case-sensitive on some systems)

### Asset Types
- **GALLERY**: Main product images for gallery slider
- **NO_BG**: Transparent background images for 3D effect
- **GLB**: 3D model files
- **HOVER**: Tilted/secondary images for hover effect
- **TRY_ON_2D**: Front-view photos for try-on feature

---

## Issue 3: Missing Products

### Problem
You mentioned adding more products but some are not showing.

### Possible Causes
1. **Products don't have variants** - Products need at least one variant to display
2. **Variants don't have assets** - Each variant needs at least one image asset
3. **Products filtered out** - Check if products have correct gender/category assignments

### How to Check
Run the diagnostic script:
```bash
npx tsx scripts/check-admin-and-products.ts
```

This will show:
- All products in database
- Which products have variants
- Which variants have assets
- Any missing data

### How to Add Products Correctly

1. **Via Admin Panel** (Recommended):
   - Go to `/admin/add` (after signing in as admin)
   - Fill in product details
   - Add at least one variant
   - For each variant, add at least one GALLERY type asset
   - Use correct image paths (relative to `/public`)

2. **Required Fields**:
   - Product name
   - Slug (unique)
   - Base price (in EUR)
   - Category
   - At least one variant with:
     - Name
     - Color name
     - Color hex code
     - SKU
     - At least one asset with type GALLERY

---

## Quick Fix Commands

### Check Admin Status
```bash
npx tsx scripts/check-admin-and-products.ts
```

### Fix Admin Role (if needed)
```bash
npx tsx scripts/fix-admin-role.ts your-email@example.com
```

### Check Image Paths
```bash
npx tsx scripts/check-product-images.ts
```

---

## Next Steps

1. ✅ **Sign out and sign back in** to refresh admin role
2. ⚠️ **Update product image paths** via admin panel or database
3. ⚠️ **Verify all products have variants and assets**
4. ⚠️ **Check that new products you added have proper data**

---

## Need Help?

If products still don't show:
1. Check browser console for image loading errors
2. Verify image paths match actual file locations
3. Ensure products have variants with assets
4. Check product gender/category filters match your shop pages

