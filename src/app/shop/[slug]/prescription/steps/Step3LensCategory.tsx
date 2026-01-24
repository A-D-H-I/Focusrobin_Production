"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Sun, Glasses, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LensType,
  type LensIndex,
  LENS_TYPE_LABELS,
  getFromPricePair,
  getSupportedIndexes,
  getAllowedCoatings,
  normalizeSelection,
  type LensSelection,
  calculateLensPairTotalWithProfit,
} from "@/lib/lensPricing";
import { FIXED_PROFIT } from "@/lib/pricing/rx167";
import type { RxConfigData } from "../PrescriptionFlow";
import { type RxPriceResult } from "@/lib/pricing/rx167";

interface Step3LensCategoryProps {
  rxConfig: RxConfigData;
  onConfigUpdate: (data: Partial<RxConfigData>) => void;
  onConfigUpdateDefault?: (data: Partial<RxConfigData>) => void; // For default/mount applications
  onNext: () => void;
  onBack: () => void;
  formatPrice: (price: number) => string;
  rxPriceResult: RxPriceResult;
  framePrice: number;
}

const LENS_OPTIONS: {
  value: LensType;
  label: string;
  description: string;
  icon: typeof Sun;
}[] = [
  {
    value: "CLEAR",
    label: "Clear (Mono RX)",
    description: "Clear prescription lenses - perfect for everyday wear",
    icon: Glasses,
  },
  {
    value: "TINTED",
    label: "Tinted (Mono RX)",
    description: "Prescription lenses with mandatory tint service - turns them into sunglasses",
    icon: Sun,
  },
  {
    value: "PHOTOCHROMIC_SOLIS",
    label: "Photochromic (Solis II)",
    description: "Automatically adapt to changing light - dark outdoors, clear indoors",
    icon: Sun,
  },
  {
    value: "POLARIZED_NUPOLAR",
    label: "Polarized (NuPolar)",
    description: "Reduces glare from reflective surfaces - perfect for driving and water activities",
    icon: Sparkles,
  },
];

const LENS_INDICES: LensIndex[] = ["1.56", "1.60", "1.67"];

export default function Step3LensCategory({
  rxConfig,
  onConfigUpdate,
  onConfigUpdateDefault,
  onNext,
  onBack,
  formatPrice,
  rxPriceResult,
  framePrice,
}: Step3LensCategoryProps) {
  const currentLensIndex = rxConfig.lensIndex || "1.56";
  const currentLensType = rxConfig.lensType || "CLEAR";
  
  // Use default handler if provided (won't overwrite user selections)
  const applyDefaultUpdate = onConfigUpdateDefault || onConfigUpdate;
  
  // Ensure CLEAR 1.56 is selected by default when component loads (only if not already set)
  // Also ensure coating is set if missing
  // This uses the default handler which respects hasUserMadeLensSelection flag
  useEffect(() => {
    const needsUpdate: Partial<RxConfigData> = {};
    
    if (!rxConfig.lensType) {
      needsUpdate.lensType = "CLEAR";
    }
    
    if (!rxConfig.lensIndex) {
      // Check if 1.56 is supported for CLEAR lens type
      const lensTypeToCheck = rxConfig.lensType || "CLEAR";
      const supportedIndices = getSupportedIndexes(lensTypeToCheck);
      if (supportedIndices.includes("1.56")) {
        needsUpdate.lensIndex = "1.56";
      } else if (supportedIndices.length > 0) {
        // If 1.56 is not supported, use the first supported index
        needsUpdate.lensIndex = supportedIndices[0];
      }
    }
    
    // Ensure coating is set if missing (use first allowed coating for current lens type)
    if (!rxConfig.coating && rxConfig.lensType) {
      const allowedCoatings = getAllowedCoatings(rxConfig.lensType);
      if (allowedCoatings.length > 0) {
        needsUpdate.coating = allowedCoatings[0];
      }
    }
    
    if (Object.keys(needsUpdate).length > 0) {
      // Use the default handler - this won't override user selections
      applyDefaultUpdate(needsUpdate);
    }
  }, []); // Only run on mount
  
  // Get supported indices for current lens type (or all if no type selected)
  const supportedIndices = currentLensType 
    ? getSupportedIndexes(currentLensType)
    : LENS_INDICES;

  const handleIndexChange = (index: LensIndex) => {
    if (!currentLensType) {
      onConfigUpdate({ lensIndex: index });
      return;
    }
    
    // Normalize to ensure valid combination
    const tempSelection: LensSelection = {
      lensType: currentLensType,
      lensIndex: index,
      coating: rxConfig.coating || "UC",
      tintType: rxConfig.tintType,
      tintColor: rxConfig.tintColor,
      tintShade: rxConfig.tintShadePercent,
      tintRecipe: rxConfig.tintRecipe,
      photochromicColor: rxConfig.photochromicColor,
      polarizedColor: rxConfig.polarizedColor,
    };
    
    const normalized = normalizeSelection(tempSelection);
    onConfigUpdate({
      lensIndex: normalized.lensIndex,
      coating: normalized.coating, // May change if coating becomes invalid
    });
  };

  const handleSelect = (lensType: LensType) => {
    // Normalize to ensure valid combination
    const tempSelection: LensSelection = {
      lensType,
      lensIndex: currentLensIndex,
      coating: rxConfig.coating || "UC",
      tintType: rxConfig.tintType,
      tintColor: rxConfig.tintColor,
      tintShade: rxConfig.tintShadePercent,
      tintRecipe: rxConfig.tintRecipe,
      photochromicColor: rxConfig.photochromicColor,
      polarizedColor: rxConfig.polarizedColor,
    };
    
    const normalized = normalizeSelection(tempSelection);
    
    onConfigUpdate({
      lensType: normalized.lensType,
      lensIndex: normalized.lensIndex,
      coating: normalized.coating,
      tintType: normalized.tintType,
      tintColor: normalized.tintColor,
      tintShadePercent: normalized.tintShade,
      tintRecipe: normalized.tintRecipe,
      photochromicColor: normalized.photochromicColor,
      polarizedColor: normalized.polarizedColor,
    });
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-xs text-muted-foreground">Step 1 of 4</p>
          <h2 className="text-xl font-headline">Choose Lens Type</h2>
        </div>
      </div>

      {/* Lens Index Selector */}
      <div className="space-y-3">
        <h3 className="font-semibold">Lens Index</h3>
        <p className="text-sm text-muted-foreground">
          Select the lens index (thickness). Higher index = thinner lenses.
        </p>
        <div className="flex gap-3">
          {LENS_INDICES.filter(index => supportedIndices.includes(index)).map((index) => {
            const isSelected = currentLensIndex === index;

            return (
              <button
                key={index}
                onClick={() => handleIndexChange(index)}
                className={cn(
                  "flex-1 px-4 py-3 rounded-lg border-2 transition-all font-medium",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 bg-background"
                )}
              >
                {index}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lens Options */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Lens Type</h3>
        <div className="grid gap-2">
          {LENS_OPTIONS.map((option) => {
            const isSelected = rxConfig.lensType === option.value;
            const Icon = option.icon;
            // Calculate "From €..." price using current lens index if supported, otherwise first supported index
            // This makes prices update dynamically when lens index changes
            const supportedIndicesForOption = getSupportedIndexes(option.value);
            const indexToUse = supportedIndicesForOption.includes(currentLensIndex)
              ? currentLensIndex
              : supportedIndicesForOption[0];
            const fromPrice = indexToUse ? getFromPricePair(option.value, indexToUse, FIXED_PROFIT) : 0;

            // Check if this option needs color selection
            const needsPhotochromicColor = option.value === "PHOTOCHROMIC_SOLIS" && isSelected;
            const needsPolarizedColor = option.value === "POLARIZED_NUPOLAR" && isSelected;

            return (
              <div key={option.value} className="space-y-0">
                <button
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "relative flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all text-left w-full",
                    "hover:border-primary hover:bg-primary/5",
                    isSelected ? "border-primary bg-primary/10" : "border-border bg-background"
                  )}
                >
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  
                  <div className={cn("flex-1", isSelected ? "pr-12" : "pr-2")}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold mb-0.5">{option.label}</h3>
                        <p className="text-xs text-muted-foreground mb-1">{option.description}</p>
                      </div>
                      {indexToUse && (
                        <span className="text-sm font-semibold text-primary whitespace-nowrap">
                          From {formatPrice(fromPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </button>

                {/* Color Selection for Photochromic - expands below the option */}
                {needsPhotochromicColor && (
                  <div className="mt-3 ml-4 pl-16 pr-4 space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Select Color:</h4>
                    <div className="flex flex-wrap gap-2">
                      {(["Brown", "Grey"] as const).map((color) => (
                        <button
                          key={color}
                          onClick={(e) => {
                            e.stopPropagation();
                            onConfigUpdate({ photochromicColor: color });
                          }}
                          className={cn(
                            "px-4 py-2 rounded-lg border-2 transition-all text-sm",
                            rxConfig.photochromicColor === color
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border hover:border-primary/50 bg-background"
                          )}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selection for Polarized - expands below the option */}
                {needsPolarizedColor && (
                  <div className="mt-3 ml-4 pl-16 pr-4 space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Select Color:</h4>
                    <div className="flex flex-wrap gap-2">
                      {(["Brown", "Grey", "Green"] as const).map((color) => (
                        <button
                          key={color}
                          onClick={(e) => {
                            e.stopPropagation();
                            onConfigUpdate({ polarizedColor: color });
                          }}
                          className={cn(
                            "px-4 py-2 rounded-lg border-2 transition-all text-sm",
                            rxConfig.polarizedColor === color
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border hover:border-primary/50 bg-background"
                          )}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t">
        <Button
          onClick={() => {
            // Ensure coating is set before navigating to step 4
            // This prevents prices from changing when entering step 4
            if (rxConfig.lensType && !rxConfig.coating) {
              const allowedCoatings = getAllowedCoatings(rxConfig.lensType);
              if (allowedCoatings.length > 0) {
                onConfigUpdate({ coating: allowedCoatings[0] });
                // Wait for state update before navigating
                requestAnimationFrame(() => {
                  onNext();
                });
                return;
              }
            }
            onNext();
          }}
          disabled={
            !rxConfig.lensType ||
            (rxConfig.lensType === "PHOTOCHROMIC_SOLIS" && !rxConfig.photochromicColor) ||
            (rxConfig.lensType === "POLARIZED_NUPOLAR" && !rxConfig.polarizedColor)
          }
          className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm"
        >
          Continue to Coating
        </Button>
      </div>
    </div>
  );
}

