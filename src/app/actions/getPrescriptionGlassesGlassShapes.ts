"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export interface AvailableGlassShape {
  shape: string;
  count: number;
}

/**
 * Get all available glass shapes from prescription glasses
 * Returns unique glass shapes with their product counts
 */
export async function getPrescriptionGlassesGlassShapes(): Promise<AvailableGlassShape[]> {
  return unstable_cache(
    async () => {
      try {
        // Fetch all prescription glasses with glassShape
        const prescriptionGlasses = await prisma.prescriptionGlasses.findMany({
          where: {
            glassShape: {
              not: null,
            },
          },
          select: {
            glassShape: true,
          },
        });

        // Group by glassShape to count occurrences
        const shapeMap = new Map<string, number>();

        prescriptionGlasses.forEach((glasses) => {
          if (glasses.glassShape) {
            const normalizedShape = glasses.glassShape.trim();
            if (normalizedShape) {
              shapeMap.set(
                normalizedShape,
                (shapeMap.get(normalizedShape) || 0) + 1
              );
            }
          }
        });

        // Convert to array and sort by count (most common first), then alphabetically
        const availableShapes: AvailableGlassShape[] = Array.from(shapeMap.entries())
          .map(([shape, count]) => ({
            shape,
            count,
          }))
          .sort((a, b) => {
            if (b.count !== a.count) {
              return b.count - a.count;
            }
            return a.shape.localeCompare(b.shape);
          });

        return availableShapes;
      } catch (error) {
        console.error("Error fetching available glass shapes for prescription glasses:", error);
        return [];
      }
    },
    ['prescription-glasses-shapes'],
    {
      revalidate: 3600,
      tags: ['products', 'shapes']
    }
  )();
}
