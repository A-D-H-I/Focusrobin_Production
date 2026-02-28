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
        brand: true,
        basePrice: true,
        discountPct: true,
      },
    });

    if (products.length === 0) {
      return { min: 0, max: 500 };
    }

    // Calculate final prices (basePrice * (1 - discountPct/100)) with brand margin markup logic
    const prices = products.map((product) => {
      const isFocusRobin = (product.brand || '').trim().toLowerCase() === 'focusrobin';
      const rawBasePrice = Number(product.basePrice);

      let basePrice = rawBasePrice;
      if (!isFocusRobin && rawBasePrice > 0) {
        let priceWithMargin = (rawBasePrice * 1.10) + 13.5;
        priceWithMargin = priceWithMargin * 1.21;
        priceWithMargin = priceWithMargin * 1.015;
        basePrice = priceWithMargin;
      }

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

