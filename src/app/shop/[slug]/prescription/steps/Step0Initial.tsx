    "use client";

import { Button } from "@/components/ui/button";
import { Plus, Edit, Glasses } from "lucide-react";
import type { Product } from "@/lib/productData";
import type { PrescriptionData, RxConfigData } from "../PrescriptionFlow";
import {
  type RxPriceResult,
} from "@/lib/pricing/rx167";

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
  // Check if we have actual prescription data (not defaults)
  // Must have PD filled (required field) to be considered a valid prescription
  const hasPrescription = prescriptionData && 
    prescriptionData.od && 
    prescriptionData.os &&
    // Check if PD is filled (required field)
    ((prescriptionData.pd && prescriptionData.pd !== "") ||
     (prescriptionData.hasTwoPDs && prescriptionData.pdOd && prescriptionData.pdOd !== "" && prescriptionData.pdOs && prescriptionData.pdOs !== ""));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline mb-4">{product.name}</h1>
      </div>

      {hasPrescription ? (
        <div className="space-y-4">
          {/* Prescription Summary Table */}
          <div className="border rounded-lg bg-muted/30">
            <div className="p-4 border-b bg-muted">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Glasses className="h-5 w-5" />
                Prescription Added
              </h3>
            </div>
            
            {/* Main Prescription Table */}
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium">Eye</th>
                  <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">SPH</th>
                  <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">CYL</th>
                  <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">AXIS</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 sm:p-3 font-medium text-xs sm:text-sm">OD (Right)</td>
                  <td className="p-2 sm:p-3 text-center text-xs sm:text-sm">{prescriptionData.od.sph}</td>
                  <td className="p-2 sm:p-3 text-center text-xs sm:text-sm">{prescriptionData.od.cyl}</td>
                  <td className="p-2 sm:p-3 text-center text-xs sm:text-sm">{prescriptionData.od.axis}</td>
                </tr>
                <tr>
                  <td className="p-2 sm:p-3 font-medium text-xs sm:text-sm">OS (Left)</td>
                  <td className="p-2 sm:p-3 text-center text-xs sm:text-sm">{prescriptionData.os.sph}</td>
                  <td className="p-2 sm:p-3 text-center text-xs sm:text-sm">{prescriptionData.os.cyl}</td>
                  <td className="p-2 sm:p-3 text-center text-xs sm:text-sm">{prescriptionData.os.axis}</td>
                </tr>
              </tbody>
            </table>

            {/* PD Section */}
            <div className="p-3 sm:p-4 border-t">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">PD (Pupillary Distance)</span>
                <span className="text-xs sm:text-sm font-medium break-words">
                  {prescriptionData.hasTwoPDs ? (
                    <>
                      OD: {prescriptionData.pdOd && prescriptionData.pdOd !== "" ? `${prescriptionData.pdOd} mm` : "N/A"} | 
                      OS: {prescriptionData.pdOs && prescriptionData.pdOs !== "" ? `${prescriptionData.pdOs} mm` : "N/A"}
                    </>
                  ) : (
                    <>
                      {prescriptionData.pd && prescriptionData.pd !== "" ? `${prescriptionData.pd} mm` : "Not set"}
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Prism Section - Show if hasPrism is true */}
            {prescriptionData.hasPrism && (
              <div className="p-3 sm:p-4 border-t">
                <h4 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3">Prism Correction</h4>
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="p-1.5 sm:p-2 text-left text-[10px] sm:text-xs font-medium">Eye</th>
                      <th className="p-1.5 sm:p-2 text-center text-[10px] sm:text-xs font-medium">H. Prism</th>
                      <th className="p-1.5 sm:p-2 text-center text-[10px] sm:text-xs font-medium">Base</th>
                      <th className="p-1.5 sm:p-2 text-center text-[10px] sm:text-xs font-medium">V. Prism</th>
                      <th className="p-1.5 sm:p-2 text-center text-[10px] sm:text-xs font-medium">Base</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-1.5 sm:p-2 font-medium text-[10px] sm:text-xs">OD (Right)</td>
                      <td className="p-1.5 sm:p-2 text-center text-[10px] sm:text-xs">
                        {prescriptionData.od.prismHorizontal && prescriptionData.od.prismHorizontal !== "0.00" 
                          ? prescriptionData.od.prismHorizontal 
                          : "-"}
                      </td>
                      <td className="p-1.5 sm:p-2 text-center text-[10px] sm:text-xs">
                        {prescriptionData.od.prismHorizontalBase && prescriptionData.od.prismHorizontalBase !== "" 
                          ? prescriptionData.od.prismHorizontalBase 
                          : "-"}
                      </td>
                      <td className="p-1.5 sm:p-2 text-center text-[10px] sm:text-xs">
                        {prescriptionData.od.prismVertical && prescriptionData.od.prismVertical !== "0.00" 
                          ? prescriptionData.od.prismVertical 
                          : "-"}
                      </td>
                      <td className="p-1.5 sm:p-2 text-center text-[10px] sm:text-xs">
                        {prescriptionData.od.prismVerticalBase && prescriptionData.od.prismVerticalBase !== "" 
                          ? prescriptionData.od.prismVerticalBase 
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-1.5 sm:p-2 font-medium text-[10px] sm:text-xs">OS (Left)</td>
                      <td className="p-1.5 sm:p-2 text-center text-[10px] sm:text-xs">
                        {prescriptionData.os.prismHorizontal && prescriptionData.os.prismHorizontal !== "0.00" 
                          ? prescriptionData.os.prismHorizontal 
                          : "-"}
                      </td>
                      <td className="p-1.5 sm:p-2 text-center text-[10px] sm:text-xs">
                        {prescriptionData.os.prismHorizontalBase && prescriptionData.os.prismHorizontalBase !== "" 
                          ? prescriptionData.os.prismHorizontalBase 
                          : "-"}
                      </td>
                      <td className="p-1.5 sm:p-2 text-center text-[10px] sm:text-xs">
                        {prescriptionData.os.prismVertical && prescriptionData.os.prismVertical !== "0.00" 
                          ? prescriptionData.os.prismVertical 
                          : "-"}
                      </td>
                      <td className="p-1.5 sm:p-2 text-center text-[10px] sm:text-xs">
                        {prescriptionData.os.prismVerticalBase && prescriptionData.os.prismVerticalBase !== "" 
                          ? prescriptionData.os.prismVerticalBase 
                          : "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

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
              Choose Lens Options
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

