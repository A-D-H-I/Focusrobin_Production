"use client";

import { Suspense } from "react";
import PrescriptionFlow from "./PrescriptionFlow";
import PrescriptionProductImage from "./PrescriptionProductImage";
import { normalizeImageUrl } from "@/lib/normalize-image-url";
import type { Product } from "@/lib/productData";
import { PrescriptionPriceProvider, usePrescriptionPrice } from "./context/PrescriptionPriceContext";
import PriceSummary from "./components/PriceSummary";
import { usePrice } from "@/hooks/usePrice";

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

  const { rxPriceResult, framePrice, formatPrice, prescriptionData, currentStep } = usePrescriptionPrice();
  const { parseEurPrice } = usePrice();
  
  // Calculate frame price from product if not available in context
  const calculatedFramePrice = framePrice || parseEurPrice(product.price);

  // Check if prescription values are entered (not defaults)
  const hasPrescriptionValues = prescriptionData && (
    prescriptionData.od.sph !== "0.00" ||
    prescriptionData.od.cyl !== "0.00" ||
    prescriptionData.od.axis !== "0" ||
    prescriptionData.os.sph !== "0.00" ||
    prescriptionData.os.cyl !== "0.00" ||
    prescriptionData.os.axis !== "0" ||
    prescriptionData.pd !== "62"
  );

  // Show subtotal from Step 3 (Choose Lens Type) onwards
  // Step 3 is "Choose Lens Type" - show subtotal when on lens selection step and beyond
  const shouldShowSubtotal = currentStep >= 3;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {/* Left Column - Sticky Product Display with Real-time Processing */}
      <div className="lg:sticky lg:top-8 lg:h-fit space-y-3">
        {/* Price Summary above image - Only show when prescription values are entered */}
        {formatPrice && rxPriceResult && hasPrescriptionValues && (
          <PriceSummary
            rxPriceResult={rxPriceResult}
            framePrice={calculatedFramePrice}
            formatPrice={formatPrice}
            className="border-t-0 pt-0"
          />
        )}
        
        <div className="max-w-sm mx-auto lg:max-w-full">
          <PrescriptionProductImage
            imageUrl={normalizedImage}
            alt={product.name}
            productName={product.name}
            lensBaseImageUrl={normalizedLensBase}
            lensMaskImageUrl={normalizedLensMask}
            lensBackgroundImageUrl={normalizedLensBackground}
          />
        </div>
        
        {/* Subtotal below product image - Show from Step 3 (Choose Lens Type) onwards */}
        {formatPrice && shouldShowSubtotal && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Subtotal</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  Frame + Lenses
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">
                  {formatPrice(rxPriceResult?.totalNet || calculatedFramePrice || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Including VAT</p>
              </div>
            </div>
          </div>
        )}
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

