"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Package } from "lucide-react";
import {
  type FrameType,
  type RxPriceResult,
  FRAME_TYPE_LABELS,
  PRICES,
} from "@/lib/pricing/rx167";
import type { RxConfigData } from "../PrescriptionFlow";
import type { Product } from "@/lib/productData";
import { detectFrameType } from "@/lib/pricing/detectFrameType";

interface Step6FrameTypeProps {
  product: Product;
  rxConfig: RxConfigData;
  onConfigUpdate: (data: Partial<RxConfigData>) => void;
  onNext: () => void;
  onBack: () => void;
  rxPriceResult: RxPriceResult;
  formatPrice: (price: number) => string;
}

export default function Step6FrameType({
  product,
  rxConfig,
  onConfigUpdate,
  onNext,
  onBack,
  rxPriceResult,
  formatPrice,
}: Step6FrameTypeProps) {
  // Auto-detect frame type from product
  const detectedFrameType = detectFrameType(product);
  
  // Ensure frame type is set to detected value
  if (rxConfig.frameType !== detectedFrameType) {
    onConfigUpdate({ frameType: detectedFrameType });
  }

  const frameTypeInfo = {
    value: detectedFrameType,
    label: FRAME_TYPE_LABELS[detectedFrameType],
    price: PRICES.edging[detectedFrameType],
    description: 
      detectedFrameType === "FULL_FRAME" 
        ? "Standard full rim frame - lenses fully enclosed"
        : detectedFrameType === "NYLON_FRAME"
        ? "Semi-rimless with nylon cord holding lenses"
        : detectedFrameType === "RIMLESS_PRESSING"
        ? "Frameless design with plastic mounting"
        : detectedFrameType === "RIMLESS_INDIVIDUAL"
        ? "Frameless with custom individual mount points"
        : "Premium or complex frame mounting",
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-xs text-muted-foreground">Step 4 of 4</p>
          <h2 className="text-xl font-headline">Frame Type</h2>
        </div>
      </div>

      <p className="text-muted-foreground">
        Frame type detected from your sunglasses. This determines the lens edging and mounting method.
      </p>

      {/* Detected Frame Type Display */}
      <div className="border-2 border-primary rounded-xl p-6 bg-primary/5 space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">{frameTypeInfo.label}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{frameTypeInfo.description}</p>
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-sm font-medium text-muted-foreground">Edging Fee:</span>
              <span className="text-lg font-bold text-primary">{formatPrice(frameTypeInfo.price)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Frame Material Info */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium">Frame Details</p>
        <div className="text-sm space-y-1 text-muted-foreground">
          <p><span className="font-medium">Frame Material:</span> {product.frameMaterial}</p>
          {product.description && (
            <p className="line-clamp-2">
              <span className="font-medium">Description:</span> {product.description.substring(0, 150)}
              {product.description.length > 150 ? "..." : ""}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t space-y-2">
        <Button
          onClick={onNext}
          className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm"
        >
          Continue to Review
        </Button>
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full h-10 text-sm"
        >
          Back
        </Button>
      </div>
    </div>
  );
}

