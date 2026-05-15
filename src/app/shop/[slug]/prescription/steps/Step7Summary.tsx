"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Edit, Package, FileText, Download } from "lucide-react";
import type { Product } from "@/lib/productData";
import {
  type RxPriceResult,
  FRAME_TYPE_LABELS,
} from "@/lib/pricing/rx167";
import {
  LENS_BUNDLE_LABELS,
  type LensBundle,
} from "@/lib/lensPricing";
import type { PrescriptionData, RxConfigData, FullPrescriptionData } from "@/types/prescription";
import { useSession } from "next-auth/react";
import { getUserPrescription } from "@/app/actions/prescription";

interface Step7SummaryProps {
  product: Product;
  prescriptionData: PrescriptionData;
  rxConfig: RxConfigData;
  rxPriceResult: RxPriceResult;
  framePrice: number;
  formatPrice: (price: number) => string;
  onConfirm: () => void;
  onBack: () => void;
  onEditPrescription: () => void;
  onEditLens: () => void;
  onEditThickness?: () => void;
  productSlug: string;
}

export default function Step7Summary({
  product,
  prescriptionData: initialPrescriptionData,
  rxConfig: initialRxConfig,
  rxPriceResult,
  framePrice,
  formatPrice,
  onConfirm,
  onBack,
  onEditPrescription,
  onEditLens,
  onEditThickness,
  productSlug,
}: Step7SummaryProps) {
  const { breakdown, totalNet } = rxPriceResult;
  const { data: session } = useSession();
  const [prescriptionData, setPrescriptionData] = useState(initialPrescriptionData);
  const [rxConfig, setRxConfig] = useState(initialRxConfig);
  
  // Calculate the base lenses price by separating the thickness upgrade
  // The `breakdown.lensesPair` already includes the 60€ upgrade
  const thicknessUpgradePrice = rxConfig.lensThickness === "THINNER" ? 60.00 : 0;
  const baseLensesPairPrice = breakdown.lensesPair - thicknessUpgradePrice;

  const standardIndex = rxConfig.lensBundle === "PHOTOCHROMIC" ? "1.56" : "1.60";

  // Load prescription data from database/localStorage when component mounts
  // BUT: If a PDF was uploaded (isPdfMode=true), skip loading and use the props directly
  useEffect(() => {
    // If PDF mode is already set in initial data, don't reload from storage/DB
    // This prevents the PDF uploaded state from being overwritten
    if (initialPrescriptionData.isPdfMode && initialPrescriptionData.prescriptionPdfUrl) {
      console.log('[Step7Summary] PDF mode detected in props, skipping data reload');
      setPrescriptionData(initialPrescriptionData);
      return;
    }

    const loadPrescriptionData = async () => {
      let loadedPrescriptionData: PrescriptionData | null = null;
      let loadedRxConfig: RxConfigData | null = null;

      // 1. Try sessionStorage first (most recent, product-specific)
      if (typeof window !== 'undefined') {
        const sessionKey = `prescription_${productSlug}`;
        const sessionStored = sessionStorage.getItem(sessionKey);

        if (sessionStored) {
          try {
            const parsed = JSON.parse(sessionStored) as FullPrescriptionData;
            // FullPrescriptionData has od, os, pd directly (not nested)
            if (parsed.od && parsed.os) {
              loadedPrescriptionData = {
                od: parsed.od,
                os: parsed.os,
                pd: parsed.pd || "",
                pdOd: parsed.pdOd || "",
                pdOs: parsed.pdOs || "",
                hasTwoPDs: parsed.hasTwoPDs || false,
                hasPrism: parsed.hasPrism || false,
                prescriptionPdfUrl: (parsed as any).prescriptionPdfUrl,
                isPdfMode: (parsed as any).isPdfMode || false,
              };
            }
            if (parsed.rxConfig) {
              loadedRxConfig = parsed.rxConfig;
              console.log('[Step7Summary] Loaded from sessionStorage');
            }
          } catch (error) {
            console.error('Error parsing prescription data from sessionStorage:', error);
          }
        }
      }

      // 2. If not in sessionStorage, try database (for logged-in users)
      if (!loadedPrescriptionData && session?.user) {
        try {
          const result = await getUserPrescription(productSlug);
          if (result && 'prescription' in result && result.prescription) {
            const dbData = result.prescription;
            loadedPrescriptionData = {
              od: dbData.od,
              os: dbData.os,
              pd: dbData.pd || "",
              pdOd: dbData.pdOd || "",
              pdOs: dbData.pdOs || "",
              hasTwoPDs: dbData.hasTwoPDs || false,
              hasPrism: dbData.hasPrism || false,
              prescriptionPdfUrl: (dbData as any).prescriptionPdfUrl,
              isPdfMode: (dbData as any).isPdfMode || false,
            };
            console.log('[Step7Summary] Loaded prescription from database');
          }
        } catch (error) {
          console.error('Error loading prescription from database:', error);
        }
      }

      // 3. If still not found, try localStorage (shared prescription)
      if (!loadedPrescriptionData && typeof window !== 'undefined') {
        const storageKey = session?.user
          ? `prescription_user_${(session.user as any).id}`
          : 'prescription_shared';
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as FullPrescriptionData;
            if (parsed.od && parsed.os) {
              loadedPrescriptionData = {
                od: parsed.od,
                os: parsed.os,
                pd: parsed.pd || "",
                pdOd: parsed.pdOd || "",
                pdOs: parsed.pdOs || "",
                hasTwoPDs: parsed.hasTwoPDs || false,
                hasPrism: parsed.hasPrism || false,
                prescriptionPdfUrl: (parsed as any).prescriptionPdfUrl,
                isPdfMode: (parsed as any).isPdfMode || false,
              };
              console.log('[Step7Summary] Loaded prescription from localStorage');
            }
          } catch (error) {
            console.error('Error parsing prescription data from localStorage:', error);
          }
        }
      }

      // 4. Always check localStorage for rxConfig (product-specific) - this is the source of truth
      if (typeof window !== 'undefined') {
        const productRxConfigKey = `rxConfig_${productSlug}`;
        const storedRxConfig = localStorage.getItem(productRxConfigKey);
        if (storedRxConfig) {
          try {
            loadedRxConfig = JSON.parse(storedRxConfig) as RxConfigData;
            console.log('[Step7Summary] Loaded rxConfig from localStorage');
          } catch (error) {
            console.error('Error parsing rxConfig from localStorage:', error);
          }
        }
      }

      // Update state with loaded data
      if (loadedPrescriptionData) {
        setPrescriptionData(loadedPrescriptionData);
      }
      if (loadedRxConfig) {
        setRxConfig(loadedRxConfig);
      }
    };

    loadPrescriptionData();
  }, [productSlug, session?.user]); // Reload when productSlug or session changes

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-xs text-muted-foreground">Order Summary</p>
          <h2 className="text-xl font-headline">Review Your Order</h2>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
        <Package className="h-8 w-8 text-muted-foreground" />
        <div className="flex-1">
          <h3 className="font-semibold">{product.name}</h3>
          <p className="text-sm text-muted-foreground">Frame</p>
        </div>
        <p className="font-semibold">{formatPrice(framePrice)}</p>
      </div>

      {/* Prescription Summary */}
      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-muted/50">
          <h3 className="font-semibold">Prescription</h3>
          <Button variant="ghost" size="sm" onClick={onEditPrescription} className="h-8">
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
        </div>
        <div className="p-4 space-y-3">
          {/* Check for PDF mode */}
          {prescriptionData.isPdfMode && prescriptionData.prescriptionPdfUrl ? (
            // PDF Mode - Show PDF uploaded message
            <div className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-blue-800 dark:text-blue-200">Prescription PDF Uploaded</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Document will be sent to lens manufacturer
                </p>
              </div>
              {prescriptionData.prescriptionPdfUrl && (
                <a
                  href={prescriptionData.prescriptionPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <Download className="h-4 w-4" />
                </a>
              )}
            </div>
          ) : (
            // Manual Entry Mode - Show prescription values
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground mb-1">OD (Right Eye)</p>
                  <p>SPH: {prescriptionData.od.sph} | CYL: {prescriptionData.od.cyl} | AXIS: {prescriptionData.od.axis}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground mb-1">OS (Left Eye)</p>
                  <p>SPH: {prescriptionData.os.sph} | CYL: {prescriptionData.os.cyl} | AXIS: {prescriptionData.os.axis}</p>
                </div>
              </div>
              <div className="text-sm">
                <p className="font-medium text-muted-foreground mb-1">Pupillary Distance (PD)</p>
                {prescriptionData.hasTwoPDs ? (
                  <p>OD: {prescriptionData.pdOd || "N/A"} mm | OS: {prescriptionData.pdOs || "N/A"} mm</p>
                ) : (
                  <p>{prescriptionData.pd} mm</p>
                )}
              </div>
              {prescriptionData.hasPrism && (
                <div className="text-sm pt-2 border-t">
                  <p className="font-medium text-muted-foreground mb-2">Prism Correction</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">OD (Right)</p>
                      <p className="text-xs">
                        Horizontal: {prescriptionData.od.prismHorizontal || "0.00"}
                        {prescriptionData.od.prismHorizontalBase && ` ${prescriptionData.od.prismHorizontalBase}`} |
                        Vertical: {prescriptionData.od.prismVertical || "0.00"}
                        {prescriptionData.od.prismVerticalBase && ` ${prescriptionData.od.prismVerticalBase}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">OS (Left)</p>
                      <p className="text-xs">
                        Horizontal: {prescriptionData.os.prismHorizontal || "0.00"}
                        {prescriptionData.os.prismHorizontalBase && ` ${prescriptionData.os.prismHorizontalBase}`} |
                        Vertical: {prescriptionData.os.prismVertical || "0.00"}
                        {prescriptionData.os.prismVerticalBase && ` ${prescriptionData.os.prismVerticalBase}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lens Configuration Summary */}
      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-muted/50">
          <h3 className="font-semibold">Lens Configuration</h3>
          <Button variant="ghost" size="sm" onClick={onEditLens} className="h-8">
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
        </div>
        <div className="p-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Lens Package:</span>
            <span className="font-medium">{LENS_BUNDLE_LABELS[rxConfig.lensBundle]}</span>
          </div>

          {/* Color for Photochromic */}
          {rxConfig.lensBundle === "PHOTOCHROMIC" && rxConfig.photochromicColor && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Color:</span>
              <span className="font-medium">{rxConfig.photochromicColor}</span>
            </div>
          )}

          {/* Color for Sunglasses */}
          {(rxConfig.lensBundle === "SUNGLASSES_TINT" || rxConfig.lensBundle === "SUNGLASSES_GRADIENT") && rxConfig.tintColor && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tint Color:</span>
              <span className="font-medium">{rxConfig.tintColor}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-muted-foreground">Frame Type:</span>
            <span className="font-medium">{FRAME_TYPE_LABELS[rxConfig.frameType]}</span>
          </div>

          {/* Thickness */}
          {rxConfig.lensThickness && (
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-muted-foreground">Lens Thickness:</span>
              <span className="font-medium">
                {rxConfig.lensThickness === 'THINNER' ? 'Thinner Lens' : `${standardIndex} Standard Lens`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="border rounded-lg overflow-hidden">
        <div className="p-4 bg-muted/50">
          <h3 className="font-semibold">Price Breakdown</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Frame</span>
            <span>{formatPrice(framePrice)}</span>
          </div>
          <div className="border-t pt-3 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Prescription Lenses</p>
            <div className="flex justify-between text-sm pl-4">
              <span>Lenses (pair)</span>
              <span>{formatPrice(baseLensesPairPrice)}</span>
            </div>
            {rxConfig.lensType === "TINTED" && rxConfig.tintType && (
              <div className="flex justify-between text-sm pl-4">
                <span>Tint Add-on</span>
                <span>
                  {formatPrice(
                    rxConfig.tintType === "FULL_TINT_CATALOG" ? 6.00 : 12.00
                  )}
                </span>
              </div>
            )}
            {rxConfig.lensThickness === "THINNER" && (
              <div className="flex justify-between text-sm pl-4">
                <span>Thinner Lens Upgrade</span>
                <span>{formatPrice(60.00)}</span>
              </div>
            )}
          </div>
          <div className="border-t pt-3 flex justify-between text-sm">
            <span>Rx Add-on Subtotal</span>
            <span>{formatPrice(breakdown.rxRetailNet)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">{formatPrice(totalNet)}</span>
          </div>
        </div>
      </div>

      {/* Confirmation */}
      <div className="pt-2 border-t space-y-2">
        <Button
          onClick={onConfirm}
          className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm"
        >
          <Check className="mr-2 h-4 w-4" />
          Confirm Selections - {formatPrice(totalNet)}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Your prescription lenses will be custom-made for you
        </p>
      </div>
    </div>
  );
}

