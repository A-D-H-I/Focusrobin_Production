/**
 * Lens Pricing Module - Single Source of Truth
 * Handles all lens type, index, coating, and tint pricing calculations
 * Prices from BOD Lenses Price List 2025.xlsx
 */

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
// PRICING CONSTANTS (PER SINGLE LENS - from Excel)
// ============================================================================

// Single lens prices from Excel "BOD Lenses. Price list 2025.xlsx"
const LENS_PRICE_SINGLE: Record<LensType, Partial<Record<LensIndex, Record<Coating, number>>>> = {
  CLEAR: {
    "1.56": { UC: 8.49, BLUE_PRO: 14.49, SERICUM_UV: 14.49 },
    "1.60": { UC: 16.98, BLUE_PRO: 22.98, SERICUM_UV: 22.98 },
    "1.67": { UC: 25.07, BLUE_PRO: 31.07, SERICUM_UV: 31.07 },
  },
  TINTED: {
    // Same base prices as CLEAR, but UC will be disallowed by rules
    "1.56": { UC: 8.49, BLUE_PRO: 14.49, SERICUM_UV: 14.49 },
    "1.60": { UC: 16.98, BLUE_PRO: 22.98, SERICUM_UV: 22.98 },
    "1.67": { UC: 25.07, BLUE_PRO: 31.07, SERICUM_UV: 31.07 },
  },
  PHOTOCHROMIC_SOLIS: {
    "1.56": { UC: 13.53, BLUE_PRO: 19.53, SERICUM_UV: 19.53 },
    "1.60": { UC: 24.66, BLUE_PRO: 30.66, SERICUM_UV: 30.66 },
    "1.67": { UC: 32.90, BLUE_PRO: 38.90, SERICUM_UV: 38.90 },
  },
  POLARIZED_NUPOLAR: {
    // No 1.56 available
    "1.60": { UC: 35.98, BLUE_PRO: 41.98, SERICUM_UV: 41.98 },
    "1.67": { UC: 58.62, BLUE_PRO: 64.62, SERICUM_UV: 64.62 },
  },
};

// Tint add-on fees (per pair)
const TINT_FEES_PAIR: Record<TintType, number> = {
  FULL_TINT_CATALOG: 6.00,
  GRADIENT: 12.00,
};

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
    case "PHOTOCHROMIC_SOLIS":
    case "POLARIZED_NUPOLAR":
      return ["SERICUM_UV", "BLUE_PRO"];
    default:
      return ["SERICUM_UV", "BLUE_PRO"];
  }
}

// ============================================================================
// PRICING CALCULATION HELPERS
// ============================================================================

/**
 * Get base pair price (single lens price * 2)
 */
export function getBasePairPrice(
  lensType: LensType,
  index: LensIndex,
  coating: Coating
): number {
  const singlePrice = LENS_PRICE_SINGLE[lensType]?.[index]?.[coating];
  if (singlePrice === undefined || singlePrice === 0) {
    return 0;
  }
  return round2(2 * singlePrice);
}

/**
 * Get cheapest allowed base pair price for a lens type and index
 */
export function getCheapestAllowedBasePairPrice(
  lensType: LensType,
  index: LensIndex
): number {
  const allowedCoatings = getAllowedCoatings(lensType);
  const prices = allowedCoatings
    .map((coating) => getBasePairPrice(lensType, index, coating))
    .filter((price) => price > 0);
  
  if (prices.length === 0) {
    return 0;
  }
  
  return round2(Math.min(...prices));
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
  return round2(basePrice - cheapestPrice);
}

/**
 * Calculate total lens pair price (base + tint fee if applicable)
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
    tintFeePair = TINT_FEES_PAIR[normalized.tintType];
  }
  
  return round2(basePair + tintFeePair);
}

/**
 * Get "From €..." price for a lens type and index
 * If index is not supported, uses the first supported index for that lens type
 */
export function getFromPricePair(lensType: LensType, index: LensIndex): number {
  const supportedIndexes = getSupportedIndexes(lensType);
  
  // If the provided index is not supported, use the first supported index
  const validIndex = supportedIndexes.includes(index) 
    ? index 
    : supportedIndexes[0];
  
  const fromBase = getCheapestAllowedBasePairPrice(lensType, validIndex);
  
  // If TINTED, add minimum tint fee (FULL_TINT_CATALOG = 6)
  if (lensType === "TINTED") {
    return round2(fromBase + TINT_FEES_PAIR.FULL_TINT_CATALOG);
  }
  
  return round2(fromBase);
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

export const PRICES = {
  single: LENS_PRICE_SINGLE,
  tintPair: TINT_FEES_PAIR,
} as const;

// Export for backward compatibility
export { TINT_FEES_PAIR as TINT_FEES };
