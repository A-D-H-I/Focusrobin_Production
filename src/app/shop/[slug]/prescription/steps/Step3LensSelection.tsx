"use client";

import { useEffect } from "react";
import { Check, Sun, Glasses, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LensBundle,
  LENS_BUNDLE_LABELS,
  LENS_BUNDLE_DETAILS,
  getBundlePrice,
  PHOTOCHROMIC_COLORS,
  SUNGLASS_COLORS,
} from "@/lib/lensPricing";
import type { RxPriceResult } from "@/lib/pricing/rx167";
import type { RxConfigData } from "@/types/prescription";
import type { Product } from "@/lib/productData";
import { usePrescriptionPrice } from "../context/PrescriptionPriceContext";

interface Step3LensSelectionProps {
  product: Product;
  rxConfig: RxConfigData;
  onConfigUpdate: (data: Partial<RxConfigData>) => void;
  onConfigUpdateDefault?: (data: Partial<RxConfigData>) => void;
  onNext: () => void;
  onBack: () => void;
  formatPrice: (price: number) => string;
  rxPriceResult: RxPriceResult;
  framePrice: number;
}

const BUNDLE_OPTIONS: {
  value: LensBundle;
  icon: typeof Sun;
}[] = [
    { value: "BASIC", icon: Glasses },
    { value: "BLUE_FILTER", icon: Shield },
    { value: "PHOTOCHROMIC", icon: Sun },
    { value: "SUNGLASSES_TINT", icon: Sun },
    { value: "SUNGLASSES_GRADIENT", icon: Sun },
  ];

export default function Step3LensSelection({
  product,
  rxConfig,
  onConfigUpdate,
  onConfigUpdateDefault,
  onNext,
  onBack,
  formatPrice,
  rxPriceResult,
  framePrice,
}: Step3LensSelectionProps) {
  const { bundlePrices } = usePrescriptionPrice();

  // Set default bundle on mount if none selected
  useEffect(() => {
    if (!rxConfig.lensBundle && onConfigUpdateDefault) {
      onConfigUpdateDefault({ lensBundle: "BASIC" });
    }
  }, [rxConfig.lensBundle, onConfigUpdateDefault]);

  const handleBundleSelect = (bundle: LensBundle) => {
    onConfigUpdate({ lensBundle: bundle });
  };

  const isPhotochromic = rxConfig.lensBundle === "PHOTOCHROMIC";
  const isSunglasses = rxConfig.lensBundle === "SUNGLASSES_TINT" || rxConfig.lensBundle === "SUNGLASSES_GRADIENT";

  // Determine valid next step
  const canProceed = !!rxConfig.lensBundle;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Select Your Lenses</h2>
        <p className="text-sm text-muted-foreground">
          Choose the lens package that suits your lifestyle. All packages include necessary coatings.
        </p>
      </div>

      <div className="grid gap-3">
        {BUNDLE_OPTIONS.map((option) => {
          const isSelected = rxConfig.lensBundle === option.value;
          const Icon = option.icon;
          // Use dynamic price from context, fallback to static if not found (though context defaults to static)
          const price = bundlePrices[option.value] ?? getBundlePrice(option.value);
          const label = LENS_BUNDLE_LABELS[option.value];
          const details = LENS_BUNDLE_DETAILS[option.value];

          return (
            <div key={option.value} className={cn(
              "relative rounded-xl border-2 transition-all overflow-hidden",
              isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-card"
            )}>
              <button
                onClick={() => handleBundleSelect(option.value)}
                className={cn(
                  "flex items-start gap-4 p-4 w-full text-left",
                  isSelected && "pr-12"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="h-6 w-6" />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-base">{label}</h3>
                    <span className="font-bold text-primary">{formatPrice(price)}</span>
                  </div>
                  {/* Detailed description with better readability */}
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed pr-4">
                    {details.description}
                  </p>

                  {/* Feature Tags */}
                  {details.features && details.features.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {details.features.map((feature, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full bg-secondary/50 text-xs font-medium text-secondary-foreground border border-secondary"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-2.5">
                    Best for: {details.bestFor}
                  </p>
                </div>

                {isSelected && (
                  <span className="absolute top-4 right-4 text-primary animate-in fade-in zoom-in duration-200">
                    <Check className="h-6 w-6" />
                  </span>
                )}
              </button>

              {/* Sub-options (Color Selection) expanded inside the card if selected */}
              {isSelected && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2 fade-in duration-200">
                  {/* Photochromic Colors */}
                  {isPhotochromic && (
                    <div className="mt-2 pt-3 border-t ml-16">
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Select Color</p>
                      <div className="flex gap-2">
                        {PHOTOCHROMIC_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => onConfigUpdate({ photochromicColor: color })}
                            className={cn(
                              "px-3 py-1.5 rounded-md text-sm border transition-all",
                              rxConfig.photochromicColor === color
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background border-input hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sunglasses Colors */}
                  {isSunglasses && (
                    <div className="mt-2 pt-3 border-t ml-16">
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Select Tint Color</p>
                      <div className="flex gap-2">
                        {SUNGLASS_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => onConfigUpdate({ tintColor: color })}
                            className={cn(
                              "px-3 py-1.5 rounded-md text-sm border transition-all",
                              rxConfig.tintColor === color
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background border-input hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t flex justify-between items-center">
        <button
          onClick={onBack}
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
        >
          {/* ArrowLeft is imported */}
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Prescription
        </button>

        <button
          onClick={onNext}
          disabled={!canProceed}
          className={cn(
            "px-8 py-2.5 rounded-lg font-semibold text-white transition-all shadow-md",
            canProceed
              ? "bg-primary hover:bg-primary/90 hover:shadow-lg"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          Review Order
        </button>
      </div>
    </div>
  );
}
