import { Product, ProductColorVariant } from './productData';
import { Prisma } from '@prisma/client';

/**
 * Normalizes image URLs to relative paths for Next.js Image component
 * Converts absolute Windows paths (e.g., G:\Dev\...\public\image.jpg) to relative paths (/image.jpg)
 * Also handles URLs that already start with / or http/https
 */
function normalizeImageUrl(url: string): string {
  if (!url) return '';
  
  // If it's already a relative path starting with /, return as is
  if (url.startsWith('/')) return url;
  
  // If it's already a full URL (http/https), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
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

    const primaryUrl = primaryAsset ? normalizeImageUrl(primaryAsset.url) : (galleryImages[0] || '');

    return {
      name: variant.name,
      hex: variant.colorHex,
      sku: variant.sku,
      thumbnail: primaryUrl,
      tilted: hoverImage,
      nobg: noBgImage,
      images: galleryImages.length > 0 ? galleryImages : (primaryUrl ? [primaryUrl] : []),
    };
  });

  // Calculate price with discount
  const basePrice = Number(prismaProduct.basePrice);
  const discountPct = prismaProduct.discountPct || 0;
  const hasDiscount = discountPct > 0;
  
  const originalPrice = `€${basePrice.toFixed(2)}`;
  const discountedPrice = hasDiscount 
    ? basePrice * (1 - discountPct / 100)
    : basePrice;
  const finalPrice = `€${discountedPrice.toFixed(2)}`;

  return {
    id: prismaProduct.slug, // Use slug as id for URL routing
    name: prismaProduct.name,
    price: finalPrice, // Final price after discount
    originalPrice: hasDiscount ? originalPrice : undefined, // Original price if discounted
    discountPct: hasDiscount ? discountPct : undefined, // Discount percentage if applicable
    cashback: '5%', // Default or calculate from offer if exists
    variants,
    categories: Array.isArray(prismaProduct.gender) 
      ? prismaProduct.gender.map(g => g === 'MEN' ? 'Men' : g === 'WOMEN' ? 'Women' : g === 'KIDS' ? 'Kids' : 'Unisex')
      : ['Unisex'],
    warranty: '2 Years', // Default warranty
    description: prismaProduct.description,
    lensMaterial: prismaProduct.lensMaterial || 'Polycarbonate', // From database
    frameMaterial: prismaProduct.frameMaterial,
    uvProtection: prismaProduct.uvProtection,
    averageRating: prismaProduct.averageRating || undefined,
    reviewCount: prismaProduct.reviewCount || undefined,
    size: {
      lensWidth: `${prismaProduct.lensWidth}mm`,
      bridge: `${prismaProduct.bridgeWidth}mm`,
      temple: `${prismaProduct.templeLength}mm`,
    },
    weight: prismaProduct.weightBg,
    // Dimension fields for ProductDimensions component
    frameWidth: Number(prismaProduct.frameWidth),
    lensWidth: Number(prismaProduct.lensWidth),
    lensHeight: Number(prismaProduct.lensHeight),
    bridgeWidth: Number(prismaProduct.bridgeWidth),
    templeLength: Number(prismaProduct.templeLength),
  };
}

export type { ProductWithRelations, ProductWithReviews };

