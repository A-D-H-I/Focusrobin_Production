"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export interface AvailableMaterial {
  material: string;
  count: number;
}

/**
 * Get all available frame materials from products
 * Returns unique materials with their product counts
 */
export async function getAvailableMaterials(): Promise<AvailableMaterial[]> {
  return unstable_cache(
    async () => {
      try {
        // Use groupBy instead of finding all
        const materialCounts = await prisma.product.groupBy({
          by: ['frameMaterial'] as const,
          _count: {
            _all: true
          }
        });

        // Convert to array and sort by count (most common first), then alphabetically
        const availableMaterials: AvailableMaterial[] = materialCounts
          .map((item) => ({
            material: item.frameMaterial,
            count: item._count._all,
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
        console.error("Error fetching available materials:", error);
        return [];
      }
    },
    ['available-materials'],
    {
      revalidate: 3600,
      tags: ['products', 'materials']
    }
  )();
}

