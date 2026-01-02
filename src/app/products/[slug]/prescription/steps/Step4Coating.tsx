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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">Step 2 of 4</p>
          <h2 className="text-2xl sm:text-3xl font-headline">Choose Coating</h2>
        </div>
      </div>

      {/* Coating Options */}
      <div className="grid gap-4">
        {availableOptions.map((option) => {
          const isSelected = rxConfig.coating === option.value;
          const Icon = option.icon;
          const delta = getPriceDelta(option.value);

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
                <h3 className="text-lg font-semibold mb-1">{COATING_LABELS[option.value]}</h3>
                <p className="text-sm text-muted-foreground mb-2">{option.description}</p>
                {delta === 0 ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Included
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Base price: {formatPrice(getBasePrice(option.value))} per pair
                    </p>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-primary">
                    +{formatPrice(delta)} per pair
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t space-y-3">
        <Button
          onClick={onNext}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          {rxConfig.lensType === "TINTED" ? "Continue to Tint Options" : "Continue to Frame Type"}
        </Button>
      </div>
    </div>
  );
}
