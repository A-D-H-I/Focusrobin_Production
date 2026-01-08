"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Product } from "@/lib/productData";
import { usePrice } from "@/hooks/usePrice";
import { usePrescriptionPrice } from "./context/PrescriptionPriceContext";
import { saveUserPrescription, getUserPrescription } from "@/app/actions/prescription";
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
    prismHorizontal?: string;
    prismHorizontalBase?: string;
    prismVertical?: string;
    prismVerticalBase?: string;
  };
  os: {
    sph: string;
    cyl: string;
    axis: string;
    prismHorizontal?: string;
    prismHorizontalBase?: string;
    prismVertical?: string;
    prismVerticalBase?: string;
  };
  pd: string; // Single PD value (used when hasTwoPDs is false)
  pdOd?: string; // Right eye PD (used when hasTwoPDs is true)
  pdOs?: string; // Left eye PD (used when hasTwoPDs is true)
  hasTwoPDs: boolean;
  hasPrism: boolean;
  prescriptionImageUrl?: string; // URL to uploaded prescription image (S3 link)
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
  od: { 
    sph: "0.00", 
    cyl: "0.00", 
    axis: "0",
    prismHorizontal: "0.00",
    prismHorizontalBase: "",
    prismVertical: "0.00",
    prismVerticalBase: "",
  },
  os: { 
    sph: "0.00", 
    cyl: "0.00", 
    axis: "0",
    prismHorizontal: "0.00",
    prismHorizontalBase: "",
    prismVertical: "0.00",
    prismVerticalBase: "",
  },
  pd: "62",
  pdOd: "31",
  pdOs: "31",
  hasTwoPDs: false,
  hasPrism: false,
  prescriptionImageUrl: undefined,
};

const DEFAULT_RX_CONFIG: RxConfigData = {
  lensType: "CLEAR",
  lensIndex: "1.56",
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
  const { data: session } = useSession();
  const { formatPrice, parseEurPrice } = usePrice();
  const { setPriceData } = usePrescriptionPrice();
  
  // Check if there's a step parameter
  const stepParam = searchParams.get('step');
  const initialStep = stepParam ? parseInt(stepParam) : 0;
  
  // Auto-detect frame type from product
  const detectedFrameType = detectFrameType(product);
  
  // Load existing prescription data if available
  const [existingData, setExistingData] = useState<{ prescription: PrescriptionData; rxConfig: RxConfigData }>({
    prescription: DEFAULT_PRESCRIPTION,
    rxConfig: {
      ...DEFAULT_RX_CONFIG,
      frameType: detectedFrameType,
    },
  });

  // Load prescription data on mount (from DB if logged in, localStorage if not)
  useEffect(() => {
    const loadData = async () => {
      let loadedData: FullPrescriptionData | null = null;

      // If user is logged in, try to load from database
      if (session?.user) {
        try {
          const result = await getUserPrescription(productSlug);
          if (result.prescription) {
            loadedData = result.prescription;
          }
        } catch (error) {
          console.error('Error loading prescription from database:', error);
        }
      }

      // If not found in DB or not logged in, try localStorage
      if (!loadedData && typeof window !== 'undefined') {
        const stored = localStorage.getItem(`prescription_${productSlug}`);
        if (stored) {
          try {
            loadedData = JSON.parse(stored) as FullPrescriptionData;
          } catch (error) {
            console.error('Error parsing prescription data from localStorage:', error);
          }
        }
      }

      // Set loaded data
      if (loadedData) {
        setExistingData({
          prescription: {
            od: {
              ...loadedData.od,
              prismHorizontal: loadedData.od.prismHorizontal || "0.00",
              prismHorizontalBase: loadedData.od.prismHorizontalBase || "",
              prismVertical: loadedData.od.prismVertical || "0.00",
              prismVerticalBase: loadedData.od.prismVerticalBase || "",
            },
            os: {
              ...loadedData.os,
              prismHorizontal: loadedData.os.prismHorizontal || "0.00",
              prismHorizontalBase: loadedData.os.prismHorizontalBase || "",
              prismVertical: loadedData.os.prismVertical || "0.00",
              prismVerticalBase: loadedData.os.prismVerticalBase || "",
            },
            pd: loadedData.pd,
            pdOd: loadedData.pdOd,
            pdOs: loadedData.pdOs,
            hasTwoPDs: loadedData.hasTwoPDs,
            hasPrism: loadedData.hasPrism,
          },
          rxConfig: {
            ...(loadedData.rxConfig || DEFAULT_RX_CONFIG),
            frameType: detectedFrameType,
          },
        });
      }
    };

    loadData();
  }, [session, productSlug, detectedFrameType]);
  
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData>(existingData.prescription);
  const [rxConfig, setRxConfig] = useState<RxConfigData>(existingData.rxConfig);

  // Update state when existingData changes (after async load)
  useEffect(() => {
    setPrescriptionData(existingData.prescription);
    setRxConfig(existingData.rxConfig);
  }, [existingData]);

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
  // NOTE: Profit is incorporated into lens prices (hidden from customer)
  const lensPairPrice = useMemo(() => {
    const basePrice = calculateLensPairTotal(lensSelection);
    // Incorporate profit into lens price (profit is hidden, not shown separately)
    return basePrice + FIXED_PROFIT;
  }, [lensSelection]);

  // Calculate Rx price based on current configuration (using old rx167 for edging)
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

    // Use rx167 only for edging fee calculation
    const result = calculateRxTotal({
      framePrice,
      lensCategory: oldLensCategory,
      coating: rxConfig.coating === "SERICUM_UV" ? "UC" : rxConfig.coating, // Map SERICUM_UV to UC for rx167
      tintType: oldTintType,
      frameType: rxConfig.frameType,
      fixedProfit: 0, // Profit is already incorporated into lensPairPrice
    });

    // Calculate totals with profit already in lens price
    const edgingFee = result.breakdown.edgingFee;
    // lensPairPrice already includes profit, so we just add edging
    const rxRetailNet = lensPairPrice + edgingFee;
    const rxRetailGross = rxRetailNet * 1.21; // VAT
    const totalGross = framePrice + rxRetailGross;
    const totalNet = framePrice + rxRetailNet;

    return {
      breakdown: {
        ...result.breakdown,
        lensesPair: lensPairPrice, // This already includes profit
        rxAddOnNet: rxRetailNet, // Same as rxRetailNet since profit is in lens price
        rxRetailNet,
        rxRetailGross,
        profit: FIXED_PROFIT, // Keep for internal tracking, but not shown to customer
      },
      totalNet,
      totalGross,
    };
  }, [framePrice, rxConfig, lensPairPrice]);

  // Helper function to check if prescription values are entered (not defaults)
  const hasPrescriptionValues = useMemo(() => {
    const defaultPrescription = {
      od: { sph: "0.00", cyl: "0.00", axis: "0" },
      os: { sph: "0.00", cyl: "0.00", axis: "0" },
      pd: "62",
    };
    
    return (
      prescriptionData.od.sph !== defaultPrescription.od.sph ||
      prescriptionData.od.cyl !== defaultPrescription.od.cyl ||
      prescriptionData.od.axis !== defaultPrescription.od.axis ||
      prescriptionData.os.sph !== defaultPrescription.os.sph ||
      prescriptionData.os.cyl !== defaultPrescription.os.cyl ||
      prescriptionData.os.axis !== defaultPrescription.os.axis ||
      prescriptionData.pd !== defaultPrescription.pd
    );
  }, [prescriptionData]);

  // Update price context whenever price data changes
  useEffect(() => {
    setPriceData({
      rxPriceResult,
      framePrice,
      formatPrice,
      prescriptionData,
      currentStep,
    });
  }, [rxPriceResult, framePrice, formatPrice, prescriptionData, currentStep, setPriceData]);

  // Auto-save lens configuration changes (for logged-in users)
  // Note: Prescription values are saved on submit in Step 1 via handlePrescriptionSubmit
  useEffect(() => {
    if (!session?.user || !rxPriceResult) return;

    // Check if prescription values are entered (not defaults)
    const hasPrescriptionValues = 
      prescriptionData.od.sph !== "0.00" ||
      prescriptionData.od.cyl !== "0.00" ||
      prescriptionData.od.axis !== "0" ||
      prescriptionData.os.sph !== "0.00" ||
      prescriptionData.os.cyl !== "0.00" ||
      prescriptionData.os.axis !== "0" ||
      prescriptionData.pd !== "62";

    // Only auto-save if prescription values are entered (user has submitted Step 1)
    if (!hasPrescriptionValues) return;

    const autoSave = async () => {
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

      try {
        await saveUserPrescription(productSlug, fullData);
      } catch (error) {
        // Silently fail for auto-save - don't interrupt user flow
        console.error('Auto-save failed:', error);
      }
    };

    // Debounce auto-save to avoid too many DB calls
    const timeoutId = setTimeout(autoSave, 1000);
    return () => clearTimeout(timeoutId);
  }, [session, prescriptionData, rxConfig, rxPriceResult, productSlug]);

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    // Update URL to reflect current step (without causing page reload)
    // Always use productSlug to ensure we use the proper slug, not ID
    if (typeof window !== 'undefined') {
      const newSearchParams = new URLSearchParams();
      if (step !== 0) {
        newSearchParams.set('step', step.toString());
      }
      // Construct URL using productSlug to ensure we always use the slug
      const basePath = `/shop/${encodeURIComponent(productSlug)}/prescription`;
      const newUrl = basePath + (newSearchParams.toString() ? `?${newSearchParams.toString()}` : '');
      router.replace(newUrl, { scroll: false });
    }
  };

  const handlePrescriptionUpdate = (data: Partial<PrescriptionData>) => {
    setPrescriptionData(prev => ({ ...prev, ...data }));
  };

  // Save prescription data when user submits Step 1
  const handlePrescriptionSubmit = async () => {
    // Check if prescription values are entered (not defaults)
    const hasPrescriptionValues = 
      prescriptionData.od.sph !== "0.00" ||
      prescriptionData.od.cyl !== "0.00" ||
      prescriptionData.od.axis !== "0" ||
      prescriptionData.os.sph !== "0.00" ||
      prescriptionData.os.cyl !== "0.00" ||
      prescriptionData.os.axis !== "0" ||
      prescriptionData.pd !== "62";

    if (!hasPrescriptionValues) {
      // No prescription values entered, just proceed to next step
      handleStepChange(2);
      return;
    }

    // Prepare prescription data for saving (without rxConfig yet, as it's not selected)
    const prescriptionDataToSave: FullPrescriptionData = {
      ...prescriptionData,
      rxConfig: rxConfig, // Include current rxConfig (defaults)
      // Don't include price breakdown yet as lens options aren't selected
    };

    // Save prescription data
    if (session?.user) {
      // User is logged in - save to database
      try {
        await saveUserPrescription(productSlug, prescriptionDataToSave);
      } catch (error) {
        console.error('Error saving prescription to database:', error);
        // Fallback to localStorage if DB save fails
        if (typeof window !== 'undefined') {
          localStorage.setItem(`prescription_${productSlug}`, JSON.stringify(prescriptionDataToSave));
        }
      }
    } else {
      // User is not logged in - save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`prescription_${productSlug}`, JSON.stringify(prescriptionDataToSave));
      }
    }

    // Proceed to next step
    handleStepChange(2);
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

  const handleFinalSubmit = async () => {
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

    // Save prescription data (update existing or create new)
    if (session?.user) {
      // User is logged in - save to database
      try {
        await saveUserPrescription(productSlug, fullData);
      } catch (error) {
        console.error('Error saving prescription to database:', error);
        // Fallback to localStorage if DB save fails
        if (typeof window !== 'undefined') {
          localStorage.setItem(`prescription_${productSlug}`, JSON.stringify(fullData));
        }
      }
    } else {
      // User is not logged in - save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`prescription_${productSlug}`, JSON.stringify(fullData));
      }
    }
    
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
    <div className="bg-card border rounded-lg p-4">
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
          onNext={handlePrescriptionSubmit}
          onBack={() => handleStepChange(0)}
          rxPriceResult={rxPriceResult}
          framePrice={framePrice}
          formatPrice={formatPrice}
        />
      )}

      {/* Step 2: Review prescription data */}
      {currentStep === 2 && (
        <Step2Review
          prescriptionData={prescriptionData}
          onConfirm={() => handleStepChange(3)}
          onBack={() => handleStepChange(1)}
          rxPriceResult={rxPriceResult}
          framePrice={framePrice}
          formatPrice={formatPrice}
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
          rxPriceResult={rxPriceResult}
          framePrice={framePrice}
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
          rxPriceResult={rxPriceResult}
          framePrice={framePrice}
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
          rxPriceResult={rxPriceResult}
          framePrice={framePrice}
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
          framePrice={framePrice}
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

