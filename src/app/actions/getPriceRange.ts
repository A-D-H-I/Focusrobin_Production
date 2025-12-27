"use server";

import { prisma } from "@/lib/prisma";

export interface PriceRange {
  min: number;
  max: number;
}

/**
 * Get the minimum and maximum prices from all products
 * Calculates based on the final price (basePrice with discount applied)
 */
export async function getPriceRange(): Promise<PriceRange> {
  try {
    // Fetch all products with their pricing
    const products = await prisma.product.findMany({
      select: {
        basePrice: true,
        discountPct: true,
      },
    });

    if (products.length === 0) {
      return { min: 0, max: 500 };
    }

    // Calculate final prices (basePrice * (1 - discountPct/100))
    const prices = products.map((product) => {
      const basePrice = Number(product.basePrice);
      const discountPct = product.discountPct || 0;
      const finalPrice = basePrice * (1 - discountPct / 100);
      return finalPrice;
    });

    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));

    return { min, max };
  } catch (error) {
    console.error("Error fetching price range:", error);
    return { min: 0, max: 500 };
  }
}

