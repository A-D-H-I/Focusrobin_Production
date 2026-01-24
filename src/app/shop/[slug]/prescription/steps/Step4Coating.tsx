"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Shield, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Coating,
  COATING_LABELS,
  getAllowedCoatings,
  getCoatingDeltaPair,
  getBasePairPrice,
} from "@/lib/lensPricing";
import type { RxConfigData } from "../PrescriptionFlow";

interface Step4CoatingProps {
  rxConfig: RxConfigData;
  onConfigUpdate: (data: Partial<RxConfigData>) => void;
  onNext: () => void;
  onBack: () => void;
  formatPrice: (price: number) => string;
  rxPriceResult: RxPriceResult;
  framePrice: number;
}

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

export default function Step4Coating({
  rxConfig,
  onConfigUpdate,
  onNext,
  onBack,
  formatPrice,
  rxPriceResult,
  framePrice,
}: Step4CoatingProps) {
  const allowedCoatings = getAllowedCoatings(rxConfig.lensType);
  const availableOptions = COATING_OPTIONS.filter(opt => allowedCoatings.includes(opt.value));

  const handleSelect = (coating: Coating) => {
    onConfigUpdate({ coating });
  };

  // Calculate price delta (difference from cheapest allowed coating)
  const getPriceDelta = (coating: Coating): number => {
    if (!rxConfig.lensType || !rxConfig.lensIndex) return 0;
    return getCoatingDeltaPair(rxConfig.lensType, rxConfig.lensIndex, coating);
  };

  // Get base pair price for a coating
  const getBasePrice = (coating: Coating): number => {
    if (!rxConfig.lensType || !rxConfig.lensIndex) return 0;
    return getBasePairPrice(rxConfig.lensType, rxConfig.lensIndex, coating);
  };

  // Get per-lens price for a coating (for display)
  // NOTE: Profit is added to the total in PrescriptionFlow, not to individual coating prices
  const getPerLensPrice = (coating: Coating): number => {
    if (!rxConfig.lensType || !rxConfig.lensIndex) return 0;
    const pairPrice = getBasePairPrice(rxConfig.lensType, rxConfig.lensIndex, coating);
    return pairPrice / 2; // Convert pair price to per-lens price
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-xs text-muted-foreground">Step 2 of 4</p>
          <h2 className="text-xl font-headline">Choose Coating</h2>
        </div>
      </div>

      {/* Coating Options */}
      <div className="grid gap-2">
        {availableOptions.map((option) => {
          const isSelected = rxConfig.coating === option.value;
          const Icon = option.icon;
          const delta = getPriceDelta(option.value);

          return (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
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
                    <h3 className="text-base font-semibold mb-0.5">{COATING_LABELS[option.value]}</h3>
                    <p className="text-xs text-muted-foreground mb-1">{option.description}</p>
                    {delta === 0 ? (
                      <p className="text-sm font-medium text-muted-foreground">
                        Included
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-primary">
                        +{formatPrice(delta)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {isSelected && (
                <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t">
        <Button
          onClick={onNext}
          className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm"
        >
          {rxConfig.lensType === "TINTED" ? "Continue to Tint Options" : "Continue to Frame Type"}
        </Button>
      </div>
    </div>
  );
}

