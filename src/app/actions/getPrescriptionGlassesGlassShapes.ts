"use server";

import { prisma } from "@/lib/prisma";

export interface AvailableGlassShape {
  shape: string;
  count: number;
}

/**
 * Get all available glass shapes from prescription glasses
 * Returns unique glass shapes with their product counts
 */
export async function getPrescriptionGlassesGlassShapes(): Promise<AvailableGlassShape[]> {
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
        // First sort by count (most common first)
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        // Then alphabetically by shape name
        return a.shape.localeCompare(b.shape);
      });

    return availableShapes;
  } catch (error) {
    console.error("Error fetching available glass shapes for prescription glasses:", error);
    return [];
  }
}

