import { Product, ProductColorVariant } from './productData';
import { Prisma } from '@prisma/client';

/**
 * Converts Google Drive share link to direct image URL
 */
function convertGoogleDriveLink(url: string): string {
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch) {
    return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}`;
  }
  const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (driveOpenMatch) {
    return `https://lh3.googleusercontent.com/d/${driveOpenMatch[1]}`;
  }
  const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) {
    return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
  }
  if (url.includes('googleusercontent.com')) {
    return url;
  }
  return url;
}

/**
 * Normalizes image URLs to relative paths for Next.js Image component
 * Converts absolute Windows paths (e.g., G:\Dev\...\public\image.jpg) to relative paths (/image.jpg)
 * Also handles URLs that already start with / or http/https
 * Supports Google Drive links by converting them to direct image URLs
 */
function normalizeImageUrl(url: string): string {
  if (!url) return '';

  // If it's already a relative path starting with /, return as is
  if (url.startsWith('/')) return url;

  // If it's already a full URL (http/https), check for Google Drive links
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.includes('drive.google.com')) {
      return convertGoogleDriveLink(url);
    }
    return url;
  }

  // Handle Windows absolute paths
  // Convert G:\Dev\...\public\image.jpg to /image.jpg
  // Or C:\...\public\images\product.jpg to /images/product.jpg
  const publicPathMatch = url.match(/[\\/]public[\\/](.+)$/i);
  if (publicPathMatch) {
    // Normalize path separators and ensure it starts with /
    return '/' + publicPathMatch[1].replace(/\\/g, '/');
  }

  // If it doesn't match any pattern, try to extract just the filename
  // and assume it's in the root of public folder
  const filenameMatch = url.match(/[\\/]([^\\/]+\.(jpg|jpeg|png|gif|webp|svg|glb))$/i);
  if (filenameMatch) {
    return '/' + filenameMatch[1];
  }

  // Fallback: return as is (might be a relative path without leading /)
  return url.startsWith('./') ? url.slice(1) : '/' + url;
}

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    ProductVariant: {
      include: {
        ProductAsset: true;
      };
    };
    highlights: true;
  };
}>;

type ProductWithReviews = Prisma.ProductGetPayload<{
  include: {
    ProductVariant: {
      include: {
        ProductAsset: true;
      };
    };
    Review: {
      include: {
        User: true;
      };
    };
  };
}>;

/**
 * Maps Prisma product data to the frontend Product type
 */
export function mapPrismaProductToProduct(prismaProduct: ProductWithRelations): Product {
  // Get the primary image for each variant
  const variants: ProductColorVariant[] = prismaProduct.ProductVariant.map((variant) => {
    // Find primary image (first GALLERY image or first asset)
    const primaryAsset = variant.ProductAsset.find((asset) => asset.isPrimary)
      || variant.ProductAsset.find((asset) => asset.type === 'GALLERY')
      || variant.ProductAsset[0];

    // Get gallery images for the main image array
    const galleryImages = variant.ProductAsset
      .filter((asset) => asset.type === 'GALLERY')
      .map((asset) => normalizeImageUrl(asset.url));

    // Get hover image for tilted view
    const hoverAsset = variant.ProductAsset.find((asset) => asset.type === 'HOVER');
    const hoverImage = hoverAsset ? normalizeImageUrl(hoverAsset.url) : (galleryImages[1] || galleryImages[0] || '');

    // Get NO_BG image for bestseller/landing page 3D effect
    const noBgAsset = variant.ProductAsset.find((asset) => asset.type === 'NO_BG');
    const noBgImage = noBgAsset ? normalizeImageUrl(noBgAsset.url) : undefined;

    // Get TRY_ON_2D image for virtual try-on feature
    const tryOnAsset = variant.ProductAsset.find((asset) => asset.type === 'TRY_ON_2D');
    const tryOnImage = tryOnAsset ? normalizeImageUrl(tryOnAsset.url) : undefined;

    const primaryUrl = primaryAsset ? normalizeImageUrl(primaryAsset.url) : (galleryImages[0] || '');

    return {
      name: variant.name,
      hex: variant.colorHex,
      sku: variant.sku,
      stock: variant.stock,
      thumbnail: primaryUrl,
      tilted: hoverImage,
      nobg: noBgImage,
      images: galleryImages.length > 0 ? galleryImages : (primaryUrl ? [primaryUrl] : []),
      tryOn: tryOnImage,
    };
  });

  // Calculate price with discount
  const basePrice = prismaProduct.basePrice != null ? Number(prismaProduct.basePrice) : 0;
  const discountPct = prismaProduct.discountPct || 0;
  const hasDiscount = discountPct > 0;

  const originalPrice = `€${basePrice.toFixed(2)}`;
  const discountedPrice = hasDiscount
    ? basePrice * (1 - discountPct / 100)
    : basePrice;
  const finalPrice = `€${discountedPrice.toFixed(2)}`;

  // Generate a URL-safe slug from product name if slug doesn't exist
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  const productSlug = prismaProduct.slug || generateSlug(prismaProduct.name);
  const productId = prismaProduct.id || prismaProduct.slug || productSlug;

  return {
    id: productId, // Use database ID or slug as fallback
    slug: productSlug, // URL-friendly slug for routing
    name: prismaProduct.name,
    price: finalPrice, // Final price after discount
    originalPrice: hasDiscount ? originalPrice : undefined, // Original price if discounted
    discountPct: hasDiscount ? discountPct : undefined, // Discount percentage if applicable
    cashback: prismaProduct.cashbackAmount && Number(prismaProduct.cashbackAmount) > 0
      ? `€${Number(prismaProduct.cashbackAmount).toFixed(2)}`
      : undefined, // Cashback amount in Euros (only if > 0)
    variants,
    categories: Array.isArray(prismaProduct.gender)
      ? prismaProduct.gender.map(g => g === 'MEN' ? 'Men' : g === 'WOMEN' ? 'Women' : g === 'KIDS' ? 'Kids' : 'Unisex')
      : ['Unisex'],
    warranty: prismaProduct.warranty || '2 Years Warranty',
    description: prismaProduct.description,
    lensMaterial: prismaProduct.lensMaterial || 'Polycarbonate', // From database
    frameMaterial: prismaProduct.frameMaterial,
    uvProtection: prismaProduct.uvProtection,
    averageRating: prismaProduct.averageRating || undefined,
    reviewCount: prismaProduct.reviewCount || undefined,
    size: {
      lensWidth: `${prismaProduct.lensWidth != null ? prismaProduct.lensWidth : 0}mm`,
      bridge: `${prismaProduct.bridgeWidth != null ? prismaProduct.bridgeWidth : 0}mm`,
      temple: `${prismaProduct.templeLength != null ? prismaProduct.templeLength : 0}mm`,
    },
    weight: prismaProduct.weightBg,
    // Dimension fields for ProductDimensions component
    frameWidth: prismaProduct.frameWidth != null ? Number(prismaProduct.frameWidth) : 0,
    lensWidth: prismaProduct.lensWidth != null ? Number(prismaProduct.lensWidth) : 0,
    lensHeight: prismaProduct.lensHeight != null ? Number(prismaProduct.lensHeight) : 0,
    bridgeWidth: prismaProduct.bridgeWidth != null ? Number(prismaProduct.bridgeWidth) : 0,
    templeLength: prismaProduct.templeLength != null ? Number(prismaProduct.templeLength) : 0,
    // Dynamic Product Features
    isPolarized: prismaProduct.isPolarized,
    isUVProtection: prismaProduct.isUVProtection,
    isHydrophobic: prismaProduct.isHydrophobic,
    isAntiScratch: prismaProduct.isAntiScratch,
    isBioBased: prismaProduct.isBioBased,
    customFeatures: prismaProduct.customFeatures || [],
    // Product Highlights
    showHighlights: prismaProduct.showHighlights || false,
    highlights: prismaProduct.highlights ? prismaProduct.highlights.map(h => ({
      id: h.id,
      title: h.title,
      description: h.description,
      imageUrl: normalizeImageUrl(h.imageUrl),
      order: h.order
    })).sort((a, b) => (a.order || 0) - (b.order || 0)) : [],
  };
}

export type { ProductWithRelations, ProductWithReviews };
