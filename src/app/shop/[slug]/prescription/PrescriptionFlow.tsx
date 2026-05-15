"use client";

import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Product } from "@/lib/productData";
import { usePrice } from "@/hooks/usePrice";
import { usePrescriptionPrice } from "./context/PrescriptionPriceContext";
import { saveUserPrescription, getUserPrescription } from "@/app/actions/prescription";
import {
  type LensBundle,
  type TintColor,
  type PhotochromicColor,
  getBundlePrice,
  LensSelection,
  getAllowedCoatings,
  normalizeSelection,
  type Coating,
  calculateLensPairTotal,
} from "@/lib/lensPricing";
import {
  type FrameType,
  calculateRxTotal,
  FIXED_PROFIT,
  PRICES,
} from "@/lib/pricing/rx167";
import { detectFrameType } from "@/lib/pricing/detectFrameType";
import type { PrescriptionData, RxConfigData, FullPrescriptionData } from "@/types/prescription";

// Step Components
import Step1PrescriptionForm from "./steps/Step1PrescriptionForm";
import Step2PowerCategory from "./steps/Step2PowerCategory";
// Step2Review removed - redundant step
import Step3LensSelection from "./steps/Step3LensSelection";
import Step4LensThickness from "./steps/Step4LensThickness";
import Step7Summary from "./steps/Step7Summary";

interface PrescriptionFlowProps {
  product: Product;
  productSlug: string;
}

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
  prescriptionPdfUrl: undefined,
  isPdfMode: false,
};

const DEFAULT_RX_CONFIG: RxConfigData = {
  lensBundle: "BASIC",
  frameType: "FULL_FRAME",
  // Legacy defaults
  lensType: "SIMPLE_STOCK",
  lensIndex: "1.50",
  coating: "HMC",
};

export default function PrescriptionFlow({ product, productSlug }: PrescriptionFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { formatPrice, parseEurPrice } = usePrice();
  const containerRef = useRef<HTMLDivElement>(null);
  const { setPriceData, bundlePrices } = usePrescriptionPrice();

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
              prescriptionPdfUrl: (loadedData as any).prescriptionPdfUrl,
              isPdfMode: (loadedData as any).isPdfMode || false,
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

  // Track if initial rxConfig has been loaded (to prevent reload on step changes)
  const [hasLoadedRxConfig, setHasLoadedRxConfig] = useState(false);

  // Load product-specific rxConfig from localStorage or sessionStorage ONLY on initial mount
  // This ensures lens configuration persists when navigating back from confirmation/cart
  // But does NOT reload on step changes (which would reset user's selections)
  useEffect(() => {
    // Only load once on mount - never reload on step changes
    if (hasLoadedRxConfig) return;

    if (typeof window !== 'undefined') {
      // First try sessionStorage (most recent, product-specific)
      const sessionKey = `prescription_${productSlug}`;
      const sessionStored = sessionStorage.getItem(sessionKey);
      let rxConfigToLoad: RxConfigData | null = null;

      if (sessionStored) {
        try {
          const parsed = JSON.parse(sessionStored) as FullPrescriptionData;
          if (parsed.rxConfig) {
            rxConfigToLoad = parsed.rxConfig;
            console.log('[PrescriptionFlow] Found rxConfig in sessionStorage');
          }
        } catch (error) {
          console.error('Error parsing prescription data from sessionStorage:', error);
        }
      }

      // If not in sessionStorage, try localStorage (product-specific)
      if (!rxConfigToLoad) {
        const productRxConfigKey = `rxConfig_${productSlug}`;
        const storedRxConfig = localStorage.getItem(productRxConfigKey);
        if (storedRxConfig) {
          try {
            rxConfigToLoad = JSON.parse(storedRxConfig) as RxConfigData;
            console.log('[PrescriptionFlow] Found rxConfig in localStorage');
          } catch (error) {
            console.error('Error parsing rxConfig from localStorage:', error);
          }
        }
      }

      // Update rxConfig if we found one
      if (rxConfigToLoad) {
        // Merge with detected frameType to ensure it's always correct
        const newConfig = {
          ...rxConfigToLoad,
          frameType: detectedFrameType, // Always use detected frameType
        };
        console.log('[PrescriptionFlow] Loaded product-specific lens config on mount');
        setRxConfig(newConfig);
        setHasUserMadeLensSelection(true);
      }

      setHasLoadedRxConfig(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSlug]); // Only depend on productSlug - NOT currentStep (to avoid reloading on step changes)

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
  // Now only steps 0, 1, 2, 3 are valid (0=Power Category, 1=Prescription, 2=Lens Selection, 3=Summary)
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      const step = parseInt(stepParam);
      if (!isNaN(step) && step >= 0 && step <= 3) {
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

  // Reload prescription data from sessionStorage when navigating back to steps 0 or 1
  // This ensures prescription values are always up to date when user navigates between steps
  useEffect(() => {
    // Only reload on steps 0 and 1 (where prescription data is displayed/edited)
    if (currentStep > 1) return;

    if (typeof window !== 'undefined') {
      const sessionKey = `prescription_${productSlug}`;
      const sessionStored = sessionStorage.getItem(sessionKey);

      if (sessionStored) {
        try {
          const parsed = JSON.parse(sessionStored) as FullPrescriptionData;
          // Check if we have actual prescription data
          if (parsed.od && parsed.os) {
            // Update prescription data from sessionStorage
            setPrescriptionData({
              od: {
                ...parsed.od,
                prismHorizontal: parsed.od.prismHorizontal || "0.00",
                prismHorizontalBase: parsed.od.prismHorizontalBase || "",
                prismVertical: parsed.od.prismVertical || "0.00",
                prismVerticalBase: parsed.od.prismVerticalBase || "",
              },
              os: {
                ...parsed.os,
                prismHorizontal: parsed.os.prismHorizontal || "0.00",
                prismHorizontalBase: parsed.os.prismHorizontalBase || "",
                prismVertical: parsed.os.prismVertical || "0.00",
                prismVerticalBase: parsed.os.prismVerticalBase || "",
              },
              pd: parsed.pd || "",
              pdOd: parsed.pdOd || "",
              pdOs: parsed.pdOs || "",
              hasTwoPDs: parsed.hasTwoPDs || false,
              hasPrism: parsed.hasPrism || false,
              prescriptionImageUrl: parsed.prescriptionImageUrl,
              prescriptionPdfUrl: (parsed as any).prescriptionPdfUrl,
              isPdfMode: (parsed as any).isPdfMode || false,
            });
            console.log('[PrescriptionFlow] Reloaded prescription data from sessionStorage for step', currentStep);
          }
        } catch (error) {
          console.error('Error parsing prescription data from sessionStorage:', error);
        }
      }
    }
  }, [currentStep, productSlug]); // Run when step changes or product changes

  const framePrice = parseEurPrice(product.price);

  // Convert RxConfigData to LensSelection for pricing
  // IMPORTANT: Preserve coating if it's valid to prevent price changes when navigating between steps
  const lensSelection: LensSelection = useMemo(() => {
    // If we don't have lensType or lensIndex, return a minimal selection
    if (!rxConfig.lensType || !rxConfig.lensIndex) {
      return {
        lensType: rxConfig.lensType || "SIMPLE_STOCK",
        lensBundle: rxConfig.lensBundle || "BASIC",
        lensIndex: rxConfig.lensIndex || "1.50",
        coating: rxConfig.coating || "UC",
      };
    }

    // Check if current coating is valid for the lens type
    let validCoating: Coating | null = null;
    if (rxConfig.coating) {
      // Pass lensIndex if available, or fall back to single-arg call if not
      // actually getAllowedCoatings needs index now? 
      // The previous replace for lensPricing.ts added optional index.
      const allowedCoatings = getAllowedCoatings(rxConfig.lensType, rxConfig.lensIndex);
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

  // Calculate Rx price based on current configuration (Simplified Bundles)
  const rxPriceResult = useMemo(() => {
    // 1. Get Bundle Price (Fixed pair price including edging)
    const baseBundlePrice = bundlePrices[rxConfig.lensBundle] ?? getBundlePrice(rxConfig.lensBundle);
    const bundlePrice = rxConfig.powerCategory === 'HIGH' ? baseBundlePrice * 2 : baseBundlePrice;

    // 2. Add Lens Thickness surcharge (Flat +60 for Thinner)
    const thicknessPrice = rxConfig.lensThickness === 'THINNER' ? 60 : 0;

    // 2. We don't add extra profit or edging fee on top, as it's included in the bundle price
    // But for the breakdown, we can simulate them if needed, or just put everything in lensesPair

    // We'll mimic the old structure for compatibility
    const lensPairPrice = bundlePrice + thicknessPrice;
    const rxRetailNet = lensPairPrice;
    const rxRetailGross = rxRetailNet * 1.21; // VAT
    const totalGross = framePrice + rxRetailGross;
    const totalNet = framePrice + rxRetailNet;

    return {
      breakdown: {
        lensesPair: lensPairPrice,
        rxAddOnNet: rxRetailNet,
        rxRetailNet,
        rxRetailGross,
        profit: 0, // Profit is inside the fixed price
        edgingFee: 0, // Edging is inside the fixed price
      },
      totalNet,
      totalGross,
    };
  }, [framePrice, rxConfig.lensBundle, rxConfig.lensThickness, rxConfig.powerCategory]);

  // Handle configuration updates
  const handleRxConfigUpdate = (data: Partial<RxConfigData>, isDefaultApplication = false) => {
    // If this is a default application and user has already made a selection, ignore it
    if (isDefaultApplication && hasUserMadeLensSelection) {
      console.log('[PrescriptionFlow] Ignoring default application - user has already made selections');
      return;
    }

    if (!isDefaultApplication) {
      setHasUserMadeLensSelection(true);
    }

    // If switching from HIGH to NORMAL, we must clear any SPH values that exceed the +/- 6.00 limits
    if (data.powerCategory === 'NORMAL' && rxConfig.powerCategory === 'HIGH') {
      setPrescriptionData(prev => {
        const clampSph = (sphVal: string) => {
          if (!sphVal) return sphVal;
          const num = parseFloat(sphVal);
          if (isNaN(num)) return sphVal;
          if (num > 6.00 || num < -6.00) return ""; // Reset out-of-bounds values
          return sphVal;
        };

        const newOd = { ...prev.od, sph: clampSph(prev.od.sph) };
        const newOs = { ...prev.os, sph: clampSph(prev.os.sph) };

        if (newOd.sph !== prev.od.sph || newOs.sph !== prev.os.sph) {
          console.log('[PrescriptionFlow] Cleared out-of-bounds SPH values after switching to Normal category');
          return { ...prev, od: newOd, os: newOs };
        }
        return prev;
      });
    }

    setRxConfig(prev => {
      const saveToLocalStorage = (config: RxConfigData) => {
        if (typeof window !== 'undefined' && !isDefaultApplication) {
          const productRxConfigKey = `rxConfig_${productSlug}`;
          localStorage.setItem(productRxConfigKey, JSON.stringify(config));
          console.log('[PrescriptionFlow] Saved rxConfig to localStorage on update:', config);
        }
      };

      // Merge new data
      const updated = { ...prev, ...data };

      // Clear irrelevant fields based on new bundle selection
      if (updated.lensBundle !== "PHOTOCHROMIC") {
        updated.photochromicColor = undefined;
      } else if (!updated.photochromicColor) {
        updated.photochromicColor = "Brown"; // Default
      }

      if (updated.lensBundle !== "SUNGLASSES_TINT" && updated.lensBundle !== "SUNGLASSES_GRADIENT") {
        updated.tintColor = undefined;
        updated.tintRecipe = undefined;
        updated.tintShadePercent = undefined;
      } else if (!updated.tintColor) {
        updated.tintColor = "Grey"; // Default
      }

      saveToLocalStorage(updated as RxConfigData);
      return updated as RxConfigData;
    });
  };

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

  // Scroll to top when step changes - use useLayoutEffect to run synchronously
  // before the browser paints, preventing flash of footer
  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      // Disable browser scroll restoration
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
      // Triple scroll reset (same proven pattern as checkout page)
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    return () => {
      if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
      }
    };
  }, [currentStep]);

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
    console.log('[PrescriptionFlow] handleStepChange called:', { from: currentStep, to: step });

    // NOTE: Removed automatic reload when navigating to Step 1 - this was causing rxConfig to reset
    // Prescription data is already in state from initial load

    // If navigating away from Step 1 (Prescription Form), save prescription data if PD is filled OR PDF is uploaded
    if (currentStep === 1 && step !== 1 && session?.user) {
      // Check if PDF is uploaded - if so, we can save without PD
      const hasPdfUploaded = !!(
        prescriptionData.prescriptionPdfUrl ||
        prescriptionData.prescriptionImageUrl
      );

      const hasPdValue = prescriptionData.hasTwoPDs
        ? (prescriptionData.pdOd && prescriptionData.pdOd !== "" && prescriptionData.pdOs && prescriptionData.pdOs !== "")
        : (prescriptionData.pd && prescriptionData.pd !== "");

      // Save if either PD is filled OR PDF is uploaded
      if (hasPdValue || hasPdfUploaded) {
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

    // ALWAYS update step - don't block navigation
    setCurrentStep(step);
    console.log('[PrescriptionFlow] Step changed to:', step);

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
    setPrescriptionData(prev => {
      const updated = { ...prev, ...data };
      // Log state update for debugging (especially in Docker)
      if (data.prescriptionImageUrl || data.prescriptionPdfUrl) {
        console.log('[PrescriptionFlow] Prescription data updated:', {
          prescriptionImageUrl: updated.prescriptionImageUrl,
          prescriptionPdfUrl: updated.prescriptionPdfUrl,
          isPdfMode: updated.isPdfMode,
        });
      }
      return updated;
    });
  };

  // Save prescription data when user submits Step 1 (Prescription Form)
  const handlePrescriptionSubmit = async () => {
    console.log('[PrescriptionFlow] handlePrescriptionSubmit called');

    // Check if PDF is uploaded - if so, PD is not required
    const hasPdfUploaded = !!(
      prescriptionData.prescriptionPdfUrl ||
      prescriptionData.prescriptionImageUrl
    );

    console.log('[PrescriptionFlow] Checking submission conditions:', {
      hasPdfUploaded,
      prescriptionPdfUrl: prescriptionData.prescriptionPdfUrl,
      prescriptionImageUrl: prescriptionData.prescriptionImageUrl,
      pd: prescriptionData.pd,
      hasTwoPDs: prescriptionData.hasTwoPDs,
    });

    // Check if PD is entered - prescription values can be defaults (plano lenses are valid)
    // If PDF is uploaded, PD is not required
    const hasPdValue = hasPdfUploaded
      ? true // PDF uploaded, PD not required
      : prescriptionData.hasTwoPDs
        ? (prescriptionData.pdOd && prescriptionData.pdOd !== "" && prescriptionData.pdOs && prescriptionData.pdOs !== "")
        : (prescriptionData.pd && prescriptionData.pd !== "");

    console.log('[PrescriptionFlow] hasPdValue:', hasPdValue);

    if (!hasPdValue) {
      // PD not entered and no PDF uploaded, cannot proceed
      // The UI should prevent this, but double-check here
      console.warn('[PrescriptionFlow] Submit blocked - PD not filled and no PDF uploaded');
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
        console.error('[PrescriptionFlow] Error saving prescription to database:', error);
        // Fallback to localStorage if DB save fails - but DON'T block navigation
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

    // Go to Step 2 (Lens Selection) after prescription submission - ALWAYS navigate
    console.log('[PrescriptionFlow] Navigating to Step 2 (Lens Selection)...');
    handleStepChange(2);
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

    // Save to sessionStorage for confirmation page (product-specific)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`prescription_${productSlug}`, JSON.stringify(fullData));
      console.log('[PrescriptionFlow] Saved prescription to sessionStorage for confirmation page');
    }

    // Dispatch custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('prescription-saved'));
    }

    router.push(`/shop/${productSlug}/prescription/confirmation`);
  };

  // Step navigation helpers
  const goBackFromSummary = () => {
    handleStepChange(3); // Back to lens thickness
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
    <div ref={containerRef} className="bg-card border rounded-lg p-4">
      {/* Step 0: Prescription Power Category (Normal vs High) */}
      {currentStep === 0 && (
        <Step2PowerCategory
          rxConfig={rxConfig}
          onConfigUpdate={handleRxConfigUpdate}
          onNext={() => handleStepChange(1)}
          onBack={() => router.push(`/shop/${productSlug}`)}
        />
      )}

      {/* Step 1: Prescription Form - Enter SPH, CYL, AXIS, PD */}
      {currentStep === 1 && (
        <Step1PrescriptionForm
          prescriptionData={prescriptionData}
          rxConfig={rxConfig}
          onDataUpdate={handlePrescriptionUpdate}
          onNext={handlePrescriptionSubmit}
          onBack={() => handleStepChange(0)}
          rxPriceResult={rxPriceResult}
          framePrice={framePrice}
          formatPrice={formatPrice}
        />
      )}

      {/* Step 2: Complete Lens Selection (Type, Index, Coating, Tint, Frame Type) */}
      {currentStep === 2 && (
        <Step3LensSelection
          product={product}
          rxConfig={rxConfig}
          onConfigUpdate={handleRxConfigUpdate}
          onConfigUpdateDefault={handleRxConfigUpdateWithDefault}
          onNext={() => handleStepChange(3)}
          onBack={() => handleStepChange(1)}
          formatPrice={formatPrice}
          rxPriceResult={rxPriceResult}
          framePrice={framePrice}
        />
      )}

      {/* Step 3: Lens Thickness Selection */}
      {currentStep === 3 && (
        <Step4LensThickness
          rxConfig={rxConfig}
          onConfigUpdate={handleRxConfigUpdate}
          onConfigUpdateDefault={handleRxConfigUpdateWithDefault}
          onNext={() => handleStepChange(4)}
          onBack={() => handleStepChange(2)}
          formatPrice={formatPrice}
        />
      )}

      {/* Step 4: Summary with full price breakdown */}
      {currentStep === 4 && (
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
          onEditLens={() => handleStepChange(2)}
          onEditThickness={() => handleStepChange(3)}
          productSlug={productSlug}
        />
      )}
    </div>
  );
}

