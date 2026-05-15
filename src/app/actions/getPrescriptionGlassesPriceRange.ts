"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { calculateRetailPrice } from "@/lib/price-utils";

export interface PriceRange {
  min: number;
  max: number;
}

/**
 * Get the minimum and maximum prices from all prescription glasses
 * Calculates based on the final price (basePrice with discount applied)
 */
export async function getPrescriptionGlassesPriceRange(): Promise<PriceRange> {
  return unstable_cache(
    async () => {
      try {
        // Fetch all prescription glasses with their pricing
        const prescriptionGlasses = await prisma.prescriptionGlasses.findMany({
          select: {
            brand: true,
            basePrice: true,
            discountPct: true,
            calculatedRetailPrice: true,
          },
        });

        if (prescriptionGlasses.length === 0) {
          return { min: 0, max: 500 };
        }

        // Calculate final prices using pre-computed price or fallback to calculation
        const prices = prescriptionGlasses.map((glasses) => {
          const retailPrice = glasses.calculatedRetailPrice
            ? Number(glasses.calculatedRetailPrice)
            : calculateRetailPrice(Number(glasses.basePrice), glasses.brand);

          const discountPct = glasses.discountPct || 0;
          const finalPrice = retailPrice * (1 - discountPct / 100);
          return finalPrice;
        });

        const min = Math.floor(Math.min(...prices));
        const max = Math.ceil(Math.max(...prices));

        return { min, max };
      } catch (error) {
        console.error("Error fetching price range for prescription glasses:", error);
        return { min: 0, max: 500 };
      }
    },
    ['price-range-prescription'],
    {
      revalidate: 3600,
      tags: ['products', 'prices']
    }
  )();
}
