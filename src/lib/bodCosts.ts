/**
 * Bod Lenses Cost Constants
 * Single source of truth for internal lens costs from Bod.
 */

import { BundleTechCode } from "./lensPricing";

/**
 * Buy Cost Per Lens (EUR)
 * Based on Bod Price List 2025.
 * Values are for a SINGLE lens. Pair cost = Value * 2.
 */
export const BUY_COST_PER_LENS_EUR: Partial<Record<BundleTechCode, number>> = {
    HMC_STANDARD_AR: 3.96,        // BASIC
    BLUE420_SHMC: 6.16,           // BLUE FILTER
    PHOTO_HMC: 6.60,              // PHOTOCHROMIC
    TINT_85_UV_HALF_LONGUS: 7.50, // SUNGLASSES TINT
    GRADIENT_CLARUSII_INSIDE: 3.96, // GRADIENT (Base Lens: HMC) - Service cost added below
};

/**
 * Additional Service Costs Per Lens (EUR)
 * e.g. Tinting, Gradient Painting, Mirror coating etc.
 * Added ON TOP of the Buy Cost.
 */
export const ADDITIONAL_SERVICE_COSTS_PER_LENS: Partial<Record<BundleTechCode, number>> = {
    GRADIENT_CLARUSII_INSIDE: 8.00, // Gradient painting with Clarus II inside
};

/**
 * Edging / Mounting Costs (EUR)
 * Per ORDER (not per lens).
 */
export const EDGING_COSTS_EUR = {
    FULL_FRAME: 4.60,
    NYLON: 5.90,
    RIMLESS_PRESS: 12.00,
    DEFAULT_AVG: 7.50, // Average of the three types, used for general profitability view
};
