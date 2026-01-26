/**
 * Lens Pricing Module - Single Source of Truth
 * Handles all lens type, index, coating, and tint pricing calculations
 * Prices are now loaded from the database
 */

// Import pricing functions from database (sync version for compatibility)
import { 
  getLensPriceFromDBSync, 
  getTintFeeFromDBSync,
  getFixedProfitFromDBSync 
} from './pricing/syncDbPricing';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type LensType = "CLEAR" | "TINTED" | "PHOTOCHROMIC_SOLIS" | "POLARIZED_NUPOLAR";
export type LensIndex = "1.56" | "1.60" | "1.67";
export type Coating = "UC" | "BLUE_PRO" | "SERICUM_UV";
export type TintType = "FULL_TINT_CATALOG" | "GRADIENT";
export type TintColor = "Brown" | "Grey" | "Green";
export type PhotochromicColor = "Brown" | "Grey";
export type PolarizedColor = "Brown" | "Grey" | "Green";

// Coating UI labels
export const COATING_LABELS: Record<Coating, string> = {
  UC: "Uncoated (UC)",
  SERICUM_UV: "UV Protection",
  BLUE_PRO: "Blue PRO",
};

// Lens type UI labels
export const LENS_TYPE_LABELS: Record<LensType, string> = {
  CLEAR: "Clear (Mono RX)",
  TINTED: "Tinted (Mono RX)",
  PHOTOCHROMIC_SOLIS: "Photochromic (Solis II)",
  POLARIZED_NUPOLAR: "Polarized (NuPolar)",
};

// ============================================================================
// PRICING CONSTANTS
// ============================================================================

// Pricing is now loaded from database via syncDbPricing module
// Prices are cached and refreshed periodically

// Full Tint shade options by color
export const FULL_TINT_SHADES: Record<TintColor, readonly number[]> = {
  Green: [15, 30, 85] as const,
  Brown: [15, 50, 85] as const,
  Grey: [15, 70, 85] as const,
};

// Gradient fixed recipes (non-editable)
export const GRADIENT_RECIPES: Record<TintColor, string> = {
  Grey: "30->0",
  Brown: "50->0",
  Green: "90->15",
};

// Default shade for Full Tint by color
const DEFAULT_FULL_TINT_SHADE: Record<TintColor, number> = {
  Grey: 70,
  Brown: 50,
  Green: 30,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Round to 2 decimal places
 */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// ============================================================================
// AVAILABILITY & ALLOWED OPTIONS HELPERS
// ============================================================================

/**
 * Get supported lens indices for a lens type
 */
export function getSupportedIndexes(lensType: LensType): LensIndex[] {
  switch (lensType) {
    case "CLEAR":
    case "TINTED":
    case "PHOTOCHROMIC_SOLIS":
      return ["1.56", "1.60", "1.67"];
    case "POLARIZED_NUPOLAR":
      return ["1.60", "1.67"]; // No 1.56
    default:
      return ["1.67"];
  }
}

/**
 * Get allowed coatings for a lens type
 */
export function getAllowedCoatings(lensType: LensType): Coating[] {
  switch (lensType) {
    case "CLEAR":
      return ["UC", "BLUE_PRO"]; // IMPORTANT: hide SERICUM_UV for CLEAR
    case "TINTED":
    case "POLARIZED_NUPOLAR":
      return ["SERICUM_UV"]; // No BLUE_PRO for tinted and polarized
    case "PHOTOCHROMIC_SOLIS":
      return ["SERICUM_UV", "BLUE_PRO"]; // BLUE_PRO still available for photochromic
    default:
      return ["SERICUM_UV", "BLUE_PRO"];
  }
}

// ============================================================================
// PRICING CALCULATION HELPERS
// ============================================================================

/**
 * Get base pair price (single lens price * 2)
 * 
 * Fetches price from database - returns 0 if price is missing
 */
export function getBasePairPrice(
  lensType: LensType,
  index: LensIndex,
  coating: Coating
): number {
  const singlePrice = getLensPriceFromDBSync(lensType, index, coating);
  const pairPrice = round2(2 * singlePrice);
  return pairPrice;
}

/**
 * Get cheapest allowed base pair price for a lens type and index
 */
export function getCheapestAllowedBasePairPrice(
  lensType: LensType,
  index: LensIndex
): number {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c913d761-7a80-4407-9ec9-0890b22819ca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lensPricing.ts:getCheapestAllowedBasePairPrice',message:'Function entry',data:{lensType,index},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  const allowedCoatings = getAllowedCoatings(lensType);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c913d761-7a80-4407-9ec9-0890b22819ca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lensPricing.ts:getCheapestAllowedBasePairPrice',message:'Allowed coatings',data:{allowedCoatings,lensType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  const prices = allowedCoatings
    .map((coating) => getBasePairPrice(lensType, index, coating))
    .filter((price) => price > 0);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c913d761-7a80-4407-9ec9-0890b22819ca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lensPricing.ts:getCheapestAllowedBasePairPrice',message:'All prices calculated',data:{prices,allowedCoatings},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  if (prices.length === 0) {
    return 0;
  }
  
  const cheapest = round2(Math.min(...prices));
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c913d761-7a80-4407-9ec9-0890b22819ca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lensPricing.ts:getCheapestAllowedBasePairPrice',message:'Cheapest price selected',data:{cheapest,prices},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  return cheapest;
}

/**
 * Get coating delta (price difference) per pair
 */
export function getCoatingDeltaPair(
  lensType: LensType,
  index: LensIndex,
  coating: Coating
): number {
  const basePrice = getBasePairPrice(lensType, index, coating);
  const cheapestPrice = getCheapestAllowedBasePairPrice(lensType, index);
  const delta = round2(basePrice - cheapestPrice);
  return delta;
}

/**
 * Calculate total lens pair price (base + tint fee if applicable)
 * NOTE: Profit is NOT included here - it's added in PrescriptionFlow.tsx
 * This function returns the base cost price only
 */
export function calculateLensPairTotal(selection: LensSelection): number {
  const normalized = normalizeSelection(selection);
  
  const basePair = getBasePairPrice(
    normalized.lensType,
    normalized.lensIndex,
    normalized.coating
  );
  
  // Tint fee (only for TINTED)
  let tintFeePair = 0;
  if (normalized.lensType === "TINTED" && normalized.tintType) {
    tintFeePair = getTintFeeFromDBSync(normalized.tintType);
  }
  
  return round2(basePair + tintFeePair);
}

/**
 * Calculate lens pair price WITH profit incorporated (for display to customer)
 * Profit is distributed proportionally into the lens price
 * This is the price that should be shown to customers (profit is hidden)
 */
export function calculateLensPairTotalWithProfit(
  selection: LensSelection,
  fixedProfit: number = 15.00
): number {
  const baseTotal = calculateLensPairTotal(selection);
  // Add profit to the lens pair price (profit is hidden in the price)
  return round2(baseTotal + fixedProfit);
}

/**
 * Get "From €..." price for a lens type and index (WITH profit included)
 * If index is not supported, uses the first supported index for that lens type
 * Profit is incorporated into the price (hidden from customer)
 */
export function getFromPricePair(lensType: LensType, index: LensIndex, fixedProfit: number = 15.00): number {
  const supportedIndexes = getSupportedIndexes(lensType);
  
  // If the provided index is not supported, use the first supported index
  const validIndex = supportedIndexes.includes(index) 
    ? index 
    : supportedIndexes[0];
  
  const fromBase = getCheapestAllowedBasePairPrice(lensType, validIndex);
  
  // If TINTED, add minimum tint fee (FULL_TINT_CATALOG)
  let baseWithTint = fromBase;
  if (lensType === "TINTED") {
    const tintFee = getTintFeeFromDBSync('FULL_TINT_CATALOG');
    baseWithTint = fromBase + tintFee;
  }
  
  // Add profit to the price (profit is hidden from customer)
  return round2(baseWithTint + fixedProfit);
}

// ============================================================================
// LENS SELECTION INTERFACE
// ============================================================================

export interface LensSelection {
  lensType: LensType;
  lensIndex: LensIndex;
  coating: Coating;
  // Tint fields (only for TINTED)
  tintType?: TintType;
  tintColor?: TintColor;
  tintShade?: number; // For Full Tint: 15, 30, 50, 70, or 85
  tintRecipe?: string; // For Gradient: "30->0", "50->0", or "90->15"
  // Color fields (for Photochromic/Polarized)
  photochromicColor?: PhotochromicColor;
  polarizedColor?: PolarizedColor;
}

/**
 * Normalize and validate lens selection (auto-correct invalid combinations)
 */
export function normalizeSelection(selection: LensSelection): LensSelection {
  const normalized: LensSelection = { ...selection };

  // 1. Validate and auto-correct lens index
  const supportedIndexes = getSupportedIndexes(normalized.lensType);
  if (!supportedIndexes.includes(normalized.lensIndex)) {
    normalized.lensIndex = supportedIndexes[0]; // Set to first supported index
  }

  // 2. Validate and auto-correct coating
  const allowedCoatings = getAllowedCoatings(normalized.lensType);
  if (!allowedCoatings.includes(normalized.coating)) {
    normalized.coating = allowedCoatings[0]; // Set to first allowed coating
  }

  // 3. Clear tint fields if not TINTED
  if (normalized.lensType !== "TINTED") {
    normalized.tintType = undefined;
    normalized.tintColor = undefined;
    normalized.tintShade = undefined;
    normalized.tintRecipe = undefined;
  } else {
    // 4. For TINTED: ensure tintType exists
    if (!normalized.tintType) {
      normalized.tintType = "FULL_TINT_CATALOG";
    }

    // 5. For TINTED: ensure tintColor exists
    if (!normalized.tintColor) {
      normalized.tintColor = "Grey";
    }

    // 6. For FULL_TINT_CATALOG: ensure shade exists and is valid
    if (normalized.tintType === "FULL_TINT_CATALOG" && normalized.tintColor) {
      const allowedShades = FULL_TINT_SHADES[normalized.tintColor];
      if (!normalized.tintShade || !allowedShades.includes(normalized.tintShade)) {
        normalized.tintShade = DEFAULT_FULL_TINT_SHADE[normalized.tintColor];
      }
      normalized.tintRecipe = undefined;
    }

    // 7. For GRADIENT: auto-assign recipe from color
    if (normalized.tintType === "GRADIENT" && normalized.tintColor) {
      normalized.tintRecipe = GRADIENT_RECIPES[normalized.tintColor];
      normalized.tintShade = undefined;
    }
  }

  // 8. Clear color fields if not applicable
  if (normalized.lensType !== "PHOTOCHROMIC_SOLIS") {
    normalized.photochromicColor = undefined;
  }
  if (normalized.lensType !== "POLARIZED_NUPOLAR") {
    normalized.polarizedColor = undefined;
  }

  return normalized;
}

// ============================================================================
// EXPORTS
// ============================================================================

// For backward compatibility, provide getter functions
export function getTintFeesPair() {
  return {
    FULL_TINT_CATALOG: getTintFeeFromDBSync('FULL_TINT_CATALOG'),
    GRADIENT: getTintFeeFromDBSync('GRADIENT'),
  };
}

// Export as TINT_FEES for backward compatibility (getter that returns current DB values)
export const TINT_FEES = getTintFeesPair();
export const TINT_FEES_PAIR = TINT_FEES;

// PRICES object for backward compatibility
// Note: Prices are now loaded from database, but this object provides the same interface
export const PRICES = {
  tintPair: {
    FULL_TINT_CATALOG: getTintFeeFromDBSync('FULL_TINT_CATALOG'),
    GRADIENT: getTintFeeFromDBSync('GRADIENT'),
  },
} as const;
