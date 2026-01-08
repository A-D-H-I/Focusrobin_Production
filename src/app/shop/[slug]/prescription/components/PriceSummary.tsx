"use client";

import { type RxPriceResult } from "@/lib/pricing/rx167";

interface PriceSummaryProps {
  rxPriceResult: RxPriceResult;
  framePrice: number;
  formatPrice: (price: number) => string;
  className?: string;
}

export default function PriceSummary({
  rxPriceResult,
  framePrice,
  formatPrice,
  className = "",
}: PriceSummaryProps) {
  const { totalNet, breakdown } = rxPriceResult;
  
  // Show only lens price (rxRetailNet) until prescription is added
  // rxRetailNet = lensPairPrice + edgingFee (doesn't include frame)
  const displayPrice = breakdown.rxRetailNet || 0;
  const displayLabel = "Prescription Lenses";

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
        <div>
          <p className="text-sm font-medium text-foreground">Lens Price</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {displayLabel}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-primary">{formatPrice(displayPrice)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Including VAT</p>
        </div>
      </div>
    </div>
  );
}

