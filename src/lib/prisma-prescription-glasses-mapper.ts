/**
 * Maps Prisma PrescriptionGlasses data to frontend Product type
 */
import { calculateRetailPrice } from './price-utils';

export function mapPrismaPrescriptionGlassesToProduct(prismaGlasses: any): any {
  // Apply margin calculation using centralized price utility
  const rawBasePrice = prismaGlasses.basePrice != null ? Number(prismaGlasses.basePrice) : 0;
  const effectiveBasePrice = calculateRetailPrice(rawBasePrice, prismaGlasses.brand || 'FocusRobin');

  const basePrice = effectiveBasePrice;
  const discountPctFromDb = prismaGlasses.discountPct || 0;
  const finalPrice = discountPctFromDb > 0 
    ? basePrice * (1 - discountPctFromDb / 100)
    : basePrice;
  const cashback = prismaGlasses.cashbackAmount ? Number(prismaGlasses.cashbackAmount) : 0;

  // The original crossed-out price must be 30% higher than the final selling price
  const originalPriceValue = finalPrice * 1.30;
  const originalPrice = `€${originalPriceValue.toFixed(2)}`;
  
  // The UI discount badge will naturally show ~23%
  // User requested: do not show the percentage badge, just the crossed out price
  const computedDiscountPct = undefined;

  // Map variants
  const variants = (prismaGlasses.PrescriptionGlassesVariant || []).map((variant: any) => {
    const assets = variant.PrescriptionGlassesAsset || [];

    // Find primary gallery image or first gallery image
    const primaryGalleryAsset = assets.find((a: any) => a.type === 'GALLERY' && a.isPrimary);
    const firstGalleryAsset = assets.find((a: any) => a.type === 'GALLERY');
    const mainImage = primaryGalleryAsset?.url || firstGalleryAsset?.url || '';

    // Get all gallery images
    const galleryImages = assets
      .filter((a: any) => a.type === 'GALLERY')
      .map((a: any) => a.url);

    // Get other asset types
    const noBgAsset = assets.find((a: any) => a.type === 'NO_BG');
    const glbAsset = assets.find((a: any) => a.type === 'GLB');
    const tryonAsset = assets.find((a: any) => a.type === 'TRY_ON_2D');
    const hoverAsset = assets.find((a: any) => a.type === 'HOVER');

    return {
      id: variant.id,
      name: variant.colorName,
      color: variant.colorHex,
      lensColor: variant.lensColor,
      images: galleryImages.length > 0 ? galleryImages : [mainImage].filter(Boolean),
      mainImage,
      hoverImage: hoverAsset?.url,
      noBgImage: noBgAsset?.url,
      glbModel: glbAsset?.url,
      tryonImage: tryonAsset?.url,
      stock: variant.stock || 0,
      sku: variant.sku,
      textureImageUrl: variant.textureImageUrl || undefined,
      price: variant.price ? Number(variant.price) : finalPrice,
    };
  });

  return {
    id: prismaGlasses.id,
    name: prismaGlasses.name,
    brand: prismaGlasses.brand || '',
    slug: prismaGlasses.slug,
    price: `€${finalPrice.toFixed(2)}`,
    originalPrice: originalPrice && `€${finalPrice.toFixed(2)}` !== originalPrice ? originalPrice : undefined,
    discountPct: computedDiscountPct,
    cashback: cashback > 0 ? cashback.toFixed(2) : '0',
    variants,
    categories: Array.from(new Set(
      Array.isArray(prismaGlasses.gender) && prismaGlasses.gender.length > 0
        ? prismaGlasses.gender.map((g: string) => g === 'MEN' ? 'Men' : g === 'WOMEN' ? 'Women' : g === 'KIDS' ? 'Kids' : 'Unisex')
        : [prismaGlasses.Category?.name || 'Unisex']
    )),
    tags: prismaGlasses.tags || [],
    warranty: '1 Year',
    description: prismaGlasses.description || '',
    lensMaterial: prismaGlasses.lensMaterial || undefined,
    frameMaterial: prismaGlasses.frameMaterial || undefined,
    uvProtection: prismaGlasses.uvProtection || undefined,
    averageRating: prismaGlasses.averageRating || 0,
    reviewCount: prismaGlasses.reviewCount || 0,
    size: {
      lensWidth: prismaGlasses.lensWidth ? `${prismaGlasses.lensWidth}mm` : 'N/A',
      bridge: prismaGlasses.bridgeWidth ? `${prismaGlasses.bridgeWidth}mm` : 'N/A',
      temple: prismaGlasses.templeLength ? `${prismaGlasses.templeLength}mm` : 'N/A',
    },
    weight: prismaGlasses.weightBg || undefined,
    frameWidth: prismaGlasses.frameWidth || undefined,
    lensWidth: prismaGlasses.lensWidth || undefined,
    lensHeight: prismaGlasses.lensHeight || undefined,
    bridgeWidth: prismaGlasses.bridgeWidth || undefined,
    templeLength: prismaGlasses.templeLength || undefined,
  };
}

