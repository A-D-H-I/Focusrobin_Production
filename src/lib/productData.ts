// src/lib/productData.ts
// Type definitions for Product and ProductColorVariant
// These types are used throughout the application for type safety

export interface ProductColorVariant {
  name: string;
  hex: string;
  sku?: string; // SKU from database
  stock?: number; // Available stock quantity
  thumbnail: string; // Thumbnail image (t.jpg)
  tilted: string; // Tilted version for hover
  nobg?: string; // Transparent background image for 3D effect (NO_BG asset)
  images: string[]; // Gallery images (3-4 images)
  tryOn?: string; // Photo Try-On (Front View) image for virtual try-on feature (TRY_ON_2D asset)
}

export interface Product {
  id: string;
  slug?: string; // URL-friendly slug for routing
  name: string;
  price: string; // Final price (after discount if applicable)
  originalPrice?: string; // Original price before discount
  discountPct?: number; // Discount percentage (0-100)
  cashback: string;
  variants: ProductColorVariant[];
  categories: string[];
  warranty: string;
  description: string;
  lensMaterial: string;
  frameMaterial: string;
  uvProtection: string;
  averageRating?: number; // Average rating from reviews
  reviewCount?: number; // Total number of reviews
  size: {
    lensWidth: string;
    bridge: string;
    temple: string;
  };
  weight?: number; // Weight in grams
  // Dimension fields for ProductDimensions component
  frameWidth?: number;
  lensHeight?: number;
  bridgeWidth?: number;
  templeLength?: number;
  // Dynamic Product Features
  isPolarized?: boolean;
  isUVProtection?: boolean;
  isHydrophobic?: boolean;
  isAntiScratch?: boolean;
  isBioBased?: boolean;

  customFeatures?: string[];

  // Product Highlights
  showHighlights?: boolean;
  highlights?: ProductHighlight[];
}

export interface ProductHighlight {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  order?: number;
}
