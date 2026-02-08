import { LensBundle, BUNDLE_BOD_MAPPING } from "@/lib/lensPricing";
import { BUY_COST_PER_LENS_EUR, ADDITIONAL_SERVICE_COSTS_PER_LENS, EDGING_COSTS_EUR } from "@/lib/bodCosts";

export interface BundleCostBreakdown {
    lensPairCost: number;
    tintCost: number;
    edgingCost: number;
    totalCost: number;
    isMissingCost: boolean;
}

/**
 * Calculates the total cost for a lens bundle.
 * 
 * Formula:
 * Total Cost = (Lens Buy Cost * 2) + Tint Cost + Edging Cost
 */
export function getBundleCost(
    bundle: LensBundle,
    edgingType: keyof typeof EDGING_COSTS_EUR = "DEFAULT_AVG"
): BundleCostBreakdown {
    const mapping = BUNDLE_BOD_MAPPING[bundle];
    const techCode = mapping.techCode;

    const buyCostPerLens = BUY_COST_PER_LENS_EUR[techCode];

    // If cost is missing for this tech code, return empty cost structure
    if (buyCostPerLens === undefined) {
        return {
            lensPairCost: 0,
            tintCost: 0,
            edgingCost: 0,
            totalCost: 0,
            isMissingCost: true,
        };
    }

    const lensPairCost = buyCostPerLens * 2;


    // Tint / Service costs (e.g. Gradient Painting)
    const serviceCostPerLens = ADDITIONAL_SERVICE_COSTS_PER_LENS[techCode] || 0;
    const tintCost = serviceCostPerLens * 2;

    const edgingCost = EDGING_COSTS_EUR[edgingType];

    return {
        lensPairCost,
        tintCost,
        edgingCost,
        totalCost: lensPairCost + tintCost + edgingCost,
        isMissingCost: false,
    };
}
