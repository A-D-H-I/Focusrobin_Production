"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  PRICES,
} from "@/lib/pricing/rx167";
import { detectFrameType } from "@/lib/pricing/detectFrameType";

// Step Components
import Step0Initial from "./steps/Step0Initial";
import Step1PrescriptionForm from "./steps/Step1PrescriptionForm";
// Step2Review removed - redundant step
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
  rxConfig?: RxConfigData; // Optional - lens config is product-specific, not loaded from DB
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
    sph: "+0.00", 
    cyl: "+0.00", 
    axis: "0",
    prismHorizontal: "0.00",
    prismHorizontalBase: "",
    prismVertical: "0.00",
    prismVerticalBase: "",
  },
  os: { 
    sph: "+0.00", 
    cyl: "+0.00", 
    axis: "0",
    prismHorizontal: "0.00",
    prismHorizontalBase: "",
    prismVertical: "0.00",
    prismVerticalBase: "",
  },
  pd: "", // Empty by default - user must select
  pdOd: "", // Empty by default
  pdOs: "", // Empty by default
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

  // Track if prescription has been loaded (prescription is now shared across all products)
  const [hasLoadedPrescription, setHasLoadedPrescription] = useState(false);
  
  // Load prescription data ONCE when component mounts or session changes
  // NOTE: Prescription is now shared across all products (one per user)
  // Product changes should NOT reload prescription - it should stay the same across all products
  useEffect(() => {
    // Only load once (prescription is shared, doesn't need to reload per product)
    if (hasLoadedPrescription) return;
    
    const loadPrescriptionData = async () => {
      let loadedData: FullPrescriptionData | null = null;

      // If user is logged in, try to load from database first (for cross-device sync)
      // NOTE: Prescription is now shared across all products (one per user)
      if (session?.user) {
        try {
          // productSlug is passed for backward compatibility but not used in the query
          // Query returns the single prescription for this user (shared across all products)
          const result = await getUserPrescription(productSlug);
          if (result && 'prescription' in result && result.prescription) {
            loadedData = result.prescription;
            console.log('[PrescriptionFlow] Loaded shared prescription from database (applies to all products)');
          }
        } catch (error) {
          console.error('Error loading prescription from database:', error);
        }
      }

      // If not found in DB or not logged in, try localStorage
      // NOTE: Use shared key (not product-specific)
      if (!loadedData && typeof window !== 'undefined') {
        // Clear old product-specific keys (migration cleanup)
        // Remove any old product-specific prescription keys
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith('prescription_') && !key.includes('prescription_user_') && key !== 'prescription_shared') {
            localStorage.removeItem(key);
            console.log('[PrescriptionFlow] Removed old product-specific localStorage key:', key);
          }
        }
        
        // Use generic key for shared prescription (not product-specific)
        const storageKey = session?.user 
          ? `prescription_user_${(session.user as any).id}` 
          : 'prescription_shared';
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as FullPrescriptionData;
            // NOTE: Don't load rxConfig from shared localStorage - it's product-specific
            // Only load prescription data (OD, OS, PD)
            loadedData = {
              ...parsed,
              rxConfig: undefined, // Don't load lens config from shared storage
            };
            console.log('[PrescriptionFlow] Loaded prescription from localStorage (shared across products) - lens config NOT loaded');
          } catch (error) {
            console.error('Error parsing prescription data from localStorage:', error);
            // Remove invalid data
            localStorage.removeItem(storageKey);
          }
        }
      }

      // Set loaded data - ONLY if we have actual prescription data (PD is filled)
      if (loadedData) {
        const hasPdValue = loadedData.hasTwoPDs
          ? (loadedData.pdOd && loadedData.pdOd !== "" && loadedData.pdOs && loadedData.pdOs !== "")
          : (loadedData.pd && loadedData.pd !== "");
        
        if (hasPdValue) {
          // NOTE: rxConfig is NOT loaded from database - it's product-specific
          // Only load prescription data (OD, OS, PD), not lens configuration
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
              pd: loadedData.pd || "",
              pdOd: loadedData.pdOd || "",
              pdOs: loadedData.pdOs || "",
              hasTwoPDs: loadedData.hasTwoPDs,
              hasPrism: loadedData.hasPrism,
            },
            // Don't set rxConfig from DB - it's product-specific and should come from localStorage
            rxConfig: {
              ...DEFAULT_RX_CONFIG,
              frameType: detectedFrameType, // Only use frameType from product detection
            },
          });
          console.log('[PrescriptionFlow] Loaded shared prescription data into state (applies to all products) - lens config NOT loaded from DB');
        }
      }
      
      setHasLoadedPrescription(true);
    };
    
    loadPrescriptionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user]); // Only reload when session changes, not when product changes
  
  const [currentStep, setCurrentStep] = useState(initialStep);
  
  // Ensure URL always has step parameter on initial load (for browser back button support)
  useEffect(() => {
    // Only run once on mount to set initial step parameter if missing
    if (typeof window !== 'undefined' && !stepParam) {
      const basePath = `/shop/${encodeURIComponent(productSlug)}/prescription`;
      router.replace(`${basePath}?step=0`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount
  
  // NOTE: Removed automatic reload on step change - this was causing rxConfig to reset
  // Prescription data is loaded once on mount and only reloaded explicitly when needed
  
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData>(DEFAULT_PRESCRIPTION);
  const [rxConfig, setRxConfig] = useState<RxConfigData>({
    ...DEFAULT_RX_CONFIG,
    frameType: detectedFrameType,
  });
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  
  // Track if user has made any lens selections (to prevent defaults from being re-applied)
  const [hasUserMadeLensSelection, setHasUserMadeLensSelection] = useState(false);

  // Track the last loaded existingData to prevent duplicate updates (include productSlug for uniqueness)
  const [lastLoadedDataId, setLastLoadedDataId] = useState<string | null>(null);
  
  // Update state when existingData changes (after async load)
  // IMPORTANT: Do NOT re-run based on currentStep - that would reset user's lens selections
  useEffect(() => {
    if (existingData) {
      // Only update if existingData has actual prescription data (PD is filled)
      const hasActualData = existingData.prescription.pd !== "" || 
                           existingData.prescription.pdOd !== "" ||
                           existingData.prescription.pdOs !== "";
      
      // Create a unique ID for this data to avoid duplicate updates
      // Prescription is now shared across all products (one per user)
      const dataId = JSON.stringify({
        pd: existingData.prescription.pd,
        pdOd: existingData.prescription.pdOd,
        pdOs: existingData.prescription.pdOs,
      });
      
      // Only update if this is NEW data (not the same data we already loaded)
      if (hasActualData && dataId !== lastLoadedDataId) {
        console.log('[PrescriptionFlow] Updating prescription state from existingData:', {
          od: existingData.prescription.od,
          os: existingData.prescription.os,
          pd: existingData.prescription.pd,
        });
        setPrescriptionData(existingData.prescription);
        // NOTE: rxConfig is NOT loaded from database or shared localStorage - it's product-specific
        // Only load rxConfig from product-specific localStorage if available
        if (!hasLoadedInitialData && typeof window !== 'undefined') {
          const productRxConfigKey = `rxConfig_${productSlug}`;
          const storedRxConfig = localStorage.getItem(productRxConfigKey);
          if (storedRxConfig) {
            try {
              const parsedRxConfig = JSON.parse(storedRxConfig) as RxConfigData;
              // Merge with detected frameType
              setRxConfig({
                ...parsedRxConfig,
                frameType: detectedFrameType,
              });
              setHasUserMadeLensSelection(true);
              console.log('[PrescriptionFlow] Loaded product-specific lens config from localStorage');
            } catch (error) {
              console.error('Error parsing rxConfig from localStorage:', error);
            }
          }
        }
        setLastLoadedDataId(dataId);
        setHasLoadedInitialData(true);
      } else if (!hasLoadedInitialData) {
        // Only set flag once if no data exists
        setHasLoadedInitialData(true);
      }
    }
  }, [existingData, hasLoadedInitialData, lastLoadedDataId]);

  // Update step if step param changes (from browser back/forward or direct URL)
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      const step = parseInt(stepParam);
      if (!isNaN(step) && step >= 0 && step <= 7) {
        // Only update if different to prevent unnecessary re-renders
        if (step !== currentStep) {
          setCurrentStep(step);
        }
      }
    } else {
      // If no step param, set to step 0 and update URL to include it
      // This ensures browser back button works correctly
      if (currentStep !== 0) {
        setCurrentStep(0);
      }
      // Update URL to include step=0 for consistency (use replace to avoid adding to history)
      if (typeof window !== 'undefined') {
        const basePath = `/shop/${encodeURIComponent(productSlug)}/prescription`;
        router.replace(`${basePath}?step=0`, { scroll: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only depend on searchParams to respond to browser navigation

  const framePrice = parseEurPrice(product.price);

  // Convert RxConfigData to LensSelection for pricing
  // IMPORTANT: Preserve coating if it's valid to prevent price changes when navigating between steps
  const lensSelection: LensSelection = useMemo(() => {
    // If we don't have lensType or lensIndex, return a minimal selection
    if (!rxConfig.lensType || !rxConfig.lensIndex) {
      return {
        lensType: rxConfig.lensType || "CLEAR",
        lensIndex: rxConfig.lensIndex || "1.56",
        coating: rxConfig.coating || "UC",
      };
    }
    
    // Check if current coating is valid for the lens type
    let validCoating: Coating | null = null;
    if (rxConfig.coating) {
      const allowedCoatings = getAllowedCoatings(rxConfig.lensType);
      if (allowedCoatings.includes(rxConfig.coating)) {
        // Coating is valid, preserve it
        validCoating = rxConfig.coating;
      }
    }
    
    // Normalize only when we have complete selection
    // This ensures coating is preserved if it's already valid
    const normalized = normalizeSelection({
      lensType: rxConfig.lensType,
      lensIndex: rxConfig.lensIndex,
      coating: validCoating || rxConfig.coating || "UC", // Use valid coating or fallback
      tintType: rxConfig.tintType,
      tintColor: rxConfig.tintColor,
      tintShade: rxConfig.tintShadePercent,
      tintRecipe: rxConfig.tintRecipe,
      photochromicColor: rxConfig.photochromicColor,
      polarizedColor: rxConfig.polarizedColor,
    });
    
    // Preserve valid coating - only use normalized coating if current was invalid
    if (validCoating && normalized.coating !== validCoating) {
      // Current coating was valid but got changed - preserve it to prevent price changes
      normalized.coating = validCoating;
    }
    
    return normalized;
  }, [rxConfig]);

  // Calculate lens pair price using new pricing module
  // NOTE: Profit and edging fee are incorporated into lens prices (hidden from customer)
  const lensPairPrice = useMemo(() => {
    const basePrice = calculateLensPairTotal(lensSelection);
    // Get edging fee based on frame type
    const { PRICES } = require('@/lib/pricing/rx167');
    const edgingFee = PRICES.edging[rxConfig.frameType] || 0;
    // Incorporate profit and edging fee into lens price (both hidden from customer)
    return basePrice + FIXED_PROFIT + edgingFee;
  }, [lensSelection, rxConfig.frameType]);

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

    // Calculate totals with profit and edging fee already in lens price
    // lensPairPrice already includes profit + edging fee, so rxRetailNet = lensPairPrice
    const rxRetailNet = lensPairPrice;
    const rxRetailGross = rxRetailNet * 1.21; // VAT
    const totalGross = framePrice + rxRetailGross;
    const totalNet = framePrice + rxRetailNet;

    return {
      breakdown: {
        ...result.breakdown,
        lensesPair: lensPairPrice, // This already includes profit + edging fee
        rxAddOnNet: rxRetailNet, // Same as rxRetailNet since profit is in lens price
        rxRetailNet,
        rxRetailGross,
        profit: FIXED_PROFIT, // Keep for internal tracking, but not shown to customer
        edgingFee: 0, // Not shown to customer (included in lensesPair)
      },
      totalNet,
      totalGross,
    };
  }, [framePrice, rxConfig, lensPairPrice]);

  // Helper function to check if prescription can be saved
  // Only requirement is that PD must be filled - prescription values can be defaults (plano lenses)
  const hasPrescriptionValues = useMemo(() => {
    // Only check if PD is entered (prescription values can be defaults/plano)
    const hasPdValue = prescriptionData.hasTwoPDs 
      ? (prescriptionData.pdOd && prescriptionData.pdOd !== "" && prescriptionData.pdOs && prescriptionData.pdOs !== "")
      : (prescriptionData.pd && prescriptionData.pd !== "");
    
    return hasPdValue;
  }, [prescriptionData]);

  // Update price context whenever price data changes
  useEffect(() => {
    setPriceData({
      rxPriceResult,
      framePrice,
      formatPrice,
      prescriptionData,
      rxConfig,
      currentStep,
    });
  }, [rxPriceResult, framePrice, formatPrice, prescriptionData, rxConfig, currentStep, setPriceData]);

  // Auto-save prescription data changes (for logged-in users)
  // Saves whenever prescription values are edited and PD is filled
  useEffect(() => {
    if (!session?.user) return;

    // Only check if PD is entered - prescription values can be plano/defaults
    const hasPdValue = prescriptionData.hasTwoPDs
      ? (prescriptionData.pdOd && prescriptionData.pdOd !== "" && prescriptionData.pdOs && prescriptionData.pdOs !== "")
      : (prescriptionData.pd && prescriptionData.pd !== "");

    // Only auto-save if PD is entered (valid prescription)
    if (!hasPdValue) return;

    const autoSavePrescription = async () => {
      const fullData: FullPrescriptionData = {
        ...prescriptionData,
        rxConfig,
        // Include price breakdown if available
        rxPriceBreakdown: rxPriceResult ? {
          lensesPair: rxPriceResult.breakdown.lensesPair,
          edgingFee: rxPriceResult.breakdown.edgingFee,
          profit: rxPriceResult.breakdown.profit,
          rxRetailNet: rxPriceResult.breakdown.rxRetailNet,
          totalNet: rxPriceResult.totalNet,
        } : undefined,
      };

      try {
        await saveUserPrescription(productSlug, fullData);
        console.log('[PrescriptionFlow] Auto-saved prescription data to database (shared across all products)');
        // Also save to localStorage as backup (shared key)
        if (typeof window !== 'undefined') {
          const storageKey = `prescription_user_${(session.user as any).id}`;
          localStorage.setItem(storageKey, JSON.stringify(fullData));
        }
      } catch (error) {
        // Silently fail for auto-save - don't interrupt user flow
        console.error('Auto-save prescription failed:', error);
        // Fallback to localStorage if DB save fails (shared key)
        if (typeof window !== 'undefined') {
          const storageKey = `prescription_user_${(session.user as any).id}`;
          localStorage.setItem(storageKey, JSON.stringify(fullData));
        }
      }
    };

    // Debounce auto-save to avoid too many DB calls (2 second delay for prescription edits)
    const timeoutId = setTimeout(autoSavePrescription, 2000);
    return () => clearTimeout(timeoutId);
  }, [session, prescriptionData, rxConfig, rxPriceResult, productSlug]);

  const handleStepChange = async (step: number) => {
    // NOTE: Removed automatic reload when navigating to Step 1 - this was causing rxConfig to reset
    // Prescription data is already in state from initial load
    
    // If navigating away from Step 1, save prescription data if PD is filled
    if (currentStep === 1 && step !== 1 && session?.user) {
      const hasPdValue = prescriptionData.hasTwoPDs
        ? (prescriptionData.pdOd && prescriptionData.pdOd !== "" && prescriptionData.pdOs && prescriptionData.pdOs !== "")
        : (prescriptionData.pd && prescriptionData.pd !== "");
      
      if (hasPdValue) {
        const prescriptionDataToSave: FullPrescriptionData = {
          ...prescriptionData,
          rxConfig,
          rxPriceBreakdown: rxPriceResult ? {
            lensesPair: rxPriceResult.breakdown.lensesPair,
            edgingFee: rxPriceResult.breakdown.edgingFee,
            profit: rxPriceResult.breakdown.profit,
            rxRetailNet: rxPriceResult.breakdown.rxRetailNet,
            totalNet: rxPriceResult.totalNet,
          } : undefined,
        };
        
        try {
          await saveUserPrescription(productSlug, prescriptionDataToSave);
          console.log('[PrescriptionFlow] Saved prescription data before navigating away from Step 1 (shared across all products)');
          // Also save to localStorage as backup (shared key)
          if (typeof window !== 'undefined') {
            const storageKey = `prescription_user_${(session.user as any).id}`;
            localStorage.setItem(storageKey, JSON.stringify(prescriptionDataToSave));
          }
        } catch (error) {
          console.error('Error saving prescription before navigation:', error);
          // Fallback to localStorage (shared key)
          if (typeof window !== 'undefined') {
            const storageKey = `prescription_user_${(session.user as any).id}`;
            localStorage.setItem(storageKey, JSON.stringify(prescriptionDataToSave));
          }
        }
      }
    }
    
    setCurrentStep(step);
    // Update URL to reflect current step
    // Use router.push (not replace) to maintain browser history for back button support
    // Always use productSlug to ensure we use the proper slug, not ID
    if (typeof window !== 'undefined') {
      const newSearchParams = new URLSearchParams();
      // Always include step parameter to maintain history
      newSearchParams.set('step', step.toString());
      // Construct URL using productSlug to ensure we always use the slug
      const basePath = `/shop/${encodeURIComponent(productSlug)}/prescription`;
      const newUrl = basePath + `?${newSearchParams.toString()}`;
      // Use push instead of replace to maintain browser history
      router.push(newUrl, { scroll: false });
    }
  };

  const handlePrescriptionUpdate = (data: Partial<PrescriptionData>) => {
    setPrescriptionData(prev => ({ ...prev, ...data }));
  };

  // Save prescription data when user submits Step 1
  const handlePrescriptionSubmit = async () => {
    // Check if PD is entered - prescription values can be defaults (plano lenses are valid)
    const hasPdValue = prescriptionData.hasTwoPDs
      ? (prescriptionData.pdOd && prescriptionData.pdOd !== "" && prescriptionData.pdOs && prescriptionData.pdOs !== "")
      : (prescriptionData.pd && prescriptionData.pd !== "");

    if (!hasPdValue) {
      // PD not entered, cannot proceed
      // The UI should prevent this, but double-check here
      return;
    }

    // Prepare prescription data for saving (without rxConfig yet, as it's not selected)
    const prescriptionDataToSave: FullPrescriptionData = {
      ...prescriptionData,
      rxConfig: rxConfig, // Include current rxConfig (defaults)
      // Don't include price breakdown yet as lens options aren't selected
    };

    // Save prescription data (shared across all products)
    if (session?.user) {
      // User is logged in - save to database (one prescription per user)
      try {
        await saveUserPrescription(productSlug, prescriptionDataToSave);
        // NOTE: Removed loadPrescriptionData() call here - it was causing rxConfig to reset
        // State is already up to date from user input
        console.log('[PrescriptionFlow] Saved prescription data to database (shared across all products)');
        // Also save to localStorage as backup
        if (typeof window !== 'undefined') {
          const storageKey = `prescription_user_${(session.user as any).id}`;
          localStorage.setItem(storageKey, JSON.stringify(prescriptionDataToSave));
        }
      } catch (error) {
        console.error('Error saving prescription to database:', error);
        // Fallback to localStorage if DB save fails
        if (typeof window !== 'undefined') {
          const storageKey = `prescription_user_${(session.user as any).id}`;
          localStorage.setItem(storageKey, JSON.stringify(prescriptionDataToSave));
        }
      }
    } else {
      // User is not logged in - save to localStorage (generic key, shared across products)
      if (typeof window !== 'undefined') {
        localStorage.setItem('prescription_shared', JSON.stringify(prescriptionDataToSave));
      }
    }

    // Skip Step 2 (Review) and go directly to Step 3 (Lens Category)
    handleStepChange(3);
  };

  const handleRxConfigUpdate = (data: Partial<RxConfigData>, isDefaultApplication = false) => {
    // If this is a default application and user has already made a selection, ignore it
    // This prevents Step3's useEffect from resetting user's choices when navigating back
    if (isDefaultApplication && hasUserMadeLensSelection) {
      console.log('[PrescriptionFlow] Ignoring default application - user has already made selections');
      return;
    }
    
    // If this is NOT a default application, mark that user has made a selection
    if (!isDefaultApplication) {
      setHasUserMadeLensSelection(true);
    }
    
    setRxConfig(prev => {
      // CRITICAL: Always preserve lensType from previous state if not explicitly updated
      // This prevents lensType from being reset when only coating is updated
      const lensTypeToUse = data.lensType !== undefined ? data.lensType : prev.lensType;
      
      // CRITICAL: Always preserve frameType from previous state if not explicitly updated
      const frameTypeToUse = data.frameType !== undefined ? data.frameType : prev.frameType;
      
      // If updating only frameType, just update it directly without normalization
      if (data.frameType !== undefined && Object.keys(data).length === 1) {
        const updated = { ...prev, frameType: data.frameType };
        // Save to product-specific localStorage
        if (typeof window !== 'undefined' && !isDefaultApplication) {
          const productRxConfigKey = `rxConfig_${productSlug}`;
          localStorage.setItem(productRxConfigKey, JSON.stringify(updated));
        }
        return updated;
      }
      
      // If updating only coating and no lensType exists, don't proceed
      // This prevents errors when trying to normalize without a lensType
      if (!lensTypeToUse && data.coating !== undefined && data.lensType === undefined) {
        const updated = { ...prev, coating: data.coating, frameType: frameTypeToUse };
        // Save to product-specific localStorage
        if (typeof window !== 'undefined' && !isDefaultApplication) {
          const productRxConfigKey = `rxConfig_${productSlug}`;
          localStorage.setItem(productRxConfigKey, JSON.stringify(updated));
        }
        return updated;
      }
      
      // If no lensType exists at all, just apply the update directly (let Step3 handle defaults)
      if (!lensTypeToUse) {
        const updated = { ...prev, ...data, frameType: frameTypeToUse };
        // Save to product-specific localStorage
        if (typeof window !== 'undefined' && !isDefaultApplication) {
          const productRxConfigKey = `rxConfig_${productSlug}`;
          localStorage.setItem(productRxConfigKey, JSON.stringify(updated));
        }
        return updated;
      }
      
      const updated = { ...prev, ...data, lensType: lensTypeToUse, frameType: frameTypeToUse };
      
      // Preserve existing coating if it's valid for the current lens type
      // This prevents prices from changing when navigating between steps
      let coatingToUse: Coating | undefined = updated.coating;
      const allowedCoatings = getAllowedCoatings(lensTypeToUse);
      
      // If coating is explicitly changed in data, use it (but validate it)
      if (data.coating !== undefined) {
        coatingToUse = allowedCoatings.includes(data.coating) ? data.coating : prev.coating;
      }
      // If coating wasn't explicitly changed, preserve previous coating if it's still valid
      else if (!coatingToUse && prev.coating && allowedCoatings.includes(prev.coating)) {
        coatingToUse = prev.coating; // Preserve previous valid coating
      }
      // If current coating is invalid, let normalizeSelection set the default
      else if (coatingToUse && !allowedCoatings.includes(coatingToUse)) {
        coatingToUse = undefined; // Let normalizeSelection fix invalid coating
      }
      
      // Normalize selection to auto-correct invalid combinations
      // IMPORTANT: Always use preserved lensType (never undefined)
      const tempSelection: LensSelection = {
        lensType: lensTypeToUse, // Always use preserved lensType
        lensIndex: updated.lensIndex || prev.lensIndex || "1.67",
        coating: coatingToUse || prev.coating || "UC", // Provide fallback
        tintType: updated.tintType,
        tintColor: updated.tintColor,
        tintShade: updated.tintShadePercent,
        tintRecipe: updated.tintRecipe,
        photochromicColor: updated.photochromicColor,
        polarizedColor: updated.polarizedColor,
      };
      
      const normalized = normalizeSelection(tempSelection);
      
      // Apply normalized values, but ALWAYS preserve lensType and frameType if not explicitly changed
      // This is critical to prevent values from being reset when only one field is updated
      const finalConfig = {
        ...updated,
        lensType: data.lensType !== undefined ? normalized.lensType : prev.lensType, // Preserve if not explicitly changed
        lensIndex: normalized.lensIndex,
        coating: normalized.coating,
        tintType: normalized.tintType,
        tintColor: normalized.tintColor,
        tintShadePercent: normalized.tintShade,
        tintRecipe: normalized.tintRecipe,
        photochromicColor: normalized.photochromicColor,
        polarizedColor: normalized.polarizedColor,
        frameType: frameTypeToUse, // Always preserve frameType
      };
      
      // Save to product-specific localStorage (only if user made a selection, not defaults)
      if (typeof window !== 'undefined' && !isDefaultApplication) {
        const productRxConfigKey = `rxConfig_${productSlug}`;
        localStorage.setItem(productRxConfigKey, JSON.stringify(finalConfig));
        console.log('[PrescriptionFlow] Saved product-specific lens config to localStorage');
      }
      
      return finalConfig;
    });
  };
  
  // Wrapper for default applications (from step components on mount)
  const handleRxConfigUpdateWithDefault = (data: Partial<RxConfigData>) => {
    handleRxConfigUpdate(data, true);
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

    // Save prescription data (shared across all products)
    if (session?.user) {
      // User is logged in - save to database (one prescription per user)
      try {
        await saveUserPrescription(productSlug, fullData);
        console.log('[PrescriptionFlow] Saved prescription to database (shared across all products)');
        // Also save to localStorage as backup (shared key)
        if (typeof window !== 'undefined') {
          const storageKey = `prescription_user_${(session.user as any).id}`;
          localStorage.setItem(storageKey, JSON.stringify(fullData));
        }
      } catch (error) {
        console.error('Error saving prescription to database:', error);
        // Fallback to localStorage if DB save fails (shared key)
        if (typeof window !== 'undefined') {
          const storageKey = `prescription_user_${(session.user as any).id}`;
          localStorage.setItem(storageKey, JSON.stringify(fullData));
        }
      }
    } else {
      // User is not logged in - save to localStorage (generic key, shared across products)
      if (typeof window !== 'undefined') {
        localStorage.setItem('prescription_shared', JSON.stringify(fullData));
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
    return 7; // Skip frame type step, go directly to summary
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

  const goBackFromSummary = () => {
    if (rxConfig.lensType === "TINTED") {
      handleStepChange(5); // Back to tint options
    } else {
      handleStepChange(4); // Back to coating
    }
  };

  // Ensure frame type is always set to detected value for current product
  // This happens automatically even though users don't see the frame type step
  // Frame type is product-specific, so it should update when product changes
  useEffect(() => {
    if (rxConfig.frameType !== detectedFrameType) {
      handleRxConfigUpdateWithDefault({ frameType: detectedFrameType });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedFrameType, product.id]); // Update when product changes

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

      {/* Step 2: REMOVED - Review was redundant, going directly to lens selection */}

      {/* Step 3: Choose Lens Type (Clear, Tinted, Photochromic, Polarized) */}
      {currentStep === 3 && (
        <Step3LensCategory
          rxConfig={rxConfig}
          onConfigUpdate={handleRxConfigUpdate}
          onConfigUpdateDefault={handleRxConfigUpdateWithDefault}
          onNext={goToNextFromLensCategory}
          onBack={() => handleStepChange(1)}
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
          onNext={() => handleStepChange(7)}
          onBack={goBackFromTintOptions}
          formatPrice={formatPrice}
          rxPriceResult={rxPriceResult}
          framePrice={framePrice}
        />
      )}

      {/* Step 6: Frame Type (auto-detected) - HIDDEN FROM USER */}
      {/* Frame type is automatically detected and set, edging fee is included in pricing */}
      {false && currentStep === 6 && (
        <Step6FrameType
          product={product}
          rxConfig={rxConfig}
          onConfigUpdate={handleRxConfigUpdate}
          onConfigUpdateDefault={handleRxConfigUpdateWithDefault}
          onNext={() => handleStepChange(7)}
          onBack={goBackFromSummary}
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
          onBack={goBackFromSummary}
          onEditPrescription={() => handleStepChange(1)}
          onEditLens={() => handleStepChange(3)}
        />
      )}
    </div>
  );
}

