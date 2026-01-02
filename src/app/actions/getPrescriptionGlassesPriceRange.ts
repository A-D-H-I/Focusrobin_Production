"use server";

import { prisma } from "@/lib/prisma";

export interface PriceRange {
  min: number;
  max: number;
}

/**
 * Get the minimum and maximum prices from all prescription glasses
 * Calculates based on the final price (basePrice with discount applied)
 */
export async function getPrescriptionGlassesPriceRange(): Promise<PriceRange> {
  try {
    // Fetch all prescription glasses with their pricing
    const prescriptionGlasses = await prisma.prescriptionGlasses.findMany({
      select: {
        basePrice: true,
        discountPct: true,
      },
    });

    if (prescriptionGlasses.length === 0) {
      return { min: 0, max: 500 };
    }

    // Calculate final prices (basePrice * (1 - discountPct/100))
    const prices = prescriptionGlasses.map((glasses) => {
      const basePrice = Number(glasses.basePrice);
      const discountPct = glasses.discountPct || 0;
      const finalPrice = basePrice * (1 - discountPct / 100);
      return finalPrice;
    });

    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));

    return { min, max };
  } catch (error) {
    console.error("Error fetching price range for prescription glasses:", error);
    return { min: 0, max: 500 };
  }
}

