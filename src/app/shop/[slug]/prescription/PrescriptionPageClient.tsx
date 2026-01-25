"use client";

import { Suspense, useMemo } from "react";
import PrescriptionFlow from "./PrescriptionFlow";
import PrescriptionProductImage from "./PrescriptionProductImage";
import { normalizeImageUrl } from "@/lib/normalize-image-url";
import type { Product } from "@/lib/productData";
import { PrescriptionPriceProvider, usePrescriptionPrice } from "./context/PrescriptionPriceContext";

interface PrescriptionPageClientProps {
  product: Product;
  productSlug: string;
  lensBaseImageUrl?: string | null;
  lensMaskImageUrl?: string | null;
  lensBackgroundImageUrl?: string | null;
}

function PrescriptionPageContent({ 
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

  const { rxPriceResult, framePrice, formatPrice, prescriptionData, currentStep, rxConfig: contextRxConfig } = usePrescriptionPrice();

  // For steps 0 and 1, only show frame price
  // For steps 3+, show full breakdown
  const showFullBreakdown = currentStep >= 3;

  // Fallback formatPrice function if not yet initialized - ensure it's always a function
  const safeFormatPrice = useMemo(() => {
    if (typeof formatPrice === 'function') {
      return formatPrice;
    }
    // Fallback function if formatPrice is not available
    return (price: number) => `€${price.toFixed(2)}`;
  }, [formatPrice]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {/* Left Column - Sticky Product Display with Real-time Processing */}
      <div className="lg:sticky lg:top-8 lg:h-fit space-y-3">
        <div className="max-w-sm mx-auto lg:max-w-full">
          <PrescriptionProductImage
            imageUrl={normalizedImage}
            alt={product.name}
            productName={product.name}
            rxConfig={contextRxConfig || undefined}
            lensBaseImageUrl={normalizedLensBase}
            lensMaskImageUrl={normalizedLensMask}
            lensBackgroundImageUrl={normalizedLensBackground}
            currentStep={currentStep}
          />
        </div>
        
        {/* Order Summary Section */}
        <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
          <h3 className="font-semibold text-sm mb-3">Order Summary</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Frame</span>
            <span className="font-medium">{safeFormatPrice(framePrice || 0)}</span>
          </div>
          
          {/* Show full breakdown only for steps 3+ */}
          {showFullBreakdown && rxPriceResult && formatPrice && (
            <>
              {rxPriceResult.breakdown.lensesPair > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Lenses (pair)</span>
                  <span className="font-medium">{safeFormatPrice(rxPriceResult.breakdown.lensesPair)}</span>
                </div>
              )}
              <div className="pt-2 border-t flex items-center justify-between">
                <span className="font-semibold">Subtotal</span>
                <span className="text-lg font-bold text-primary">{safeFormatPrice(rxPriceResult.totalNet)}</span>
              </div>
            </>
          )}
        </div>
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

export default function PrescriptionPageClient({ 
  product, 
  productSlug,
  lensBaseImageUrl,
  lensMaskImageUrl,
  lensBackgroundImageUrl,
}: PrescriptionPageClientProps) {
  return (
    <PrescriptionPriceProvider>
      <PrescriptionPageContent
        product={product}
        productSlug={productSlug}
        lensBaseImageUrl={lensBaseImageUrl}
        lensMaskImageUrl={lensMaskImageUrl}
        lensBackgroundImageUrl={lensBackgroundImageUrl}
      />
    </PrescriptionPriceProvider>
  );
}

