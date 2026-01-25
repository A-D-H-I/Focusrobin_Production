"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Check, Palette, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type TintType,
  type TintColor,
  FULL_TINT_SHADES,
  GRADIENT_RECIPES,
  PRICES,
} from "@/lib/lensPricing";
import type { RxConfigData } from "../PrescriptionFlow";

interface Step5TintOptionsProps {
  rxConfig: RxConfigData;
  onConfigUpdate: (data: Partial<RxConfigData>) => void;
  onNext: () => void;
  onBack: () => void;
  formatPrice: (price: number) => string;
}

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
    pricePerPair: PRICES.tintPair.FULL_TINT_CATALOG,
  },
  {
    value: "GRADIENT",
    label: "Gradient Tint",
    description: "Fades from dark at top to lighter at bottom",
    pricePerPair: PRICES.tintPair.GRADIENT,
  },
];

// Color swatches for visual selection
const COLOR_SWATCHES: Record<TintColor, string> = {
  Brown: "bg-amber-700",
  Grey: "bg-gray-500",
  Green: "bg-green-700",
};

export default function Step5TintOptions({
  rxConfig,
  onConfigUpdate,
  onNext,
  onBack,
  formatPrice,
}: Step5TintOptionsProps) {
  const handleTintTypeSelect = (tintType: TintType) => {
    const update: Partial<RxConfigData> = { tintType };
    
    if (tintType === "GRADIENT") {
      // For gradient, set recipe automatically based on color
      if (rxConfig.tintColor && rxConfig.tintColor in GRADIENT_RECIPES) {
        update.tintRecipe = GRADIENT_RECIPES[rxConfig.tintColor];
      }
      update.tintShadePercent = undefined;
    } else if (tintType === "FULL_TINT_CATALOG") {
      // For full tint, reset recipe and set default shade if color exists
      update.tintRecipe = undefined;
      if (rxConfig.tintColor && rxConfig.tintColor in FULL_TINT_SHADES) {
        const shades = FULL_TINT_SHADES[rxConfig.tintColor];
        // Default to middle shade
        update.tintShadePercent = shades[Math.floor(shades.length / 2)];
      }
    }
    
    onConfigUpdate(update);
  };

  const handleColorSelect = (color: TintColor) => {
    const update: Partial<RxConfigData> = { tintColor: color };
    
    // Auto-set shade or recipe based on tint type
    if (rxConfig.tintType === "FULL_TINT_CATALOG") {
      const shades = FULL_TINT_SHADES[color];
      // Default to middle shade
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

  const isFullTint = rxConfig.tintType === "FULL_TINT_CATALOG";
  const isGradient = rxConfig.tintType === "GRADIENT";
  const selectedColor = rxConfig.tintColor;
  const availableShades = selectedColor && isFullTint 
    ? FULL_TINT_SHADES[selectedColor] 
    : undefined;
  const gradientRecipe = selectedColor && isGradient
    ? GRADIENT_RECIPES[selectedColor]
    : undefined;

  // Get tint add-on price
  const tintAddOnPrice = rxConfig.tintType 
    ? PRICES.tintPair[rxConfig.tintType] 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">Step 5 of 7</p>
          <h2 className="text-2xl sm:text-3xl font-headline">Tint Options</h2>
        </div>
      </div>

      {/* Tint Type Options */}
      <div className="space-y-3">
        <h3 className="font-semibold">Tint Type</h3>
        <div className="grid gap-3">
          {TINT_TYPE_OPTIONS.map((option) => {
            const isSelected = rxConfig.tintType === option.value;

            return (
              <button
                key={option.value}
                onClick={() => handleTintTypeSelect(option.value)}
                className={cn(
                  "relative flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all text-left",
                  "hover:border-primary hover:bg-primary/5",
                  isSelected ? "border-primary bg-primary/10" : "border-border bg-background"
                )}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  {option.value === "GRADIENT" ? (
                    <Droplets className="h-5 w-5 text-primary" />
                  ) : (
                    <Palette className="h-5 w-5 text-primary" />
                  )}
                </div>
                
                <div className="flex-1 pr-8">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{option.label}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                  {option.pricePerPair > 0 && (
                    <p className="text-sm font-medium text-primary mt-1">
                      +{formatPrice(option.pricePerPair)} per pair
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Selection */}
      {rxConfig.tintType && (
        <div className="space-y-3 pt-4 border-t">
          <h3 className="font-semibold">Tint Color</h3>
          <p className="text-sm text-muted-foreground">Color does not affect pricing</p>
          <div className="grid grid-cols-3 gap-3">
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
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Shade Selection (only for Full Tint) */}
      {isFullTint && selectedColor && availableShades && (
        <div className="space-y-3 pt-4 border-t">
          <h3 className="font-semibold">Tint Shade</h3>
          <p className="text-sm text-muted-foreground">
            Select the shade intensity for {selectedColor} tint (does not affect pricing)
          </p>
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

      {/* Gradient Recipe Display (read-only) */}
      {isGradient && selectedColor && gradientRecipe && (
        <div className="pt-4 border-t">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">Gradient Recipe</h3>
            <p className="text-sm text-muted-foreground">
              {selectedColor} tint: <span className="font-medium text-foreground">{gradientRecipe}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              (Fades from top to bottom)
            </p>
          </div>
        </div>
      )}

      {/* Tint Price Display */}
      {rxConfig.tintType && (
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
            <span className="text-sm font-medium">Tint Add-on:</span>
            <span className="text-sm font-semibold text-primary">
              +{formatPrice(tintAddOnPrice)} per pair
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-4 border-t space-y-3">
        <Button
          onClick={onNext}
          disabled={!rxConfig.tintType || !rxConfig.tintColor}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold disabled:opacity-50"
        >
          Continue to Summary
        </Button>
      </div>
    </div>
  );
}
