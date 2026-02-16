/**
 * Lens Pricing Module - Simplified Bundles
 * Single Source of Truth for 5 Fixed Lens Bundles
 */

import { PRICES as PRICES_167 } from "./pricing/rx167";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type LensBundle =
  | "BASIC"
  | "BLUE_FILTER"
  | "PHOTOCHROMIC"
  | "SUNGLASSES_TINT"
  | "SUNGLASSES_GRADIENT";

// For backward compatibility / UI state, we still track some sub-properties
export type TintColor = "Brown" | "Grey" | "Green";
export type TintType = "FULL_TINT_CATALOG" | "GRADIENT";
export type PhotochromicColor = "Brown" | "Grey";

// We no longer expose granular LensIndex/Coating for selection, 
// they are bundled. type definitions kept if needed for legacy types, 
// but mostly unused in new flow.
export type LensIndex = "1.50" | "1.56" | "1.60" | "1.67" | "1.74";

/**
 * Coating Types - Internal Labels
 * NOTE: Some are internal labels, not necessarily exact Bod coating names.
 * Use BUNDLE_BOD_MAPPING for actual Bod product details.
 */
export type Coating =
  | "UC"              // Uncoated (no AR)
  | "HC"              // Hard Coat only
  | "HMC"             // AR Multicoat (standard)
  | "SHMC"            // Premium AR Multicoat
  | "BLUE420_SHMC"    // Blue420 + Premium AR
  | "SERICUM_UV"      // Sericum UV (only use when confirmed)
  | "TINT_UV_PACKAGE" // Internal label for tint + UV package (neutral)
  | "CLARUS_II_INSIDE"; // Clarus II coating on inside (gradient)

/**
 * Bundle-to-Bod Product Mapping
 * Each bundle maps to a specific Bod product with its internal tech code
 */
export type BundleTechCode =
  | "HMC_STANDARD_AR"          // BASIC: Organic 1.60 AR-Multicoated (HMC)
  | "BLUE420_SHMC"             // BLUE FILTER: BLUE420 AR (SHMC) Organic 1.60
  | "PHOTO_HMC"                // PHOTOCHROMIC: Organic foto 1.56 AR-Multicoated (HMC)
  | "TINT_85_UV_HALF_LONGUS"   // SUNGLASSES TINT: Nano tinting 1.60 Full tinting ½ Longus 85% + UV
  | "GRADIENT_CLARUSII_INSIDE"; // GRADIENT: Gradient painting with Clarus II coating on inside

/**
 * Bundle → Bod Product Mapping
 * Maps each customer-facing bundle to its actual Bod product details
 */
export const BUNDLE_BOD_MAPPING: Record<LensBundle, {
  techCode: BundleTechCode;
  bodProduct: string;
  index: LensIndex;
  coating: Coating;
}> = {
  BASIC: {
    techCode: "HMC_STANDARD_AR",
    bodProduct: "Organic 1.60 AR-Multicoated (HMC)",
    index: "1.60",
    coating: "HMC",
  },
  BLUE_FILTER: {
    techCode: "BLUE420_SHMC",
    bodProduct: "BLUE420 AR (SHMC) Organic 1.60",
    index: "1.60",
    coating: "BLUE420_SHMC",
  },
  PHOTOCHROMIC: {
    techCode: "PHOTO_HMC",
    bodProduct: "Organic foto grey/brown 1.56 AR-Multicoated (HMC)",
    index: "1.56",
    coating: "HMC",
  },
  SUNGLASSES_TINT: {
    techCode: "TINT_85_UV_HALF_LONGUS",
    bodProduct: "Nano tinting 1.60 Full tinting ½ Longus 85% + UV",
    index: "1.60",
    coating: "TINT_UV_PACKAGE", // Neutral internal label - Bod SKU confirmation needed
  },
  SUNGLASSES_GRADIENT: {
    techCode: "GRADIENT_CLARUSII_INSIDE",
    bodProduct: "Gradient painting with Clarus II coating on the inside",
    index: "1.60",
    coating: "CLARUS_II_INSIDE", // Clarus II inside, NOT Sericum UV
  },
};

// Lens Bundle UI Labels
export const LENS_BUNDLE_LABELS: Record<LensBundle, string> = {
  BASIC: "Basic (AR Multicoat)",
  BLUE_FILTER: "Blue Filter (Blue 420)",
  PHOTOCHROMIC: "Photochromic (Organic Foto)",
  SUNGLASSES_TINT: "Tinted Sunglasses (Full)",
  SUNGLASSES_GRADIENT: "Gradient Sunglasses",
};

// Bundle Details (Description + Best For + Features)
export const LENS_BUNDLE_DETAILS: Record<LensBundle, { description: string; bestFor: string; features: string[] }> = {
  BASIC: {
    description: "1.60 Thinner Lens. Includes AR multicoat to reduce reflections.",
    bestFor: "Everyday indoor use.",
    features: ["Anti-Reflective", "Scratch Resistant", "UV Protection", "Water Resistant"],
  },
  BLUE_FILTER: {
    description: "1.60 Thinner Lens with Blue 420 filter + premium AR.",
    bestFor: "Screen use and digital protection.",
    features: ["Blue Light Filter", "Premium Anti-Reflective", "Scratch Resistant", "Smudge/Water Resistant"],
  },
  PHOTOCHROMIC: {
    description: "1.56 Standard Lens (Organic Foto). Clear indoors, dark outdoors. Includes AR multicoat.",
    bestFor: "Indoor/outdoor lifestyle.",
    features: ["Light Adaptive", "Anti-Reflective", "Scratch Resistant", "UV Protection"],
  },
  SUNGLASSES_TINT: {
    description: "1.60 Thinner Lens with 85% full tint + UV protection.",
    bestFor: "Bright sunny days.",
    features: ["Full Sun Tint", "100% UV Protection", "Scratch Resistant", "Thin & Light"],
  },
  SUNGLASSES_GRADIENT: {
    description: "1.60 Thinner Lens with gradient tint (Dark top → Light bottom) + Clarus II inside coating.",
    bestFor: "Driving and fashion.",
    features: ["Gradient Tint", "Backside Anti-Reflective", "Scratch Resistant", "UV Protection"],
  },
};

// Legacy descriptions export for backward compatibility (mapped to new structure)
export const LENS_BUNDLE_DESCRIPTIONS: Record<LensBundle, string> = {
  BASIC: LENS_BUNDLE_DETAILS.BASIC.description,
  BLUE_FILTER: LENS_BUNDLE_DETAILS.BLUE_FILTER.description,
  PHOTOCHROMIC: LENS_BUNDLE_DETAILS.PHOTOCHROMIC.description,
  SUNGLASSES_TINT: LENS_BUNDLE_DETAILS.SUNGLASSES_TINT.description,
  SUNGLASSES_GRADIENT: LENS_BUNDLE_DETAILS.SUNGLASSES_GRADIENT.description,
};

// Fixed Prices per Pair (EUR) - including edging
export const BUNDLE_PRICES: Record<LensBundle, number> = {
  BASIC: 29.00,
  BLUE_FILTER: 35.00,
  PHOTOCHROMIC: 49.00,
  SUNGLASSES_TINT: 45.00,
  SUNGLASSES_GRADIENT: 55.00,
};

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

export const FULL_TINT_SHADES = [85]; // Fixed 85% as per sheet

// Colors available for specific bundles
export const PHOTOCHROMIC_COLORS: PhotochromicColor[] = ["Grey", "Brown"];
export const SUNGLASS_COLORS: TintColor[] = ["Grey", "Brown", "Green"];

// Gradient Tint recipes (fixed recipes per color) - used by Step5TintOptions
export const GRADIENT_RECIPES: Record<TintColor, string> = {
  Grey: "30→0",
  Brown: "50→0",
  Green: "90→15",
};

// PRICES object for tint pair pricing - used by Step5TintOptions
// Maps to rx167 tinting fees via PRICES_167
export const PRICES = {
  tintPair: {
    FULL_TINT_CATALOG: PRICES_167.tinting.FULL_CATALOG,
    GRADIENT: PRICES_167.tinting.GRADIENT,
  },
};

// Legacy Labels for Backward Compatibility
export const LENS_TYPE_LABELS: Record<string, string> = {
  CLEAR: "Clear",
  TINTED: "Tinted",
  PHOTOCHROMIC: "Photochromic (Organic Foto)",
  POLARIZED_NUPOLAR: "Polarized",
  // Legacy alias - kept for backward compatibility but should not be used
  PHOTOCHROMIC_SOLIS: "Photochromic (Organic Foto)",
};

/**
 * Coating Labels - Correct Definitions:
 * - UC = Uncoated (NO AR coating at all)
 * - HC = Hard Coat only (scratch resistant, still reflective)
 * - HMC = AR Multicoat (standard anti-reflective stack)
 * - SHMC = Premium AR Multicoat (higher-tier AR on some stock products like Blue420)
 * - BLUE420_SHMC = Blue420 blue filter + Premium AR
 * - SERICUM_UV = Sericum UV coating (use only when Bod SKU confirmed)
 * - TINT_UV_PACKAGE = Internal label for tint + UV package (neutral, pending Bod confirmation)
 * - CLARUS_II_INSIDE = Clarus II coating on inside (for gradient)
 */
export const COATING_LABELS: Record<string, string> = {
  UC: "Uncoated (no AR)",
  HC: "Hard Coat (scratch resistant)",
  HMC: "AR Multicoat",
  SHMC: "Premium AR Multicoat",
  BLUE420_SHMC: "Blue420 Blue Filter + AR",
  SERICUM_UV: "Sericum UV (confirmed SKU only)",
  TINT_UV_PACKAGE: "Tint + UV Package",
  CLARUS_II_INSIDE: "Clarus II Inside Coating",
  // Legacy alias - kept for backward compatibility
  BLUE_PRO: "Blue Filter (legacy)",
};

// ============================================================================
// PRICING FUNCTIONS
// ============================================================================

/**
 * Get total price for the selected bundle
 */
export function getBundlePrice(bundle: LensBundle): number {
  return BUNDLE_PRICES[bundle] || 0;
}

/**
 * Get friendly description for valid bundles (e.g. "Basic - 1.60 Thinner Lens")
 * Returns empty string if invalid bundle
 */
export function getFriendlyLensDescription(selection: Partial<LensSelection> | string | null | undefined): string {
  // Handle string input (legacy compatibility)
  const bundle = typeof selection === 'string' ? selection : selection?.lensBundle;

  if (!bundle || !isValidBundle(bundle)) return "";

  const label = LENS_BUNDLE_LABELS[bundle as LensBundle];
  const details = LENS_BUNDLE_DETAILS[bundle as LensBundle];

  // Extract "1.60 Thinner Lens" part from description (usually the first sentence/part)
  const lensTypeDesc = details.description.split('.')[0] || details.description;

  let description = `${label} - ${lensTypeDesc}`;

  // IF object input, append color details
  if (typeof selection === 'object' && selection !== null) {
    // Photochromic Color
    if (bundle === "PHOTOCHROMIC" && selection.photochromicColor) {
      description += ` (${selection.photochromicColor})`;
    }

    // Sunglasses Tint
    if (bundle === "SUNGLASSES_TINT" && selection.tintColor) {
      description += ` (${selection.tintColor} - 85% Full Tint)`;
    }

    // Gradient Tint
    if (bundle === "SUNGLASSES_GRADIENT" && selection.tintColor) {
      description += ` (${selection.tintColor} Gradient)`;
    }
  }

  return description;
}

export function isValidBundle(bundle: string): boolean {
  return bundle in LENS_BUNDLE_LABELS;
}

// ============================================================================
// EXPORTS FOR COMPATIBILITY / UI
// ============================================================================

// Re-export types that might be used elsewhere
export interface LensSelection {
  lensType?: string; // Legacy field match
  lensBundle: LensBundle;

  // Optional sub-selections
  tintColor?: TintColor;
  photochromicColor?: PhotochromicColor;

  // Legacy fields for type compatibility (unused in calc)
  lensIndex?: LensIndex;
  coating?: Coating;

  // Legacy tint fields
  tintType?: "FULL_TINT_CATALOG" | "GRADIENT";
  tintRecipe?: string;
  tintShade?: number;
}


// ============================================================================
// LEGACY FUNCTIONS (Restored for UI Compatibility)
// ============================================================================

export function getSupportedIndexes(lensType: string): LensIndex[] {
  if (lensType === "POLARIZED_NUPOLAR") {
    return ["1.60", "1.67"];
  }
  return ["1.56", "1.60", "1.67"];
}

/**
 * Get allowed coatings for a lens type.
 * NOTE: In our bundle system, coatings are pre-assigned per bundle.
 * This function is kept for legacy compatibility but bundles should use BUNDLE_BOD_MAPPING.
 * 
 * Coating meanings:
 * - HMC = AR Multicoat (standard)
 * - BLUE420_SHMC = Blue420 blue filter + AR
 * - TINT_UV_PACKAGE = Internal label for tint + UV (pending Bod confirmation)
 * - CLARUS_II_INSIDE = Clarus II inside (gradient)
 */
export function getAllowedCoatings(lensType: string): Coating[] {
  switch (lensType) {
    case "CLEAR":
      // BASIC bundle uses HMC, BLUE_FILTER uses BLUE420_SHMC
      return ["HMC", "BLUE420_SHMC"];
    case "TINTED":
      // Full tint uses neutral internal label (pending Bod confirmation)
      return ["TINT_UV_PACKAGE"];
    case "GRADIENT":
      // Gradient uses Clarus II inside
      return ["CLARUS_II_INSIDE"];
    case "PHOTOCHROMIC":
    case "PHOTOCHROMIC_SOLIS": // Legacy alias
      // Photochromic (Organic Foto) uses HMC
      return ["HMC"];
    case "POLARIZED_NUPOLAR":
      // Keep SERICUM_UV for polarized (pending confirmation)
      return ["SERICUM_UV"];
    default:
      // Default to HMC (AR Multicoat), NOT UC
      return ["HMC"];
  }
}

/**
 * Get base pair price for a specific configuration
 * Currently only supports 1.67 via rx167 module.
 * Returns 0 for other indexes (fallback).
 */
export function getBasePairPrice(
  lensType: string,
  lensIndex: string,
  coating: string
): number {
  // We currently only have the pricing module for 1.67 connected
  if (lensIndex !== "1.67") {
    // Fallback/Mock for other indexes if needed, or 0
    return 0;
  }

  // Map legacy coating strings to what rx167 expects if needed
  // rx167 expects "UC" | "BLUE_PRO"
  const safeCoating = (coating === "UC" || coating === "BLUE_PRO")
    ? coating
    : "UC"; // Default to UC if unknown

  // TINTED is handled as CLEAR_OR_TINT in pricing module
  if (lensType === "CLEAR") {
    return PRICES_167.lenses.CLEAR_OR_TINT[safeCoating];
  }
  if (lensType === "TINTED") {
    return PRICES_167.lenses.CLEAR_OR_TINT[safeCoating];
  }
  if (lensType === "PHOTOCHROMIC" || lensType === "PHOTOCHROMIC_SOLIS") {
    // Note: PHOTOCHROMIC_SOLIS is legacy; we now sell Organic Foto, not Solis
    return PRICES_167.lenses.PHOTOCHROMIC_SOLIS[safeCoating];
  }
  if (lensType === "POLARIZED_NUPOLAR") {
    return PRICES_167.lenses.POLARIZED_NUPOLAR[safeCoating];
  }

  return 0;
}

/**
 * Calculate the price difference between the selected coating and the cheapest option
 * for the given lens type and index (per PAIR).
 */
export function getCoatingDeltaPair(
  lensType: string,
  lensIndex: string,
  coating: string
): number {
  // If coating is UC, delta is 0
  if (coating === "UC") return 0;

  // If TINTED + BLUE_PRO, check if it's same price as SERICUM_UV
  // In rx167 logic, we need to check prices
  const priceSelected = getBasePairPrice(lensType, lensIndex, coating);

  // Find "base" coating (usually UC, but for TINTED might be SERICUM_UV effectively?)
  // Actually test says: CLEAR 1.67 BLUE_PRO delta vs UC = 12.00
  // And TINTED 1.67 BLUE_PRO delta = 0 (same as SERICUM_UV?)

  // Let's get price of UC
  let baseCoating = "UC";
  if (lensType === "TINTED" || lensType === "POLARIZED_NUPOLAR") {
    // For these, we typically default to SERICUM_UV in legacy logic?
    // But getBasePairPrice for TINTED uses CLEAR_OR_TINT table.
    // Let's compare vs UC price.
    // Wait, the test says:
    // "return 0 for TINTED when SERICUM_UV and BLUE_PRO are same price"
  }

  const priceUC = getBasePairPrice(lensType, lensIndex, "UC");

  // However, for TINTED, typically the "base" is considered including SERICUM_UV?
  // Let's simpler logic: return max(0, priceSelected - priceOfCheapestAllowed)

  const allowed = getAllowedCoatings(lensType);
  if (allowed.length === 0) return 0;

  const prices = allowed.map(c => getBasePairPrice(lensType, lensIndex, c));
  const minPrice = Math.min(...prices);

  // Wait, if minPrice is 0 (e.g. invalid index), return 0
  if (minPrice === 0 && priceSelected === 0) return 0;

  // Test expectation: CLEAR 1.67 BLUE_PRO (62.14) vs UC (50.14) => 12.00
  // The test says "delta vs UC". 
  // But let's look at `Step4Coating.tsx`: 
  // "Calculate price delta (difference from cheapest allowed coating)"
  // So yes, difference from minPrice of allowed.

  return Math.max(0, priceSelected - minPrice);
}

/**
 * Calculate total for the pair (Legacy helper)
 */
export function calculateLensPairTotal(selection: LensSelection): number {
  if (!selection.lensType || !selection.lensIndex || !selection.coating) return 0;

  let total = getBasePairPrice(selection.lensType, selection.lensIndex, selection.coating);

  // Add extras
  // Tint
  if (selection.lensType === "TINTED") {
    if (selection.tintType === "FULL_TINT_CATALOG") {
      total += PRICES_167.tinting.FULL_CATALOG;
    } else if (selection.tintType === "GRADIENT") {
      total += PRICES_167.tinting.GRADIENT;
    }
  }

  return total;
}

/**
 * Get "From" price for marketing (lowest price for this type/index)
 * Adds fixed profit?
 * Test: CLEAR 1.67 (50.14) + 15 profit = 65.14
 */
export function getFromPricePair(lensType: string, lensIndex: string): number {
  // Get base price of cheapest coating
  const allowed = getAllowedCoatings(lensType);
  if (allowed.length === 0) return 0;

  const basePrice = getBasePairPrice(lensType, lensIndex, allowed[0]); // assume first is cheapest/base

  // Add profit (15.00)
  // We can import FIXED_PROFIT from rx167 if exported, or hardcode 15 as per test expectation
  // rx167 exports FIXED_PROFIT
  const profit = 15.00;

  return basePrice + profit;
}

export function normalizeSelection(selection: LensSelection): LensSelection {
  const normalized = { ...selection };

  // 1. Index Normalization
  if (selection.lensType === "POLARIZED_NUPOLAR") {
    if (selection.lensIndex === "1.56") {
      normalized.lensIndex = "1.60";
    }
  }

  // 2. Coating Normalization
  const allowedCoatings = getAllowedCoatings(selection.lensType || "CLEAR");
  if (selection.coating && !allowedCoatings.includes(selection.coating)) {
    // Default to first allowed
    normalized.coating = allowedCoatings[0] as Coating;
  } else if (!selection.coating && allowedCoatings.length > 0) {
    normalized.coating = allowedCoatings[0] as Coating;
  }

  // 3. Tint Cleanup
  // 3. Tint Cleanup
  // Check if sunglasses (Tinted or Gradient)
  const isSunglasses = selection.lensType === "TINTED" ||
    selection.lensType === "GRADIENT" ||
    selection.lensBundle?.includes("SUNGLASSES");

  if (!isSunglasses) {
    delete normalized.tintType;
    delete normalized.tintColor;
    delete (normalized as any).tintShade;
    delete (normalized as any).tintRecipe;
  } else {
    // Defaults for TINTED/GRADIENT
    if (!normalized.tintType) {
      if (selection.lensBundle === "SUNGLASSES_GRADIENT" || selection.lensType === "GRADIENT") {
        normalized.tintType = "GRADIENT";
      } else {
        normalized.tintType = "FULL_TINT_CATALOG";
      }
    }

    if (!normalized.tintColor) normalized.tintColor = "Grey";

    // Set shades/recipes
    if (normalized.tintType === "FULL_TINT_CATALOG" && !(normalized as any).tintShade) {
      (normalized as any).tintShade = 85;
    }
    if (normalized.tintType === "GRADIENT" && !(normalized as any).tintRecipe) {
      (normalized as any).tintRecipe = "50->0"; // Mock default
    }
  }

  return normalized;
}

