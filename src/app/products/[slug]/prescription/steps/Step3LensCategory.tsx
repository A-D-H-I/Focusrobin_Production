"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Sun, Glasses, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LensType,
  type LensIndex,
  LENS_TYPE_LABELS,
  getFromPricePair,
  getSupportedIndexes,
  normalizeSelection,
  type LensSelection,
} from "@/lib/lensPricing";
import type { RxConfigData } from "../PrescriptionFlow";

interface Step3LensCategoryProps {
  rxConfig: RxConfigData;
  onConfigUpdate: (data: Partial<RxConfigData>) => void;
  onNext: () => void;
  onBack: () => void;
  formatPrice: (price: number) => string;
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
  onNext,
  onBack,
  formatPrice,
}: Step3LensCategoryProps) {
  const currentLensIndex = rxConfig.lensIndex || "1.67";
  const currentLensType = rxConfig.lensType || "CLEAR";
  
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">Step 1 of 4</p>
          <h2 className="text-2xl sm:text-3xl font-headline">Choose Lens Type</h2>
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
      <div className="space-y-3">
        <h3 className="font-semibold">Lens Type</h3>
        <div className="grid gap-4">
          {LENS_OPTIONS.map((option) => {
            const isSelected = rxConfig.lensType === option.value;
            const Icon = option.icon;
            // Calculate "From €..." price using first supported index for this lens type
            // (not currentLensIndex, which might not be supported for this lens type)
            const supportedIndicesForOption = getSupportedIndexes(option.value);
            const firstSupportedIndex = supportedIndicesForOption[0];
            const fromPrice = getFromPricePair(option.value, firstSupportedIndex);

            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "relative flex items-start gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all text-left",
                  "hover:border-primary hover:bg-primary/5",
                  isSelected ? "border-primary bg-primary/10" : "border-border bg-background"
                )}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                
                <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                
                <div className="flex-1 pr-8">
                  <h3 className="text-lg font-semibold mb-1">{option.label}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{option.description}</p>
                  <p className="text-sm font-medium text-primary">
                    From {formatPrice(fromPrice)} per pair
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Selection for Photochromic/Polarized */}
      {rxConfig.lensType === "PHOTOCHROMIC_SOLIS" && (
        <div className="space-y-3 pt-4 border-t">
          <h3 className="font-semibold">Photochromic Color</h3>
          <div className="flex flex-wrap gap-2">
            {(["Brown", "Grey"] as const).map((color) => (
              <button
                key={color}
                onClick={() => onConfigUpdate({ photochromicColor: color })}
                className={cn(
                  "px-4 py-2 rounded-lg border-2 transition-all",
                  rxConfig.photochromicColor === color
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {rxConfig.lensType === "POLARIZED_NUPOLAR" && (
        <div className="space-y-3 pt-4 border-t">
          <h3 className="font-semibold">Polarized Color</h3>
          <div className="flex flex-wrap gap-2">
            {(["Brown", "Grey", "Green"] as const).map((color) => (
              <button
                key={color}
                onClick={() => onConfigUpdate({ polarizedColor: color })}
                className={cn(
                  "px-4 py-2 rounded-lg border-2 transition-all",
                  rxConfig.polarizedColor === color
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-4 border-t space-y-3">
        <Button
          onClick={onNext}
          disabled={
            !rxConfig.lensType ||
            (rxConfig.lensType === "PHOTOCHROMIC_SOLIS" && !rxConfig.photochromicColor) ||
            (rxConfig.lensType === "POLARIZED_NUPOLAR" && !rxConfig.polarizedColor)
          }
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          Continue to Coating
        </Button>
      </div>
    </div>
  );
}
