"use server";

import { prisma } from "@/lib/prisma";

export interface AvailableGlassShape {
  shape: string;
  count: number;
  imageUrl?: string | null;
}

/**
 * Get all available glass shapes from products
 * Returns unique glass shapes with their product counts
 * @param type 'sunglasses' | 'eyeglasses' - Product type to fetch shapes for
 */
export async function getAvailableGlassShapes(type: 'sunglasses' | 'eyeglasses' = 'sunglasses'): Promise<AvailableGlassShape[]> {
  try {
    let products;
    if (type === 'eyeglasses') {
      // Fetch prescription glasses shapes
      products = await prisma.prescriptionGlasses.findMany({
        where: {
          glassShape: {
            not: null,
          }
        },
        select: {
          glassShape: true,
        },
      });
    } else {
      // Fetch sunglasses shapes (default)
      products = await prisma.product.findMany({
        where: {
          glassShape: {
            not: null,
          }
        },
        select: {
          glassShape: true,
        },
      });
    }

    // Group by glassShape to count occurrences
    const shapeMap = new Map<string, number>();

    products.forEach((product) => {
      if (product.glassShape) {
        const normalizedShape = product.glassShape.trim();
        if (normalizedShape) {
          shapeMap.set(
            normalizedShape,
            (shapeMap.get(normalizedShape) || 0) + 1
          );
        }
      }
    });

    // Fetch shape images from GlassShape table
    const glassShapes = await prisma.glassShape.findMany({
      where: {
        isActive: true,
      },
      select: {
        name: true,
        imageUrl: true,
        order: true,
      },
    });

    // Create a map of shape name to imageUrl
    const shapeImageMap = new Map<string, string | null>();
    glassShapes.forEach((gs) => {
      shapeImageMap.set(gs.name, gs.imageUrl);
    });

    // Convert to array and sort by count (most common first), then alphabetically
    const availableShapes: AvailableGlassShape[] = Array.from(shapeMap.entries())
      .map(([shape, count]) => ({
        shape,
        count,
        imageUrl: shapeImageMap.get(shape) || null,
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
    console.error("Error fetching available glass shapes:", error);
    return [];
  }
}

