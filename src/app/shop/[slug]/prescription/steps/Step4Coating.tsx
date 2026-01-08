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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c913d761-7a80-4407-9ec9-0890b22819ca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Step4Coating.tsx:getPriceDelta',message:'Calculating price delta',data:{lensType:rxConfig.lensType,lensIndex:rxConfig.lensIndex,coating},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const delta = getCoatingDeltaPair(rxConfig.lensType, rxConfig.lensIndex, coating);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c913d761-7a80-4407-9ec9-0890b22819ca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Step4Coating.tsx:getPriceDelta',message:'Price delta result',data:{delta,coating},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return delta;
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
    const perLensPrice = pairPrice / 2; // Convert pair price to per-lens price
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c913d761-7a80-4407-9ec9-0890b22819ca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Step4Coating.tsx:getPerLensPrice',message:'Per-lens price calculated',data:{perLensPrice,pairPrice,coating,lensType:rxConfig.lensType,lensIndex:rxConfig.lensIndex},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return perLensPrice;
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
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/c913d761-7a80-4407-9ec9-0890b22819ca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Step4Coating.tsx:render',message:'Rendering coating option',data:{coating:option.value,delta,isSelected,lensType:rxConfig.lensType,lensIndex:rxConfig.lensIndex},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion

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
              {isSelected && (
                <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              
              <div className="flex-1 pr-6">
                <h3 className="text-base font-semibold mb-0.5">{COATING_LABELS[option.value]}</h3>
                <p className="text-xs text-muted-foreground mb-1">{option.description}</p>
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
                    {formatPrice(getPerLensPrice(option.value))} per lens
                  </p>
                )}
              </div>
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

