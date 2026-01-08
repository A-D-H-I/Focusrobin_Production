// Rx Lens Pricing Module for Mono RX 1.67 Lenses
// Based on BOD Lenses Price List 2025 CSV (auto-generated)

// Import pricing data from CSV (auto-generated)
import { LENS_PRICE_SINGLE, TINT_FEES_PAIR, EDGING_FEES } from '../data/lensPricingData';
// Import validation to ensure CSV is always the source of truth
import { validatePricingOnLoad, getValidatedPrice, getValidatedTintFee, getValidatedEdgingFee } from './validatePricing';

export type Coating = "UC" | "BLUE_PRO";
export type LensCategory = "CLEAR_OR_TINT" | "PHOTOCHROMIC_SOLIS" | "POLARIZED_NUPOLAR";
export type TintType = "NONE" | "FULL_CATALOG" | "GRADIENT";
export type FrameType =
  | "FULL_FRAME"
  | "NYLON_FRAME"
  | "RIMLESS_PRESSING"
  | "RIMLESS_INDIVIDUAL"
  | "LINDBERG_COMPLEX";

// Display labels for UI
export const LENS_CATEGORY_LABELS: Record<LensCategory, string> = {
  CLEAR_OR_TINT: "Clear / Tinted",
  PHOTOCHROMIC_SOLIS: "Standard Photochromic (Solis II)",
  POLARIZED_NUPOLAR: "Polarized (NuPolar)",
};

export const COATING_LABELS: Record<Coating, string> = {
  UC: "Uncoated (UC)",
  BLUE_PRO: "Blue PRO (Blue-light protective AR)",
};

export const TINT_TYPE_LABELS: Record<TintType, string> = {
  NONE: "No Tint (Clear)",
  FULL_CATALOG: "Full Tint - Catalog Colors",
  GRADIENT: "Gradient Tint",
};

export const FRAME_TYPE_LABELS: Record<FrameType, string> = {
  FULL_FRAME: "Full Frame",
  NYLON_FRAME: "Nylon Frame",
  RIMLESS_PRESSING: "Rimless (Plastic Pressing)",
  RIMLESS_INDIVIDUAL: "Rimless (Individual Mountings)",
  LINDBERG_COMPLEX: "Lindberg / Complex",
};

// Available tint colors (ONLY these three for catalog)
export const TINT_COLORS = ["Brown", "Grey", "Green"] as const;
export type TintColor = (typeof TINT_COLORS)[number];

// Full Tint shade levels (percentage) by color
export const FULL_TINT_SHADES: Record<TintColor, readonly number[]> = {
  Green: [15, 30, 85] as const,
  Brown: [15, 50, 85] as const,
  Grey: [15, 70, 85] as const,
} as const;

// Gradient Tint recipes (fixed recipes per color)
export const GRADIENT_TINT_RECIPES: Record<TintColor, string> = {
  Grey: "30→0",
  Brown: "50→0",
  Green: "90→15",
} as const;

// Photochromic colors
export const PHOTOCHROMIC_COLORS = ["Brown", "Grey"] as const;
export type PhotochromicColor = (typeof PHOTOCHROMIC_COLORS)[number];

// Polarized colors
export const POLARIZED_COLORS = ["Brown", "Grey", "Green"] as const;
export type PolarizedColor = (typeof POLARIZED_COLORS)[number];

// Price constants (EUR) from BOD Lenses Price List 2025 CSV
// Auto-generated from data/pricing/bod-lenses-price-list-2025.csv
// Run: npm run generate-pricing to regenerate after CSV changes

// Validate pricing data on module load - ensures CSV is always the source of truth
validatePricingOnLoad();

/**
 * Get lens price for 1.67 index (validated from CSV)
 * 
 * This function ensures prices come from CSV and throws errors if missing.
 * No hardcoded fallbacks - CSV is the only source of truth.
 */
function getLensPrice167(lensType: "CLEAR" | "PHOTOCHROMIC_SOLIS" | "POLARIZED_NUPOLAR", coating: "UC" | "BLUE_PRO"): number {
  return getValidatedPrice(lensType, "1.67", coating);
}

export const PRICES = {
  // Per 1 lens prices (1.67 index only for this module)
  // All prices are validated from CSV - no hardcoded fallbacks
  lenses: {
    CLEAR_OR_TINT: {
      UC: getLensPrice167("CLEAR", "UC"),
      BLUE_PRO: getLensPrice167("CLEAR", "BLUE_PRO"),
    },
    PHOTOCHROMIC_SOLIS: {
      UC: getLensPrice167("PHOTOCHROMIC_SOLIS", "UC"),
      BLUE_PRO: getLensPrice167("PHOTOCHROMIC_SOLIS", "BLUE_PRO"),
    },
    POLARIZED_NUPOLAR: {
      UC: getLensPrice167("POLARIZED_NUPOLAR", "UC"),
      BLUE_PRO: getLensPrice167("POLARIZED_NUPOLAR", "BLUE_PRO"),
    },
  },
  // Per PAIR tinting service (not per lens)
  // All fees are validated from CSV - no hardcoded fallbacks
  tinting: {
    NONE: 0,
    FULL_CATALOG: getValidatedTintFee('FULL_TINT_CATALOG'),
    GRADIENT: getValidatedTintFee('GRADIENT'),
  },
  // Per order edging/mounting fee
  // All fees are validated from CSV - no hardcoded fallbacks
  edging: {
    FULL_FRAME: getValidatedEdgingFee('FULL_FRAME'),
    NYLON_FRAME: getValidatedEdgingFee('NYLON_FRAME'),
    RIMLESS_PRESSING: getValidatedEdgingFee('RIMLESS_PRESSING'),
    RIMLESS_INDIVIDUAL: getValidatedEdgingFee('RIMLESS_INDIVIDUAL'),
    LINDBERG_COMPLEX: getValidatedEdgingFee('LINDBERG_COMPLEX'),
  },
} as const;

// Fixed profit margin (EUR)
export const FIXED_PROFIT = 15.00;

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface RxPriceInput {
  framePrice: number;          // Frame price (EUR)
  lensCategory: LensCategory;  // Clear/tint vs Solis vs NuPolar
  coating: Coating;            // UC or BLUE_PRO
  tintType?: TintType;         // Only used if lensCategory = CLEAR_OR_TINT
  frameType: FrameType;        // Edging fee
  // Optional pricing strategy overrides
  fixedProfit?: number;        // Fixed profit in EUR (default: 15)
  markupMultiplier?: number;   // e.g. 2.2 (overrides fixedProfit)
  margin?: number;             // e.g. 0.6 means 60% margin (overrides fixedProfit)
  vatRate?: number;            // e.g. 0.21 for 21% VAT
}

export interface RxPriceBreakdown {
  lensBasePerLens: number;
  tintPairAddOn: number;       // Tint price per pair (not per lens)
  lensesPair: number;           // 2 * lensBasePerLens (no tint included here)
  edgingFee: number;
  rxAddOnNet: number;          // Cost before profit: lensesPair + edgingFee + tintPairAddOn
  profit: number;              // Profit amount
  rxRetailNet: number;         // After profit, before VAT
  rxRetailGross: number;       // After VAT
}

export interface RxPriceResult {
  breakdown: RxPriceBreakdown;
  totalNet: number;            // Frame + Rx retail net
  totalGross: number;          // Frame + Rx retail gross (with VAT)
}

export function calculateRxTotal(input: RxPriceInput): RxPriceResult {
  const {
    framePrice,
    lensCategory,
    coating,
    tintType = "NONE",
    frameType,
    fixedProfit = FIXED_PROFIT,
    markupMultiplier,
    margin,
    vatRate = 0,
  } = input;

  // Tint only applies to CLEAR_OR_TINT category
  // Force NONE for other categories
  const effectiveTintType = lensCategory === "CLEAR_OR_TINT" ? tintType : "NONE";
  
  // Tint pricing is per PAIR (not per lens)
  const tintPairAddOn = PRICES.tinting[effectiveTintType];

  const lensBasePerLens = PRICES.lenses[lensCategory][coating];
  const edgingFee = PRICES.edging[frameType];

  // Calculate pair price (2 lenses) - tint is added separately per pair
  const lensesPair = 2 * lensBasePerLens;
  const rxAddOnNet = lensesPair + edgingFee + tintPairAddOn;

  // Calculate retail price with profit
  let rxRetailNet = rxAddOnNet;
  let profit = 0;

  if (typeof markupMultiplier === "number") {
    rxRetailNet = rxAddOnNet * markupMultiplier;
    profit = rxRetailNet - rxAddOnNet;
  } else if (typeof margin === "number") {
    rxRetailNet = rxAddOnNet / (1 - margin);
    profit = rxRetailNet - rxAddOnNet;
  } else {
    // Use fixed profit (default: 15 EUR)
    profit = fixedProfit;
    rxRetailNet = rxAddOnNet + profit;
  }

  // Apply VAT
  const rxRetailGross = rxRetailNet * (1 + vatRate);

  // Calculate totals
  const totalNet = framePrice + rxRetailNet;
  const totalGross = framePrice + rxRetailGross;

  return {
    breakdown: {
      lensBasePerLens: round2(lensBasePerLens),
      tintPairAddOn: round2(tintPairAddOn),
      lensesPair: round2(lensesPair),
      edgingFee: round2(edgingFee),
      rxAddOnNet: round2(rxAddOnNet),
      profit: round2(profit),
      rxRetailNet: round2(rxRetailNet),
      rxRetailGross: round2(rxRetailGross),
    },
    totalNet: round2(totalNet),
    totalGross: round2(totalGross),
  };
}

// Helper to get lens description for display
export function getLensDescription(
  lensCategory: LensCategory,
  coating: Coating,
  tintType?: TintType,
  tintColor?: string,
  tintShadePercent?: number,
  tintRecipe?: string,
  lensColor?: string
): string {
  const parts: string[] = [];
  
  parts.push(LENS_CATEGORY_LABELS[lensCategory]);
  parts.push(COATING_LABELS[coating]);
  
  if (lensCategory === "CLEAR_OR_TINT" && tintType && tintType !== "NONE") {
    parts.push(TINT_TYPE_LABELS[tintType]);
    if (tintColor) {
      if (tintType === "FULL_CATALOG" && tintShadePercent) {
        parts.push(`${tintColor} ${tintShadePercent}%`);
      } else if (tintType === "GRADIENT" && tintRecipe) {
        parts.push(`${tintColor} ${tintRecipe}`);
      } else {
        parts.push(`Color: ${tintColor}`);
      }
    }
  }
  
  if (lensCategory === "PHOTOCHROMIC_SOLIS" && lensColor) {
    parts.push(`Color: ${lensColor}`);
  }
  
  if (lensCategory === "POLARIZED_NUPOLAR" && lensColor) {
    parts.push(`Color: ${lensColor}`);
  }
  
  return parts.join(" • ");
}
