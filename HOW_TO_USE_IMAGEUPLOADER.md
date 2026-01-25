# How to Use ImageUploader Component - Step by Step

## ✅ What I Just Did

I've updated your **Category Image Management** form to use the ImageUploader component. Now you can see it in action!

---

## 🎯 How It Works (Step by Step)

### Step 1: Open Admin Form
1. Go to your admin panel
2. Navigate to **Category Images** (or any form with ImageUploader)
3. Click **"Add New Category Image"** or **"Edit"**

### Step 2: Upload Image
1. You'll see an **"Upload Image"** button (instead of URL input)
2. Click the button
3. Select an image from your computer
4. **That's it!** The component automatically:
   - ✅ Uploads to S3
   - ✅ Gets the S3 URL
   - ✅ Fills in the URL field
   - ✅ Shows preview

### Step 3: Save
1. Fill in other fields (Category, Alt Text, Link, etc.)
2. Click **"Save"**
3. Done! ✅

**No manual copying/pasting needed!**

---

## 📸 Visual Guide

### Before (Manual URL):
```
┌─────────────────────────────────┐
│ Desktop Image URL               │
├─────────────────────────────────┤
│ [Enter URL manually...]         │
│                                 │
│ You need to:                    │
│ 1. Upload to S3                 │
│ 2. Copy URL                     │
│ 3. Paste here                   │
└─────────────────────────────────┘
```

### After (ImageUploader):
```
┌─────────────────────────────────┐
│ Desktop Image                   │
├─────────────────────────────────┤
│ [Upload Image] ← Click here     │
│                                 │
│ Select file → Auto uploads!     │
│ ✅ URL auto-filled              │
│ ✅ Preview shown                │
└─────────────────────────────────┘
```

---

## 🔧 How to Add ImageUploader to Other Forms

### Step 1: Import the Component
Add this import at the top of your form file:

```tsx
import { ImageUploader } from '@/components/admin/ImageUploader';
```

### Step 2: Replace URL Input
**Before:**
```tsx
<Input
  value={formData.imageUrl}
  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
  placeholder="Enter image URL"
/>
```

**After:**
```tsx
<ImageUploader
  value={formData.imageUrl}
  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
  folder="categories"  // or "products", "hero", etc.
  label="Image"
  description="Upload your image"
/>
```

### Step 3: Done!
That's it! The form now has automatic upload.

---

## 📋 Component Props

```tsx
<ImageUploader
  value={imageUrl}                    // Current URL (string)
  onChange={(url) => setUrl(url)}     // Callback when URL changes
  folder="categories"                  // S3 folder (required)
  label="Image"                        // Label text (optional)
  description="Upload image"           // Help text (optional)
  maxSizeMB={10}                       // Max file size (optional, default: 10MB)
  accept="image/*"                     // File types (optional)
  showPreview={true}                   // Show preview (optional, default: true)
/>
```

### Available Folders:
- `"products"` - Product images
- `"categories"` - Category banners
- `"hero"` - Hero carousel
- `"instagram"` - Instagram feed
- `"iconic"` - Iconic section
- `"prescription-glasses"` - Prescription glasses landing
- `"gift-banners"` - Gift banners
- `"shapes"` - Glass shapes
- `"lens-images"` - Lens preview images
- `"other"` - General purpose (default)

---

## 🎨 Examples

### Example 1: Category Image
```tsx
<ImageUploader
  value={formData.imageUrl}
  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
  folder="categories"
  label="Desktop Image"
  description="Recommended: 1200x900px"
/>
```

### Example 2: Hero Image
```tsx
<ImageUploader
  value={formData.desktopImageUrl}
  onChange={(url) => setFormData({ ...formData, desktopImageUrl: url })}
  folder="hero"
  label="Desktop Hero Image"
  maxSizeMB={5}
/>
```

### Example 3: Product Image
```tsx
<ImageUploader
  value={formData.galleryImage}
  onChange={(url) => setFormData({ ...formData, galleryImage: url })}
  folder="products"
  label="Gallery Image"
  description="Product gallery image"
/>
```

---

## ✨ Features

### What ImageUploader Does:
- ✅ **Automatic Upload** - Uploads to S3 when you select a file
- ✅ **Auto-fill URL** - Fills in the URL field automatically
- ✅ **Image Preview** - Shows preview of uploaded image
- ✅ **Manual URL Entry** - Still allows pasting URLs manually
- ✅ **Error Handling** - Shows errors if upload fails
- ✅ **File Validation** - Validates file type and size
- ✅ **Loading State** - Shows "Uploading..." while processing

### What You Don't Need to Do:
- ❌ Manually upload to S3
- ❌ Copy URLs
- ❌ Paste URLs
- ❌ Check if file uploaded

---

## 🚀 Try It Now!

1. **Restart your dev server** (if running):
   ```powershell
   npm run dev
   ```

2. **Go to Admin Panel**:
   - Navigate to Category Images
   - Click "Add New Category Image"

3. **Try Uploading**:
   - Click "Upload Image"
   - Select an image
   - Watch it upload automatically!

4. **Check S3**:
   - Go to AWS S3 Console
   - Check your bucket
   - You should see the uploaded file in `categories/` folder

---

## 📝 Forms That Can Use ImageUploader

You can add ImageUploader to:
- ✅ Category Images (Already updated!)
- ⬜ Hero Images
- ⬜ Instagram Images
- ⬜ Iconic Images
- ⬜ Gift Banners
- ⬜ Shop Banners
- ⬜ Glass Shapes
- ⬜ Product Assets
- ⬜ Prescription Lens Images

---

## 🔄 Both Methods Still Work

**Important**: Even with ImageUploader, you can still:
- ✅ Paste URLs manually (if you prefer)
- ✅ Use existing URLs
- ✅ Upload manually to S3 and paste URL

The component shows both:
- Upload button (for automatic)
- URL input field (for manual entry)

**You choose what's easier!**

---

## ❓ Troubleshooting

### Upload Fails
- Check S3 environment variables are set
- Verify you're logged in as admin
- Check file size (max 10MB default)
- Check file type (images only)

### Image Not Showing Preview
- Check URL is valid
- Verify image is publicly accessible in S3
- Check CORS configuration

### URL Not Auto-filling
- Check browser console for errors
- Verify S3 upload succeeded
- Check network tab for API response

---

## 🎉 Summary

**Before:**
1. Upload to S3 manually
2. Copy URL
3. Paste in form
4. Save

**After (with ImageUploader):**
1. Click "Upload Image"
2. Select file
3. Save

**Much easier!** 🚀

