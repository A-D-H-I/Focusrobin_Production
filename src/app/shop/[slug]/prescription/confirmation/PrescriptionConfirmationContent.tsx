"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { normalizeImageUrl } from "@/lib/normalize-image-url";
import { CheckCircle2, Edit, ShoppingCart, Package } from "lucide-react";
import PrescriptionProductImage from "../PrescriptionProductImage";
import type { Product } from "@/lib/productData";
import { usePrice } from "@/hooks/usePrice";
import {
  LENS_TYPE_LABELS,
  COATING_LABELS,
} from "@/lib/lensPricing";
import {
  FRAME_TYPE_LABELS,
} from "@/lib/pricing/rx167";
import type { FullPrescriptionData } from "../PrescriptionFlow";

interface PrescriptionConfirmationContentProps {
  product: Product;
  productSlug: string;
}

export default function PrescriptionConfirmationContent({ product, productSlug }: PrescriptionConfirmationContentProps) {
  const router = useRouter();
  const { formatPrice, parseEurPrice } = usePrice();
  const [prescriptionData, setPrescriptionData] = useState<FullPrescriptionData | null>(null);

  const framePrice = parseEurPrice(product.price);

  useEffect(() => {
    // Load prescription data from sessionStorage
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`prescription_${productSlug}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as FullPrescriptionData;
          setPrescriptionData(parsed);
        } catch (error) {
          console.error('Error parsing prescription data:', error);
          router.push(`/shop/${productSlug}`);
        }
      } else {
        // No prescription data, redirect to product page
        router.push(`/shop/${productSlug}`);
      }
    }
  }, [productSlug, router]);

  const handleEdit = () => {
    router.push(`/shop/${productSlug}/prescription?product=${encodeURIComponent(productSlug)}`);
  };

  const handleContinue = () => {
    router.push(`/shop/${productSlug}`);
  };

  if (!prescriptionData) {
    return (
      <div className="h-96 bg-muted animate-pulse rounded-lg" />
    );
  }

  const selectedVariant = product.variants[0];
  const productImage = selectedVariant?.thumbnail || selectedVariant?.images[0] || '';
  const normalizedImage = productImage ? normalizeImageUrl(productImage) : '';
  const rxConfig = prescriptionData.rxConfig;
  const priceBreakdown = prescriptionData.rxPriceBreakdown;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Left Column - Product Display */}
      <div className="lg:sticky lg:top-8 lg:h-fit flex flex-col">
        <PrescriptionProductImage
          imageUrl={normalizedImage}
          alt={product.name}
          productName={product.name}
        />
        
        <div className="space-y-4 mt-6">
          <h2 className="text-2xl font-headline">{product.name}</h2>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frame:</span>
              <span className="font-medium">{selectedVariant?.name || 'Default'}</span>
            </div>
            {rxConfig && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lens Type:</span>
                  <span className="font-medium">{LENS_TYPE_LABELS[rxConfig.lensType]}</span>
                </div>
                {rxConfig.lensIndex && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lens Index:</span>
                    <span className="font-medium">{rxConfig.lensIndex}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coating:</span>
                  <span className="font-medium">{COATING_LABELS[rxConfig.coating]}</span>
                </div>
              </>
            )}
          </div>
          
          {priceBreakdown && (
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frame:</span>
                <span>{formatPrice(framePrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rx Lenses:</span>
                <span>+{formatPrice(priceBreakdown.rxRetailNet)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold text-primary">{formatPrice(priceBreakdown.totalNet)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Prescription Confirmation */}
      <div className="w-full">
        <div className="bg-card border rounded-lg p-6 space-y-6">
          {/* Success Header */}
          <div className="flex items-center gap-3 pb-4 border-b">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <h2 className="text-2xl font-headline">Order Ready!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your prescription and lens configuration has been saved
              </p>
            </div>
          </div>

          {/* Prescription Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Prescription Details</h3>
            
            <div className="space-y-4">
              {/* OD (Right Eye) */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">OD (Right Eye)</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">SPH</p>
                    <p className="font-mono font-medium">{prescriptionData.od.sph}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">CYL</p>
                    <p className="font-mono font-medium">{prescriptionData.od.cyl}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">AXIS</p>
                    <p className="font-mono font-medium">{prescriptionData.od.axis}°</p>
                  </div>
                </div>
              </div>

              {/* OS (Left Eye) */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">OS (Left Eye)</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">SPH</p>
                    <p className="font-mono font-medium">{prescriptionData.os.sph}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">CYL</p>
                    <p className="font-mono font-medium">{prescriptionData.os.cyl}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">AXIS</p>
                    <p className="font-mono font-medium">{prescriptionData.os.axis}°</p>
                  </div>
                </div>
              </div>

              {/* PD */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">PD (Pupillary Distance)</h4>
                {prescriptionData.hasTwoPDs ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">OD (Right)</p>
                      <p className="text-lg font-mono font-medium">{prescriptionData.pdOd || "N/A"} mm</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">OS (Left)</p>
                      <p className="text-lg font-mono font-medium">{prescriptionData.pdOs || "N/A"} mm</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-lg font-mono font-medium">{prescriptionData.pd} mm</p>
                )}
              </div>
            </div>
          </div>

          {/* Lens Configuration */}
          {rxConfig && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Lens Configuration</h3>
              
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lens Type:</span>
                  <span className="font-medium">{LENS_TYPE_LABELS[rxConfig.lensType]}</span>
                </div>
                {rxConfig.lensIndex && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lens Index:</span>
                    <span className="font-medium">{rxConfig.lensIndex}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Coating:</span>
                  <span className="font-medium">{COATING_LABELS[rxConfig.coating]}</span>
                </div>
                {rxConfig.lensType === "TINTED" && rxConfig.tintType && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tint:</span>
                      <span className="font-medium">
                        {rxConfig.tintType === "FULL_TINT_CATALOG" ? "Full Tint (Catalog)" : "Gradient Tint"}
                      </span>
                    </div>
                    {rxConfig.tintColor && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tint Color:</span>
                        <span className="font-medium">
                          {rxConfig.tintColor}
                          {rxConfig.tintType === "FULL_TINT_CATALOG" && rxConfig.tintShadePercent && ` ${rxConfig.tintShadePercent}%`}
                          {rxConfig.tintType === "GRADIENT" && rxConfig.tintRecipe && ` (${rxConfig.tintRecipe})`}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {rxConfig.photochromicColor && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Photochromic Color:</span>
                    <span className="font-medium">{rxConfig.photochromicColor}</span>
                  </div>
                )}
                {rxConfig.polarizedColor && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Polarized Color:</span>
                    <span className="font-medium">{rxConfig.polarizedColor}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frame Type:</span>
                  <span className="font-medium">{FRAME_TYPE_LABELS[rxConfig.frameType]}</span>
                </div>
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          {priceBreakdown && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Price Breakdown</h3>
              
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Frame
                  </span>
                  <span>{formatPrice(framePrice)}</span>
                </div>
                <div className="border-t pt-3 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Prescription Lenses</p>
                  <div className="flex justify-between text-sm pl-4">
                    <span>Lenses (pair)</span>
                    <span>{formatPrice(priceBreakdown.lensesPair)}</span>
                  </div>
                  <div className="flex justify-between text-sm pl-4">
                    <span>Edging/Mounting</span>
                    <span>{formatPrice(priceBreakdown.edgingFee)}</span>
                  </div>
                </div>
                <div className="border-t pt-3 flex justify-between text-sm">
                  <span>Rx Add-on</span>
                  <span className="font-medium">{formatPrice(priceBreakdown.rxRetailNet)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(priceBreakdown.totalNet)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t space-y-3">
            <Button
              onClick={handleContinue}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Return to Product
            </Button>
            <Button
              variant="outline"
              onClick={handleEdit}
              className="w-full h-12"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Configuration
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

