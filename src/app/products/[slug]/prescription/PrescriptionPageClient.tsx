"use client";

import { Suspense } from "react";
import PrescriptionFlow from "./PrescriptionFlow";
import PrescriptionProductImage from "./PrescriptionProductImage";
import { normalizeImageUrl } from "@/lib/normalize-image-url";
import type { Product } from "@/lib/productData";

interface PrescriptionPageClientProps {
  product: Product;
  productSlug: string;
  lensBaseImageUrl?: string | null;
  lensMaskImageUrl?: string | null;
  lensBackgroundImageUrl?: string | null;
}

export default function PrescriptionPageClient({ 
  product, 
  productSlug,
  lensBaseImageUrl,
  lensMaskImageUrl,
  lensBackgroundImageUrl,
}: PrescriptionPageClientProps) {
  const selectedVariant = product.variants[0];
  const productImage = selectedVariant?.thumbnail || selectedVariant?.images[0] || '';
  const normalizedImage = productImage ? normalizeImageUrl(productImage) : '';
  
  // Normalize lens image URLs if provided
  const normalizedLensBase = lensBaseImageUrl ? normalizeImageUrl(lensBaseImageUrl) : null;
  const normalizedLensMask = lensMaskImageUrl ? normalizeImageUrl(lensMaskImageUrl) : null;
  const normalizedLensBackground = lensBackgroundImageUrl ? normalizeImageUrl(lensBackgroundImageUrl) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 min-h-[600px]">
      {/* Left Column - Sticky Product Display with Real-time Processing */}
      <div className="lg:sticky lg:top-8 lg:h-fit">
        <PrescriptionProductImage
          imageUrl={normalizedImage}
          alt={product.name}
          productName={product.name}
          lensBaseImageUrl={normalizedLensBase}
          lensMaskImageUrl={normalizedLensMask}
          lensBackgroundImageUrl={normalizedLensBackground}
        />
      </div>

      {/* Right Column - Dynamic Content */}
      <div className="w-full">
        <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
          <PrescriptionFlow product={product} productSlug={productSlug} />
        </Suspense>
      </div>
    </div>
  );
}
