/**
 * Synchronous Database Pricing Module
 * Provides pricing functions that work synchronously using cached data
 * 
 * Based on BOD Lenses Price List 2025 and Prescription Glasses Pricing Breakdown PDF
 * 
 * IMPORTANT: All prices are per SINGLE lens (pair price = single × 2)
 */

import { prisma } from "@/lib/prisma";

// ============================================================================
// DEFAULT PRICING VALUES (from PDF - used when DB not loaded yet)
// ============================================================================

// Prices per SINGLE lens from Prescription Glasses Pricing Breakdown PDF
const DEFAULT_LENS_PRICES: Record<string, number> = {
  // CLEAR lenses
  "CLEAR-1.56-UC": 8.49,
  "CLEAR-1.56-BLUE_PRO": 14.49,
  "CLEAR-1.56-SERICUM_UV": 14.49,
  "CLEAR-1.60-UC": 16.98,
  "CLEAR-1.60-BLUE_PRO": 22.98,
  "CLEAR-1.60-SERICUM_UV": 22.98,
  "CLEAR-1.67-UC": 25.07,
  "CLEAR-1.67-BLUE_PRO": 31.07,
  "CLEAR-1.67-SERICUM_UV": 31.07,
  // TINTED lenses (same base as CLEAR)
  "TINTED-1.56-UC": 8.49,
  "TINTED-1.56-BLUE_PRO": 14.49,
  "TINTED-1.56-SERICUM_UV": 14.49,
  "TINTED-1.60-UC": 16.98,
  "TINTED-1.60-BLUE_PRO": 22.98,
  "TINTED-1.60-SERICUM_UV": 22.98,
  "TINTED-1.67-UC": 25.07,
  "TINTED-1.67-BLUE_PRO": 31.07,
  "TINTED-1.67-SERICUM_UV": 31.07,
  // PHOTOCHROMIC_SOLIS lenses
  "PHOTOCHROMIC_SOLIS-1.56-UC": 13.53,
  "PHOTOCHROMIC_SOLIS-1.56-BLUE_PRO": 19.53,
  "PHOTOCHROMIC_SOLIS-1.56-SERICUM_UV": 19.53,
  "PHOTOCHROMIC_SOLIS-1.60-UC": 24.66,
  "PHOTOCHROMIC_SOLIS-1.60-BLUE_PRO": 30.66,
  "PHOTOCHROMIC_SOLIS-1.60-SERICUM_UV": 30.66,
  "PHOTOCHROMIC_SOLIS-1.67-UC": 32.90,
  "PHOTOCHROMIC_SOLIS-1.67-BLUE_PRO": 38.90,
  "PHOTOCHROMIC_SOLIS-1.67-SERICUM_UV": 38.90,
  // POLARIZED_NUPOLAR lenses (no 1.56)
  "POLARIZED_NUPOLAR-1.60-UC": 35.98,
  "POLARIZED_NUPOLAR-1.60-BLUE_PRO": 41.98,
  "POLARIZED_NUPOLAR-1.60-SERICUM_UV": 41.98,
  "POLARIZED_NUPOLAR-1.67-UC": 58.62,
  "POLARIZED_NUPOLAR-1.67-BLUE_PRO": 64.62,
  "POLARIZED_NUPOLAR-1.67-SERICUM_UV": 64.62,
};

// Tint fees per PAIR
const DEFAULT_TINT_FEES: Record<string, number> = {
  FULL_TINT_CATALOG: 6.00,  // €3 per lens × 2
  GRADIENT: 8.00,           // €4 per lens × 2
};

// Edging fees per ORDER
const DEFAULT_EDGING_FEES: Record<string, number> = {
  FULL_FRAME: 4.60,
  NYLON_FRAME: 5.90,
  RIMLESS_PRESSING: 12.00,
  RIMLESS_INDIVIDUAL: 20.00,
  LINDBERG_COMPLEX: 20.00,
};

// Fixed profit per order
const DEFAULT_PROFIT = 15.00;

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

// Cache for pricing data
let pricingCache: {
  lensPrices: Map<string, number>;
  tintFees: Map<string, number>;
  edgingFees: Map<string, number>;
  profit: number;
  lastUpdated: number;
  isLoaded: boolean;
} | null = null;

const CACHE_TTL = 60000; // 1 minute cache

// Initialize with defaults
function getDefaultCache() {
  const lensPriceMap = new Map<string, number>();
  for (const [key, price] of Object.entries(DEFAULT_LENS_PRICES)) {
    lensPriceMap.set(key, price);
  }

  const tintFeeMap = new Map<string, number>();
  for (const [key, price] of Object.entries(DEFAULT_TINT_FEES)) {
    tintFeeMap.set(key, price);
  }

  const edgingFeeMap = new Map<string, number>();
  for (const [key, price] of Object.entries(DEFAULT_EDGING_FEES)) {
    edgingFeeMap.set(key, price);
  }

  return {
    lensPrices: lensPriceMap,
    tintFees: tintFeeMap,
    edgingFees: edgingFeeMap,
    profit: DEFAULT_PROFIT,
    lastUpdated: 0,
    isLoaded: false,
  };
}

// Initialize with defaults immediately
if (!pricingCache) {
  pricingCache = getDefaultCache();
}

// Promise for async loading
let loadPromise: Promise<void> | null = null;

// Load pricing from database
async function loadPricingFromDB() {
  try {
    const [lensPrices, tintFees, edgingFees, profit] = await Promise.all([
      prisma.prescriptionLensPrice.findMany({
        where: { isActive: true },
      }),
      prisma.prescriptionTintFee.findMany({
        where: { isActive: true },
      }),
      prisma.prescriptionEdgingFee.findMany({
        where: { isActive: true },
      }),
      prisma.prescriptionProfit.findFirst({
        where: { isActive: true },
      }),
    ]);

    const lensPriceMap = new Map<string, number>();
    for (const price of lensPrices) {
      const key = `${price.lensType}-${price.lensIndex}-${price.coating}`;
      lensPriceMap.set(key, Number(price.price));
    }

    const tintFeeMap = new Map<string, number>();
    for (const fee of tintFees) {
      tintFeeMap.set(fee.tintType, Number(fee.price));
    }

    const edgingFeeMap = new Map<string, number>();
    for (const fee of edgingFees) {
      edgingFeeMap.set(fee.frameType, Number(fee.price));
    }

    pricingCache = {
      lensPrices: lensPriceMap.size > 0 ? lensPriceMap : pricingCache!.lensPrices,
      tintFees: tintFeeMap.size > 0 ? tintFeeMap : pricingCache!.tintFees,
      edgingFees: edgingFeeMap.size > 0 ? edgingFeeMap : pricingCache!.edgingFees,
      profit: profit ? Number(profit.profit) : DEFAULT_PROFIT,
      lastUpdated: Date.now(),
      isLoaded: true,
    };

    console.log('[syncDbPricing] Loaded pricing from database:', {
      lensPrices: lensPriceMap.size,
      tintFees: tintFeeMap.size,
      edgingFees: edgingFeeMap.size,
      profit: pricingCache.profit,
    });
  } catch (error) {
    console.error('[syncDbPricing] Error loading from database, using defaults:', error);
    // Keep defaults if DB fails
    if (pricingCache) {
      pricingCache.lastUpdated = Date.now();
    }
  } finally {
    loadPromise = null;
  }
}

// Ensure cache is being loaded
function ensurePricingLoaded(): typeof pricingCache {
  if (!pricingCache) {
    pricingCache = getDefaultCache();
  }

  const now = Date.now();
  
  // If cache is stale or not loaded from DB yet, trigger async load
  if (!pricingCache.isLoaded || (now - pricingCache.lastUpdated) > CACHE_TTL) {
    if (!loadPromise && typeof window === 'undefined') {
      // Only load from DB on server side
      loadPromise = loadPricingFromDB();
    }
  }

  return pricingCache;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get lens price from database (per SINGLE lens)
 * @returns Price per single lens (multiply by 2 for pair)
 */
export function getLensPriceFromDBSync(
  lensType: string,
  lensIndex: string,
  coating: string
): number {
  const cache = ensurePricingLoaded()!;
  const key = `${lensType}-${lensIndex}-${coating}`;
  const price = cache.lensPrices.get(key);
  
  if (price === undefined) {
    // Try default
    const defaultPrice = DEFAULT_LENS_PRICES[key];
    if (defaultPrice !== undefined) {
      return defaultPrice;
    }
    console.error(`[syncDbPricing] Price not found for ${key}`);
    return 0;
  }
  
  return price;
}

/**
 * Get tint fee from database (per PAIR)
 * @returns Tint fee per pair
 */
export function getTintFeeFromDBSync(tintType: string): number {
  const cache = ensurePricingLoaded()!;
  const fee = cache.tintFees.get(tintType);
  
  if (fee === undefined) {
    // Try default
    const defaultFee = DEFAULT_TINT_FEES[tintType];
    if (defaultFee !== undefined) {
      return defaultFee;
    }
    console.error(`[syncDbPricing] Tint fee not found for ${tintType}`);
    return 0;
  }
  
  return fee;
}

/**
 * Get edging fee from database (per ORDER)
 * @returns Edging fee per order
 */
export function getEdgingFeeFromDBSync(frameType: string): number {
  const cache = ensurePricingLoaded()!;
  const fee = cache.edgingFees.get(frameType);
  
  if (fee === undefined) {
    // Try default
    const defaultFee = DEFAULT_EDGING_FEES[frameType];
    if (defaultFee !== undefined) {
      return defaultFee;
    }
    console.error(`[syncDbPricing] Edging fee not found for ${frameType}`);
    return 0;
  }
  
  return fee;
}

/**
 * Get fixed profit from database (per ORDER)
 * @returns Fixed profit amount
 */
export function getFixedProfitFromDBSync(): number {
  const cache = ensurePricingLoaded()!;
  return cache.profit;
}

/**
 * Clear pricing cache (call after updates in admin)
 */
export function clearPricingCache() {
  if (pricingCache) {
    pricingCache.isLoaded = false;
    pricingCache.lastUpdated = 0;
  }
  loadPromise = null;
}

// Trigger initial load on server side
if (typeof window === 'undefined') {
  ensurePricingLoaded();
}
