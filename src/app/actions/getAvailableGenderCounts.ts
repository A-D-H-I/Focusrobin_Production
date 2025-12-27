"use server";

import { prisma } from "@/lib/prisma";
import { Gender } from "@prisma/client";

export interface GenderCount {
  gender: string;
  displayName: string;
  count: number;
}

/**
 * Get product counts for each gender
 * Returns gender options with their product counts
 */
export async function getAvailableGenderCounts(): Promise<GenderCount[]> {
  try {
    // Fetch all products with their genders
    const products = await prisma.product.findMany({
      select: {
        gender: true,
      },
    });

    // Count products for each gender
    const genderCounts = new Map<string, number>();

    products.forEach((product) => {
      if (product.gender && Array.isArray(product.gender)) {
        product.gender.forEach((gender) => {
          const genderKey = gender.toLowerCase();
          genderCounts.set(
            genderKey,
            (genderCounts.get(genderKey) || 0) + 1
          );
        });
      }
    });

    // Map to display format
    const genderMap: Record<string, string> = {
      men: "Men",
      women: "Women",
      kids: "Kids",
      unisex: "Unisex",
    };

    // Convert to array and sort
    const availableGenders: GenderCount[] = Array.from(genderCounts.entries())
      .map(([genderKey, count]) => ({
        gender: genderKey,
        displayName: genderMap[genderKey] || genderKey,
        count,
      }))
      .sort((a, b) => {
        // Sort by display name alphabetically
        return a.displayName.localeCompare(b.displayName);
      });

    return availableGenders;
  } catch (error) {
    console.error("Error fetching available gender counts:", error);
    return [];
  }
}

