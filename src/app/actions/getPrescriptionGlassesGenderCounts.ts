"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { Gender } from "@prisma/client";

export interface GenderCount {
  gender: string;
  displayName: string;
  count: number;
}

/**
 * Get product counts for each gender from prescription glasses
 * Returns gender options with their product counts
 */
export async function getPrescriptionGlassesGenderCounts(): Promise<GenderCount[]> {
  return unstable_cache(
    async () => {
      try {
        // Fetch all prescription glasses with their genders
        const prescriptionGlasses = await prisma.prescriptionGlasses.findMany({
          select: {
            gender: true,
          },
        });

        // Count products for each gender
        const genderCounts = new Map<string, number>();

        prescriptionGlasses.forEach((glasses) => {
          if (glasses.gender && Array.isArray(glasses.gender)) {
            glasses.gender.forEach((gender) => {
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
            return a.displayName.localeCompare(b.displayName);
          });

        return availableGenders;
      } catch (error) {
        console.error("Error fetching available gender counts for prescription glasses:", error);
        return [];
      }
    },
    ['prescription-glasses-gender-counts'],
    {
      revalidate: 3600,
      tags: ['products', 'genders']
    }
  )();
}
