"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Eye } from "lucide-react";
import type { PrescriptionData } from "@/types/prescription";
import { type RxPriceResult } from "@/lib/pricing/rx167";

interface Step2ReviewProps {
  prescriptionData: PrescriptionData;
  onConfirm: () => void;
  onBack: () => void;
  rxPriceResult: RxPriceResult;
  framePrice: number;
  formatPrice: (price: number) => string;
}

export default function Step2Review({
  prescriptionData,
  onConfirm,
  onBack,
  rxPriceResult,
  framePrice,
  formatPrice,
}: Step2ReviewProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-headline">Review Prescription</h2>
          <p className="text-xs text-muted-foreground">Verify your prescription details before continuing</p>
        </div>
      </div>

      {/* Success indicator */}
      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
        <CheckCircle2 className="h-6 w-6 text-green-600" />
        <p className="text-green-800 dark:text-green-200 font-medium">
          Prescription details captured successfully
        </p>
      </div>

      {/* Prescription Details */}
      <div className="border rounded-lg overflow-hidden">
        <div className="p-4 bg-muted/50 flex items-center gap-2">
          <Eye className="h-5 w-5" />
          <h3 className="font-semibold">Your Prescription</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* OD (Right Eye) */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">OD (Right Eye)</h4>
            <div className="grid grid-cols-3 gap-4 bg-muted/30 p-3 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">SPH</p>
                <p className="font-mono font-semibold">{prescriptionData.od.sph}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">CYL</p>
                <p className="font-mono font-semibold">{prescriptionData.od.cyl}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">AXIS</p>
                <p className="font-mono font-semibold">{prescriptionData.od.axis}°</p>
              </div>
            </div>
          </div>

          {/* OS (Left Eye) */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">OS (Left Eye)</h4>
            <div className="grid grid-cols-3 gap-4 bg-muted/30 p-3 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">SPH</p>
                <p className="font-mono font-semibold">{prescriptionData.os.sph}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">CYL</p>
                <p className="font-mono font-semibold">{prescriptionData.os.cyl}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">AXIS</p>
                <p className="font-mono font-semibold">{prescriptionData.os.axis}°</p>
              </div>
            </div>
          </div>

          {/* PD */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Pupillary Distance (PD)</h4>
            {prescriptionData.hasTwoPDs ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">OD (Right)</p>
                  <p className="font-mono font-semibold">{prescriptionData.pdOd || "N/A"} mm</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">OS (Left)</p>
                  <p className="font-mono font-semibold">{prescriptionData.pdOs || "N/A"} mm</p>
                </div>
              </div>
            ) : (
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="font-mono font-semibold">{prescriptionData.pd} mm</p>
              </div>
            )}
          </div>

          {/* Prism Correction */}
          {prescriptionData.hasPrism && (
            <div className="space-y-2 pt-2 border-t">
              <h4 className="font-medium text-sm text-muted-foreground">Prism Correction</h4>
              <div className="space-y-3">
                {/* OD (Right) Prism */}
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">OD (Right)</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Horizontal</p>
                      <p className="font-mono font-semibold">
                        {prescriptionData.od.prismHorizontal || "0.00"}
                        {prescriptionData.od.prismHorizontalBase && ` ${prescriptionData.od.prismHorizontalBase}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Vertical</p>
                      <p className="font-mono font-semibold">
                        {prescriptionData.od.prismVertical || "0.00"}
                        {prescriptionData.od.prismVerticalBase && ` ${prescriptionData.od.prismVerticalBase}`}
                      </p>
                    </div>
                  </div>
                </div>
                {/* OS (Left) Prism */}
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">OS (Left)</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Horizontal</p>
                      <p className="font-mono font-semibold">
                        {prescriptionData.os.prismHorizontal || "0.00"}
                        {prescriptionData.os.prismHorizontalBase && ` ${prescriptionData.os.prismHorizontalBase}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Vertical</p>
                      <p className="font-mono font-semibold">
                        {prescriptionData.os.prismVertical || "0.00"}
                        {prescriptionData.os.prismVerticalBase && ` ${prescriptionData.os.prismVerticalBase}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Options */}
          {(prescriptionData.hasTwoPDs || prescriptionData.hasPrism) && (
            <div className="pt-2 border-t space-y-2">
              {prescriptionData.hasTwoPDs && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Two PD values specified</span>
                </div>
              )}
              {prescriptionData.hasPrism && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Prism correction included</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Frame Price Only */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Frame Price</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              Prescription lens pricing will be shown after selection
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{formatPrice(framePrice)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Including VAT</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t space-y-2">
        <Button
          onClick={onConfirm}
          className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm"
        >
          Continue to Lens Selection
        </Button>
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full h-10 text-sm"
        >
          Edit Prescription
        </Button>
      </div>
    </div>
  );
}

