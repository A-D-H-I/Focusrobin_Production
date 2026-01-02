"use server";

import { prisma } from "@/lib/prisma";

export interface AvailableMaterial {
  material: string;
  count: number;
}

/**
 * Get all available frame materials from prescription glasses
 * Returns unique materials with their product counts
 */
export async function getPrescriptionGlassesMaterials(): Promise<AvailableMaterial[]> {
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
        // First sort by count (most common first)
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        // Then alphabetically by material name
        return a.material.localeCompare(b.material);
      });

    return availableMaterials;
  } catch (error) {
    console.error("Error fetching available materials for prescription glasses:", error);
    return [];
  }
}

