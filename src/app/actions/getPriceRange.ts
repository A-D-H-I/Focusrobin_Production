"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { calculateRetailPrice } from "@/lib/price-utils";

export interface PriceRange {
  min: number;
  max: number;
}

/**
 * Get the minimum and maximum prices from all products
 * Calculates based on the final price (basePrice with discount applied)
 */
export async function getPriceRange(): Promise<PriceRange> {
  return unstable_cache(
    async () => {
      try {
        // Fetch all products with their pricing
        const products = await prisma.product.findMany({
          select: {
            brand: true,
            basePrice: true,
            discountPct: true,
            calculatedRetailPrice: true,
          },
        });

        if (products.length === 0) {
          return { min: 0, max: 500 };
        }

        // Calculate final prices using pre-computed price or fallback to calculation
        const prices = products.map((product) => {
          const retailPrice = product.calculatedRetailPrice
            ? Number(product.calculatedRetailPrice)
            : calculateRetailPrice(Number(product.basePrice), product.brand);

          const discountPct = product.discountPct || 0;
          const finalPrice = retailPrice * (1 - discountPct / 100);
          return finalPrice;
        });

        const min = Math.floor(Math.min(...prices));
        const max = Math.ceil(Math.max(...prices));

        return { min, max };
      } catch (error) {
        console.error("Error fetching price range:", error);
        return { min: 0, max: 500 };
      }
    },
    ['price-range-sunglasses'],
    {
      revalidate: 3600,
      tags: ['products', 'prices']
    }
  )();
}
