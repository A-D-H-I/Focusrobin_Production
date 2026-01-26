"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Check, Sun, Glasses, Sparkles, Shield, Eye, Package, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LensType,
  type LensIndex,
  type Coating,
  type TintType,
  type TintColor,
  type PolarizedColor,
  LENS_TYPE_LABELS,
  COATING_LABELS,
  getSupportedIndexes,
  getAllowedCoatings,
  getCoatingDeltaPair,
  getBasePairPrice,
  FULL_TINT_SHADES,
  GRADIENT_RECIPES,
  PRICES as LENS_PRICES,
} from "@/lib/lensPricing";
import {
  type FrameType,
  FRAME_TYPE_LABELS,
  PRICES,
} from "@/lib/pricing/rx167";
import type { RxPriceResult } from "@/lib/pricing/rx167";
import { detectFrameType } from "@/lib/pricing/detectFrameType";
import type { RxConfigData } from "../PrescriptionFlow";
import type { Product } from "@/lib/productData";

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

const COATING_OPTIONS: {
  value: Coating;
  description: string;
  icon: typeof Shield | typeof Eye;
}[] = [
  {
    value: "UC",
    description: "Standard lens without additional coating",
    icon: Eye,
  },
  {
    value: "SERICUM_UV",
    description: "UV protection coating - essential for eye health",
    icon: Shield,
  },
  {
    value: "BLUE_PRO",
    description: "Blue-light protective anti-reflective coating - reduces eye strain from screens",
    icon: Shield,
  },
];

const TINT_TYPE_OPTIONS: {
  value: TintType;
  label: string;
  description: string;
  pricePerPair: number;
}[] = [
  {
    value: "FULL_TINT_CATALOG",
    label: "Full Tint (Catalog)",
    description: "Solid color tint from our catalog collection",
    pricePerPair: LENS_PRICES.tintPair.FULL_TINT_CATALOG,
  },
  {
    value: "GRADIENT",
    label: "Gradient Tint",
    description: "Fades from dark at top to lighter at bottom",
    pricePerPair: LENS_PRICES.tintPair.GRADIENT,
  },
];

const COLOR_SWATCHES: Record<TintColor, string> = {
  Brown: "bg-amber-700",
  Grey: "bg-gray-500",
  Green: "bg-green-700",
};

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
  const applyDefaultUpdate = onConfigUpdateDefault || onConfigUpdate;
  const detectedFrameType = detectFrameType(product);
  
  // Ensure defaults are set on mount
  useEffect(() => {
    const needsUpdate: Partial<RxConfigData> = {};
    
    if (!rxConfig.lensType) {
      needsUpdate.lensType = "CLEAR";
    }
    
    if (!rxConfig.lensIndex) {
      const lensTypeToCheck = rxConfig.lensType || "CLEAR";
      const supportedIndices = getSupportedIndexes(lensTypeToCheck);
      if (supportedIndices.includes("1.56")) {
        needsUpdate.lensIndex = "1.56";
      } else if (supportedIndices.length > 0) {
        needsUpdate.lensIndex = supportedIndices[0];
      }
    }
    
    if (!rxConfig.coating) {
      needsUpdate.coating = "UC";
    }
    
    if (rxConfig.frameType !== detectedFrameType) {
      needsUpdate.frameType = detectedFrameType;
    }
    
    if (Object.keys(needsUpdate).length > 0) {
      applyDefaultUpdate(needsUpdate);
    }
  }, []); // Only on mount

  const currentLensType = rxConfig.lensType || "CLEAR";
  const supportedIndices = getSupportedIndexes(currentLensType);
  const allowedCoatings = getAllowedCoatings(currentLensType);
  const availableCoatings = COATING_OPTIONS.filter(opt => allowedCoatings.includes(opt.value));
  const isTinted = currentLensType === "TINTED";
  const isFullTint = rxConfig.tintType === "FULL_TINT_CATALOG";
  const isGradient = rxConfig.tintType === "GRADIENT";
  const selectedColor = rxConfig.tintColor;
  const availableShades = selectedColor && isFullTint 
    ? FULL_TINT_SHADES[selectedColor] 
    : undefined;
  const gradientRecipe = selectedColor && isGradient
    ? GRADIENT_RECIPES[selectedColor]
    : undefined;

  const handleLensTypeSelect = (lensType: LensType) => {
    const update: Partial<RxConfigData> = { lensType };
    const newSupportedIndices = getSupportedIndexes(lensType);
    
    // Reset index if current one is not supported for new lens type
    if (rxConfig.lensIndex && !newSupportedIndices.includes(rxConfig.lensIndex as LensIndex)) {
      update.lensIndex = newSupportedIndices[0];
    }
    
    // Reset coating if not allowed for new lens type
    const newAllowedCoatings = getAllowedCoatings(lensType);
    if (rxConfig.coating && !newAllowedCoatings.includes(rxConfig.coating)) {
      update.coating = newAllowedCoatings[0];
    }
    
    // Clear tint options if not TINTED
    if (lensType !== "TINTED") {
      update.tintType = undefined;
      update.tintColor = undefined;
      update.tintShadePercent = undefined;
      update.tintRecipe = undefined;
    }
    
    // Clear polarized color if not POLARIZED_NUPOLAR
    if (lensType !== "POLARIZED_NUPOLAR") {
      update.polarizedColor = undefined;
    } else if (!update.polarizedColor) {
      // Set default polarized color if none selected
      update.polarizedColor = "Brown";
    }
    
    // Clear photochromic color if not PHOTOCHROMIC_SOLIS
    if (lensType !== "PHOTOCHROMIC_SOLIS") {
      update.photochromicColor = undefined;
    } else if (!update.photochromicColor) {
      // Set default photochromic color if none selected
      update.photochromicColor = "Brown";
    }
    
    onConfigUpdate(update);
  };

  const handleLensIndexSelect = (lensIndex: LensIndex) => {
    onConfigUpdate({ lensIndex });
  };

  const handleCoatingSelect = (coating: Coating) => {
    onConfigUpdate({ coating });
  };

  const handleTintTypeSelect = (tintType: TintType) => {
    const update: Partial<RxConfigData> = { tintType };
    
    if (tintType === "GRADIENT") {
      if (rxConfig.tintColor && rxConfig.tintColor in GRADIENT_RECIPES) {
        update.tintRecipe = GRADIENT_RECIPES[rxConfig.tintColor];
      }
      update.tintShadePercent = undefined;
    } else if (tintType === "FULL_TINT_CATALOG") {
      update.tintRecipe = undefined;
      if (rxConfig.tintColor && rxConfig.tintColor in FULL_TINT_SHADES) {
        const shades = FULL_TINT_SHADES[rxConfig.tintColor];
        update.tintShadePercent = shades[Math.floor(shades.length / 2)];
      }
    }
    
    onConfigUpdate(update);
  };

  const handleColorSelect = (color: TintColor) => {
    const update: Partial<RxConfigData> = { tintColor: color };
    
    if (rxConfig.tintType === "FULL_TINT_CATALOG") {
      const shades = FULL_TINT_SHADES[color];
      update.tintShadePercent = shades[Math.floor(shades.length / 2)];
      update.tintRecipe = undefined;
    } else if (rxConfig.tintType === "GRADIENT") {
      update.tintRecipe = GRADIENT_RECIPES[color];
      update.tintShadePercent = undefined;
    }
    
    onConfigUpdate(update);
  };

  const handleShadeSelect = (shade: number) => {
    onConfigUpdate({ tintShadePercent: shade });
  };

  const getPriceDelta = (coating: Coating): number => {
    if (!rxConfig.lensType || !rxConfig.lensIndex || !rxConfig.frameType) return 0;
    const coatingDelta = getCoatingDeltaPair(rxConfig.lensType, rxConfig.lensIndex, coating);
    const edgingFee = PRICES.edging[rxConfig.frameType] || 0;
    return coatingDelta + edgingFee;
  };

  const isPolarized = rxConfig.lensType === "POLARIZED_NUPOLAR";
  const isPhotochromic = rxConfig.lensType === "PHOTOCHROMIC_SOLIS";
  
  const canProceed = rxConfig.lensType && rxConfig.lensIndex && rxConfig.coating && 
    (!isTinted || (rxConfig.tintType && rxConfig.tintColor)) &&
    (!isPolarized || rxConfig.polarizedColor) &&
    (!isPhotochromic || rxConfig.photochromicColor);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-xs text-muted-foreground">Step 2 of 3</p>
          <h2 className="text-xl font-headline">Choose Lens Configuration</h2>
        </div>
      </div>

      {/* Lens Type Selection */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Lens Type</h3>
        <div className="grid gap-2">
          {LENS_OPTIONS.map((option) => {
            const isSelected = rxConfig.lensType === option.value;
            const Icon = option.icon;
            const needsPolarizedColor = option.value === "POLARIZED_NUPOLAR" && isSelected;
            const needsPhotochromicColor = option.value === "PHOTOCHROMIC_SOLIS" && isSelected;

            return (
              <div key={option.value}>
                <button
                  onClick={() => handleLensTypeSelect(option.value)}
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
                    <h4 className="text-base font-semibold mb-0.5">{option.label}</h4>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>

                {/* Color Selection for Polarized - expands below the option */}
                {needsPolarizedColor && (
                  <div className="mt-2 ml-4 pl-16 pr-4 space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Select Polarized Color:</h4>
                    <div className="flex flex-wrap gap-2">
                      {(["Brown", "Grey", "Green"] as PolarizedColor[]).map((color) => (
                        <button
                          key={color}
                          onClick={() => onConfigUpdate({ polarizedColor: color })}
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

                {/* Color Selection for Photochromic - expands below the option */}
                {needsPhotochromicColor && (
                  <div className="mt-2 ml-4 pl-16 pr-4 space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Select Photochromic Color:</h4>
                    <div className="flex flex-wrap gap-2">
                      {(["Brown", "Grey"] as const).map((color) => (
                        <button
                          key={color}
                          onClick={() => onConfigUpdate({ photochromicColor: color })}
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Lens Index Selection */}
      {rxConfig.lensType && (
        <div className="space-y-3 pt-4 border-t">
          <h3 className="font-semibold text-sm">Lens Index</h3>
          <div className="grid grid-cols-3 gap-2">
            {supportedIndices.map((index) => {
              const isSelected = rxConfig.lensIndex === index;

              return (
                <button
                  key={index}
                  onClick={() => handleLensIndexSelect(index)}
                  className={cn(
                    "relative p-3 border-2 rounded-lg cursor-pointer transition-all",
                    "hover:border-primary hover:bg-primary/5",
                    isSelected ? "border-primary bg-primary/10" : "border-border bg-background"
                  )}
                >
                  <div className="text-center">
                    <p className="font-semibold">{index}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Coating Selection */}
      {rxConfig.lensType && rxConfig.lensIndex && (
        <div className="space-y-3 pt-4 border-t">
          <h3 className="font-semibold text-sm">Coating</h3>
          <div className="grid gap-2">
            {availableCoatings.map((option) => {
              const isSelected = rxConfig.coating === option.value;
              const Icon = option.icon;
              const delta = getPriceDelta(option.value);

              return (
                <button
                  key={option.value}
                  onClick={() => handleCoatingSelect(option.value)}
                  className={cn(
                    "relative flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all text-left",
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
                        <h4 className="text-base font-semibold mb-0.5">{COATING_LABELS[option.value]}</h4>
                        <p className="text-xs text-muted-foreground mb-1">{option.description}</p>
                        {delta === 0 ? (
                          <p className="text-sm font-medium text-muted-foreground">Included</p>
                        ) : (
                          <p className="text-sm font-semibold text-primary">+{formatPrice(delta)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tint Options (only if TINTED selected) */}
      {isTinted && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-sm">Tint Options</h3>
          
          {/* Tint Type */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Tint Type</p>
            <div className="grid gap-2">
              {TINT_TYPE_OPTIONS.map((option) => {
                const isSelected = rxConfig.tintType === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => handleTintTypeSelect(option.value)}
                    className={cn(
                      "relative flex items-center gap-4 p-3 border-2 rounded-lg cursor-pointer transition-all text-left",
                      "hover:border-primary hover:bg-primary/5",
                      isSelected ? "border-primary bg-primary/10" : "border-border bg-background"
                    )}
                  >
                    <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                      {option.value === "GRADIENT" ? (
                        <Sparkles className="h-4 w-4 text-primary" />
                      ) : (
                        <Sun className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    
                    <div className="flex-1 pr-8">
                      <h4 className="font-semibold text-sm">{option.label}</h4>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                    
                    {isSelected && (
                      <div className="absolute top-3 right-3 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tint Color */}
          {rxConfig.tintType && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Tint Color</p>
              <div className="grid grid-cols-3 gap-2">
                {(["Brown", "Grey", "Green"] as TintColor[]).map((color) => {
                  const isSelected = rxConfig.tintColor === color;

                  return (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                        "hover:border-primary",
                        isSelected ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <div className={cn("h-8 w-8 rounded-full", COLOR_SWATCHES[color])} />
                      <span className="text-xs font-medium">{color}</span>
                      {isSelected && (
                        <Check className="h-3 w-3 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shade Selection (Full Tint) */}
          {isFullTint && selectedColor && availableShades && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Tint Shade</p>
              <Select
                value={rxConfig.tintShadePercent?.toString() || availableShades[0].toString()}
                onValueChange={(value) => handleShadeSelect(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select shade" />
                </SelectTrigger>
                <SelectContent>
                  {availableShades.map((shade) => (
                    <SelectItem key={shade} value={shade.toString()}>
                      {shade}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Gradient Recipe Display */}
          {isGradient && selectedColor && gradientRecipe && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                {selectedColor} tint: <span className="font-medium text-foreground">{gradientRecipe}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Frame Type Display (read-only) */}
      <div className="pt-4 border-t">
        <div className="p-4 bg-muted/30 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <p className="text-sm font-semibold">Frame Type: {FRAME_TYPE_LABELS[detectedFrameType]}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Automatically detected from your frame. Edging fee included in pricing.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm disabled:opacity-50"
        >
          Continue to Review
        </Button>
      </div>
    </div>
  );
}

