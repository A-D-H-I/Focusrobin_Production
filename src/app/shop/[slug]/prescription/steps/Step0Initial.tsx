    "use client";

import { Button } from "@/components/ui/button";
import { Plus, Edit, Glasses } from "lucide-react";
import type { Product } from "@/lib/productData";
import type { PrescriptionData, RxConfigData } from "../PrescriptionFlow";
import {
  type RxPriceResult,
  FRAME_TYPE_LABELS,
} from "@/lib/pricing/rx167";
import {
  LENS_TYPE_LABELS,
  COATING_LABELS,
} from "@/lib/lensPricing";

interface Step0InitialProps {
  product: Product;
  priceInEur: number;
  formatPrice: (price: number) => string;
  onAddPrescription: () => void;
  prescriptionData?: PrescriptionData | null;
  rxConfig?: RxConfigData | null;
  rxPriceResult?: RxPriceResult | null;
  onEditPrescription?: () => void;
  onChooseLens?: () => void;
}

export default function Step0Initial({ 
  product, 
  priceInEur, 
  formatPrice, 
  onAddPrescription,
  prescriptionData,
  rxConfig,
  rxPriceResult,
  onEditPrescription,
  onChooseLens
}: Step0InitialProps) {
  // Check if we have a complete prescription (not just defaults)
  const hasPrescription = prescriptionData && 
    prescriptionData.od && 
    prescriptionData.os &&
    (prescriptionData.od.sph !== "0.00" || prescriptionData.od.cyl !== "0.00");

  const hasLensConfig = rxConfig && rxConfig.lensType;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline mb-4">{product.name}</h1>
        <div className="flex items-center gap-4">
          <p className="text-3xl font-bold text-primary">{formatPrice(priceInEur)}</p>
          <span className="text-muted-foreground">Frame only</span>
        </div>
      </div>

      {hasPrescription ? (
        <div className="space-y-4">
          {/* Prescription Summary */}
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Glasses className="h-5 w-5" />
                Prescription Added
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="font-medium text-muted-foreground mb-1">OD (Right)</p>
                  <p className="text-foreground">
                    SPH: {prescriptionData.od.sph} | CYL: {prescriptionData.od.cyl} | AXIS: {prescriptionData.od.axis}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground mb-1">OS (Left)</p>
                  <p className="text-foreground">
                    SPH: {prescriptionData.os.sph} | CYL: {prescriptionData.os.cyl} | AXIS: {prescriptionData.os.axis}
                  </p>
                </div>
              </div>
              <div>
                <p className="font-medium text-muted-foreground mb-1">PD</p>
                {prescriptionData.hasTwoPDs ? (
                  <p className="text-foreground">OD: {prescriptionData.pdOd || "N/A"} mm | OS: {prescriptionData.pdOs || "N/A"} mm</p>
                ) : (
                  <p className="text-foreground">{prescriptionData.pd} mm</p>
                )}
              </div>
            </div>
          </div>

          {/* Lens Config Summary (if exists) */}
          {hasLensConfig && rxPriceResult && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <h3 className="font-semibold">Lens Configuration</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lens Type:</span>
                  <span>{LENS_TYPE_LABELS[rxConfig.lensType]}</span>
                </div>
                {rxConfig.lensIndex && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lens Index:</span>
                    <span>{rxConfig.lensIndex}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coating:</span>
                  <span>{COATING_LABELS[rxConfig.coating]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frame Type:</span>
                  <span>{FRAME_TYPE_LABELS[rxConfig.frameType]}</span>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between font-semibold">
                  <span>Total with Rx:</span>
                  <span className="text-primary">{formatPrice(rxPriceResult.totalNet)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-full text-base font-semibold"
              onClick={onEditPrescription || onAddPrescription}
            >
              <Edit className="mr-2 h-5 w-5" />
              Edit Prescription
            </Button>
            
            <Button
              size="lg"
              className="h-12 w-full text-base font-semibold"
              onClick={onChooseLens || (() => {})}
            >
              {hasLensConfig ? "Change Lens Options" : "Choose Lens Options"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="pt-8 space-y-4">
          <div className="text-center p-6 bg-muted/30 rounded-lg">
            <Glasses className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Add Prescription Lenses</h3>
            <p className="text-sm text-muted-foreground">
              Turn your sunglasses into prescription eyewear with our custom lens service
            </p>
          </div>
          <Button
            size="lg"
            className="h-12 w-full text-base font-semibold"
            onClick={onAddPrescription}
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Prescription
          </Button>
        </div>
      )}
    </div>
  );
}

