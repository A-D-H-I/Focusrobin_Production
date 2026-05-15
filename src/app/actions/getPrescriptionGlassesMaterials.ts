"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export interface AvailableMaterial {
  material: string;
  count: number;
}

/**
 * Get all available frame materials from prescription glasses
 * Returns unique materials with their product counts
 */
export async function getPrescriptionGlassesMaterials(): Promise<AvailableMaterial[]> {
  return unstable_cache(
    async () => {
      try {
        // Fetch all prescription glasses with frameMaterial
        const prescriptionGlasses = await prisma.prescriptionGlasses.findMany({
          select: {
            frameMaterial: true,
          },
        });

        // Group by frameMaterial to count occurrences
        const materialMap = new Map<string, number>();

        prescriptionGlasses.forEach((glasses) => {
          if (glasses.frameMaterial) {
            const normalizedMaterial = glasses.frameMaterial.trim();
            if (normalizedMaterial) {
              materialMap.set(
                normalizedMaterial,
                (materialMap.get(normalizedMaterial) || 0) + 1
              );
            }
          }
        });

        // Convert to array and sort by count (most common first), then alphabetically
        const availableMaterials: AvailableMaterial[] = Array.from(materialMap.entries())
          .map(([material, count]) => ({
            material,
            count,
          }))
          .sort((a, b) => {
            if (b.count !== a.count) {
              return b.count - a.count;
            }
            return a.material.localeCompare(b.material);
          });

        return availableMaterials;
      } catch (error) {
        console.error("Error fetching available materials for prescription glasses:", error);
        return [];
      }
    },
    ['prescription-glasses-materials'],
    {
      revalidate: 3600,
      tags: ['products', 'materials']
    }
  )();
}
