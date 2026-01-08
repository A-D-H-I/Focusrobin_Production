"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Product } from "@/lib/productData";
import { usePrice } from "@/hooks/usePrice";
import {
  type LensType,
  type LensIndex,
  type Coating,
  type TintType,
  type TintColor,
  normalizeSelection,
  type LensSelection,
  calculateLensPairTotal,
  getAllowedCoatings,
  getSupportedIndexes,
} from "@/lib/lensPricing";
import {
  type FrameType,
  calculateRxTotal,
  FIXED_PROFIT,
} from "@/lib/pricing/rx167";
import { detectFrameType } from "@/lib/pricing/detectFrameType";

// Step Components
import Step0Initial from "./steps/Step0Initial";
import Step1PrescriptionForm from "./steps/Step1PrescriptionForm";
import Step2Review from "./steps/Step2Review";
import Step3LensCategory from "./steps/Step3LensCategory";
import Step4Coating from "./steps/Step4Coating";
import Step5TintOptions from "./steps/Step5TintOptions";
import Step6FrameType from "./steps/Step6FrameType";
import Step7Summary from "./steps/Step7Summary";

interface PrescriptionFlowProps {
  product: Product;
  productSlug: string;
}

// Prescription data for vision correction
export type PrescriptionData = {
  od: {
    sph: string;
    cyl: string;
    axis: string;
  };
  os: {
    sph: string;
    cyl: string;
    axis: string;
  };
  pd: string;
  hasTwoPDs: boolean;
  hasPrism: boolean;
  savePrescription: boolean;
};

// Rx lens configuration data
export type RxConfigData = {
  lensType: LensType;
  lensIndex: LensIndex;
  coating: Coating;
  tintType?: TintType; // Only for TINTED
  tintColor?: TintColor; // Only for TINTED
  tintShadePercent?: number; // For Full Tint: 15, 30, 50, 70, or 85
  tintRecipe?: string; // For Gradient: "30->0", "50->0", or "90->15"
  photochromicColor?: "Brown" | "Grey"; // Only for PHOTOCHROMIC_SOLIS
  polarizedColor?: "Brown" | "Grey" | "Green"; // Only for POLARIZED_NUPOLAR
  frameType: FrameType;
};

// Combined data for storage
export type FullPrescriptionData = PrescriptionData & {
  rxConfig: RxConfigData;
  rxPriceBreakdown?: {
    lensesPair: number;
    edgingFee: number;
    profit: number;
    rxRetailNet: number;
    totalNet: number;
  };
};

const DEFAULT_PRESCRIPTION: PrescriptionData = {
  od: { sph: "0.00", cyl: "0.00", axis: "0" },
  os: { sph: "0.00", cyl: "0.00", axis: "0" },
  pd: "62",
  hasTwoPDs: false,
  hasPrism: false,
  savePrescription: false,
};

const DEFAULT_RX_CONFIG: RxConfigData = {
  lensType: "CLEAR",
  lensIndex: "1.67",
  coating: "UC",
  tintType: undefined,
  tintColor: undefined,
  tintShadePercent: undefined,
  tintRecipe: undefined,
  photochromicColor: undefined,
  polarizedColor: undefined,
  frameType: "FULL_FRAME",
};

export default function PrescriptionFlow({ product, productSlug }: PrescriptionFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatPrice, parseEurPrice } = usePrice();
  
  // Check if there's a step parameter
  const stepParam = searchParams.get('step');
  const initialStep = stepParam ? parseInt(stepParam) : 0;
  
  // Auto-detect frame type from product
  const detectedFrameType = detectFrameType(product);
  
  // Load existing prescription data if available
  const loadExistingData = (): { prescription: PrescriptionData; rxConfig: RxConfigData } => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(`prescription_${productSlug}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as FullPrescriptionData;
          return {
            prescription: {
              od: parsed.od,
              os: parsed.os,
              pd: parsed.pd,
              hasTwoPDs: parsed.hasTwoPDs,
              hasPrism: parsed.hasPrism,
              savePrescription: parsed.savePrescription,
            },
            rxConfig: {
              ...(parsed.rxConfig || DEFAULT_RX_CONFIG),
              // Always use detected frame type (auto-detected from product)
              frameType: detectedFrameType,
            },
          };
        } catch (error) {
          console.error('Error parsing prescription data:', error);
        }
      }
    }
    return { 
      prescription: DEFAULT_PRESCRIPTION, 
      rxConfig: {
        ...DEFAULT_RX_CONFIG,
        frameType: detectedFrameType,
      },
    };
  };

  const existingData = loadExistingData();
  
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData>(existingData.prescription);
  const [rxConfig, setRxConfig] = useState<RxConfigData>(existingData.rxConfig);

  // Update step if step param changes
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      const step = parseInt(stepParam);
      if (!isNaN(step) && step >= 0 && step <= 7) {
        setCurrentStep(step);
      }
    } else {
      // If no step param, reset to step 0
      setCurrentStep(0);
    }
  }, [searchParams]);

  const framePrice = parseEurPrice(product.price);

  // Convert RxConfigData to LensSelection for pricing
  const lensSelection: LensSelection = useMemo(() => {
    return normalizeSelection({
      lensType: rxConfig.lensType,
      lensIndex: rxConfig.lensIndex,
      coating: rxConfig.coating,
      tintType: rxConfig.tintType,
      tintColor: rxConfig.tintColor,
      tintShade: rxConfig.tintShadePercent,
      tintRecipe: rxConfig.tintRecipe,
      photochromicColor: rxConfig.photochromicColor,
      polarizedColor: rxConfig.polarizedColor,
    });
  }, [rxConfig]);

  // Calculate lens pair price using new pricing module
  const lensPairPrice = useMemo(() => {
    return calculateLensPairTotal(lensSelection);
  }, [lensSelection]);

  // Calculate Rx price based on current configuration (using old rx167 for edging/profit)
  const rxPriceResult = useMemo(() => {
    // Map new lens types to old categories for backward compatibility with rx167
    const oldLensCategory = 
      rxConfig.lensType === "CLEAR" || rxConfig.lensType === "TINTED" 
        ? "CLEAR_OR_TINT"
        : rxConfig.lensType === "PHOTOCHROMIC_SOLIS"
        ? "PHOTOCHROMIC_SOLIS"
        : "POLARIZED_NUPOLAR";
    
    const oldTintType = 
      rxConfig.lensType === "TINTED" && rxConfig.tintType === "FULL_TINT_CATALOG"
        ? "FULL_CATALOG"
        : rxConfig.lensType === "TINTED" && rxConfig.tintType === "GRADIENT"
        ? "GRADIENT"
        : "NONE";

    // Use lens pair price from new module, but still use rx167 for edging/profit calculation
    // We'll override the lensesPair in the result
    const result = calculateRxTotal({
      framePrice,
      lensCategory: oldLensCategory,
      coating: rxConfig.coating === "SERICUM_UV" ? "UC" : rxConfig.coating, // Map SERICUM_UV to UC for rx167
      tintType: oldTintType,
      frameType: rxConfig.frameType,
      fixedProfit: FIXED_PROFIT,
    });

    // Override with new pricing
    const edgingFee = result.breakdown.edgingFee;
    const rxAddOnNet = lensPairPrice + edgingFee;
    const rxRetailNet = rxAddOnNet + FIXED_PROFIT;
    const rxRetailGross = rxRetailNet * 1.21; // VAT
    const totalGross = framePrice + rxRetailGross;
    const totalNet = framePrice + rxRetailNet;

    return {
      breakdown: {
        ...result.breakdown,
        lensesPair: lensPairPrice,
        rxAddOnNet,
        rxRetailNet,
        rxRetailGross,
        profit: FIXED_PROFIT,
      },
      totalNet,
      totalGross,
    };
  }, [framePrice, rxConfig, lensPairPrice]);

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    // Update URL to reflect current step (without causing page reload)
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const newSearchParams = new URLSearchParams(window.location.search);
      if (step === 0) {
        newSearchParams.delete('step');
      } else {
        newSearchParams.set('step', step.toString());
      }
      const newUrl = currentPath + (newSearchParams.toString() ? `?${newSearchParams.toString()}` : '');
      router.replace(newUrl, { scroll: false });
    }
  };

  const handlePrescriptionUpdate = (data: Partial<PrescriptionData>) => {
    setPrescriptionData(prev => ({ ...prev, ...data }));
  };

  const handleRxConfigUpdate = (data: Partial<RxConfigData>) => {
    setRxConfig(prev => {
      const updated = { ...prev, ...data };
      
      // Normalize selection to auto-correct invalid combinations
      const tempSelection: LensSelection = {
        lensType: updated.lensType,
        lensIndex: updated.lensIndex || "1.67",
        coating: updated.coating,
        tintType: updated.tintType,
        tintColor: updated.tintColor,
        tintShade: updated.tintShadePercent,
        tintRecipe: updated.tintRecipe,
        photochromicColor: updated.photochromicColor,
        polarizedColor: updated.polarizedColor,
      };
      
      const normalized = normalizeSelection(tempSelection);
      
      // Apply normalized values
      updated.lensIndex = normalized.lensIndex;
      updated.coating = normalized.coating;
      updated.tintType = normalized.tintType;
      updated.tintColor = normalized.tintColor;
      updated.tintShadePercent = normalized.tintShade;
      updated.tintRecipe = normalized.tintRecipe;
      updated.photochromicColor = normalized.photochromicColor;
      updated.polarizedColor = normalized.polarizedColor;
      
      return updated;
    });
  };

  const handleFinalSubmit = () => {
    // Combine all data for storage
    const fullData: FullPrescriptionData = {
      ...prescriptionData,
      rxConfig,
      rxPriceBreakdown: {
        lensesPair: rxPriceResult.breakdown.lensesPair,
        edgingFee: rxPriceResult.breakdown.edgingFee,
        profit: rxPriceResult.breakdown.profit,
        rxRetailNet: rxPriceResult.breakdown.rxRetailNet,
        totalNet: rxPriceResult.totalNet,
      },
    };

    // Store prescription data
    const dataString = JSON.stringify(fullData);
    sessionStorage.setItem(`prescription_${productSlug}`, dataString);
    
    // Dispatch custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('prescription-saved'));
    }
    
    router.push(`/shop/${productSlug}/prescription/confirmation`);
  };

  // Determine next step after coating selection
  const getNextStepAfterCoating = () => {
    if (rxConfig.lensType === "TINTED") {
      return 5; // Go to tint options
    }
    return 6; // Skip to frame type
  };

  // Step navigation helpers
  const goToNextFromLensCategory = () => {
    handleStepChange(4); // Always go to coating next
  };

  const goToNextFromCoating = () => {
    handleStepChange(getNextStepAfterCoating());
  };

  const goBackFromTintOptions = () => {
    handleStepChange(4); // Back to coating
  };

  const goBackFromFrameType = () => {
    if (rxConfig.lensType === "TINTED") {
      handleStepChange(5); // Back to tint options
    } else {
      handleStepChange(4); // Back to coating
    }
  };

  // Expose rxConfig for image processing (via context or props)
  // For now, we'll use a custom event to sync with image component
  
  useEffect(() => {
    // Dispatch rxConfig changes to image component
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rx-config-updated', {
        detail: rxConfig
      }));
    }
  }, [rxConfig]);

  return (
    <div className="bg-card border rounded-lg p-6 min-h-[600px]">
      {/* Step 0: Initial - Show product info and Add Prescription button */}
      {currentStep === 0 && (
        <Step0Initial
          product={product}
          priceInEur={framePrice}
          formatPrice={formatPrice}
          onAddPrescription={() => handleStepChange(1)}
          prescriptionData={prescriptionData}
          rxConfig={rxConfig}
          rxPriceResult={rxPriceResult}
          onEditPrescription={() => handleStepChange(1)}
          onChooseLens={() => handleStepChange(3)}
        />
      )}

      {/* Step 1: Prescription Form - Enter SPH, CYL, AXIS, PD */}
      {currentStep === 1 && (
        <Step1PrescriptionForm
          prescriptionData={prescriptionData}
          onDataUpdate={handlePrescriptionUpdate}
          onNext={() => handleStepChange(2)}
          onBack={() => handleStepChange(0)}
        />
      )}

      {/* Step 2: Review prescription data */}
      {currentStep === 2 && (
        <Step2Review
          prescriptionData={prescriptionData}
          onConfirm={() => handleStepChange(3)}
          onBack={() => handleStepChange(1)}
        />
      )}

      {/* Step 3: Choose Lens Type (Clear, Tinted, Photochromic, Polarized) */}
      {currentStep === 3 && (
        <Step3LensCategory
          rxConfig={rxConfig}
          onConfigUpdate={handleRxConfigUpdate}
          onNext={goToNextFromLensCategory}
          onBack={() => handleStepChange(2)}
          formatPrice={formatPrice}
        />
      )}

      {/* Step 4: Choose Coating */}
      {currentStep === 4 && (
        <Step4Coating
          rxConfig={rxConfig}
          onConfigUpdate={handleRxConfigUpdate}
          onNext={goToNextFromCoating}
          onBack={() => handleStepChange(3)}
          formatPrice={formatPrice}
        />
      )}

      {/* Step 5: Tint Options (only if TINTED selected) */}
      {currentStep === 5 && rxConfig.lensType === "TINTED" && (
        <Step5TintOptions
          rxConfig={rxConfig}
          onConfigUpdate={handleRxConfigUpdate}
          onNext={() => handleStepChange(6)}
          onBack={goBackFromTintOptions}
          formatPrice={formatPrice}
        />
      )}

      {/* Step 6: Frame Type (auto-detected) */}
      {currentStep === 6 && (
        <Step6FrameType
          product={product}
          rxConfig={rxConfig}
          onConfigUpdate={handleRxConfigUpdate}
          onNext={() => handleStepChange(7)}
          onBack={goBackFromFrameType}
          rxPriceResult={rxPriceResult}
          formatPrice={formatPrice}
        />
      )}

      {/* Step 7: Summary with full price breakdown */}
      {currentStep === 7 && (
        <Step7Summary
          product={product}
          prescriptionData={prescriptionData}
          rxConfig={rxConfig}
          rxPriceResult={rxPriceResult}
          framePrice={framePrice}
          formatPrice={formatPrice}
          onConfirm={handleFinalSubmit}
          onBack={() => handleStepChange(6)}
          onEditPrescription={() => handleStepChange(1)}
          onEditLens={() => handleStepChange(3)}
        />
      )}
    </div>
  );
}
