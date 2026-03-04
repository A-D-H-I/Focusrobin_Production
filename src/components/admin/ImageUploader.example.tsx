/**
 * Example: How to use ImageUploader component in admin forms
 * 
 * This shows how to replace URL input fields with the ImageUploader component
 * that automatically uploads to S3 and stores the URL.
 */

import { ImageUploader } from "./ImageUploader";
import { useState } from "react";

// Example 1: Category Image Form
export function CategoryImageFormExample() {
  const [imageUrl, setImageUrl] = useState("");
  const [mobileImageUrl, setMobileImageUrl] = useState("");

  return (
    <form className="space-y-4">
      {/* Desktop Image - Upload to S3 */}
      <ImageUploader
        value={imageUrl}
        onChange={setImageUrl}
        folder="categories"
        label="Desktop Image"
        description="Upload desktop category image (1200x900px recommended)"
        maxSizeMB={10}
      />

      {/* Mobile Image - Upload to S3 */}
      <ImageUploader
        value={mobileImageUrl}
        onChange={setMobileImageUrl}
        folder="categories"
        label="Mobile & Tablet Image"
        description="Upload mobile/tablet category image (1080x1920px recommended)"
        maxSizeMB={10}
      />
    </form>
  );
}

// Example 2: Hero Image Form
export function HeroImageFormExample() {
  const [desktopImageUrl, setDesktopImageUrl] = useState("");
  const [mobileImageUrl, setMobileImageUrl] = useState("");

  return (
    <form className="space-y-4">
      <ImageUploader
        value={desktopImageUrl}
        onChange={setDesktopImageUrl}
        folder="hero"
        label="Desktop Hero Image"
        description="Upload hero image for desktop view"
      />

      <ImageUploader
        value={mobileImageUrl}
        onChange={setMobileImageUrl}
        folder="hero"
        label="Mobile Hero Image"
        description="Upload hero image for mobile view"
      />
    </form>
  );
}

// Example 3: Product Asset Upload
export function ProductAssetUploadExample() {
  const [galleryImage, setGalleryImage] = useState("");
  const [noBgImage, setNoBgImage] = useState("");
  const [glbModel, setGlbModel] = useState("");

  return (
    <div className="space-y-4">
      <ImageUploader
        value={galleryImage}
        onChange={setGalleryImage}
        folder="products"
        label="Gallery Image"
        description="Product gallery image"
        accept="image/*"
      />

      <ImageUploader
        value={noBgImage}
        onChange={setNoBgImage}
        folder="products"
        label="No Background Image"
        description="Product image with transparent background"
        accept="image/*"
      />

      <ImageUploader
        value={glbModel}
        onChange={setGlbModel}
        folder="products"
        label="3D Model (GLB)"
        description="3D model file for AR try-on"
        accept="model/gltf-binary,.glb"
        maxSizeMB={20}
      />
    </div>
  );
}

// Example 4: Lens Image Upload
export function LensImageUploadExample() {
  const [lensImageUrl, setLensImageUrl] = useState("");

  return (
    <ImageUploader
      value={lensImageUrl}
      onChange={setLensImageUrl}
      folder="lens-images"
      label="Lens Preview Image"
      description="Upload lens color preview image"
    />
  );
}

// Example 5: Instagram Image Upload
export function InstagramImageUploadExample() {
  const [imageUrl, setImageUrl] = useState("");

  return (
    <ImageUploader
      value={imageUrl}
      onChange={setImageUrl}
      folder="instagram"
      label="Instagram Image"
      description="Upload Instagram feed image"
    />
  );
}



















