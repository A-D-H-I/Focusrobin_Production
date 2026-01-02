/**
 * Maps Prisma PrescriptionGlasses data to frontend Product type
 */
export function mapPrismaPrescriptionGlassesToProduct(prismaGlasses: any): any {
  const basePrice = Number(prismaGlasses.basePrice);
  const discountPct = prismaGlasses.discountPct || 0;
  const finalPrice = basePrice * (1 - discountPct / 100);
  const cashback = prismaGlasses.cashbackAmount ? Number(prismaGlasses.cashbackAmount) : 0;

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
      price: variant.price ? Number(variant.price) : finalPrice,
    };
  });

  return {
    id: prismaGlasses.id,
    name: prismaGlasses.name,
    slug: prismaGlasses.slug,
    price: finalPrice.toFixed(2),
    originalPrice: discountPct > 0 ? basePrice.toFixed(2) : undefined,
    discountPct: discountPct > 0 ? discountPct : undefined,
    cashback: cashback > 0 ? cashback.toFixed(2) : '0',
    variants,
    categories: prismaGlasses.gender || [],
    warranty: '1 Year',
    description: prismaGlasses.description || '',
    lensMaterial: prismaGlasses.lensMaterial || 'Polycarbonate',
    frameMaterial: prismaGlasses.frameMaterial || '',
    uvProtection: prismaGlasses.uvProtection || 'UV400',
    averageRating: prismaGlasses.averageRating || 0,
    reviewCount: prismaGlasses.reviewCount || 0,
    size: {
      lensWidth: prismaGlasses.lensWidth ? `${prismaGlasses.lensWidth}mm` : 'N/A',
      bridge: prismaGlasses.bridgeWidth ? `${prismaGlasses.bridgeWidth}mm` : 'N/A',
      temple: prismaGlasses.templeLength ? `${prismaGlasses.templeLength}mm` : 'N/A',
    },
    weight: prismaGlasses.weightBg || undefined,
    frameWidth: prismaGlasses.frameWidth || undefined,
    lensHeight: prismaGlasses.lensHeight || undefined,
    bridgeWidth: prismaGlasses.bridgeWidth || undefined,
    templeLength: prismaGlasses.templeLength || undefined,
  };
}

