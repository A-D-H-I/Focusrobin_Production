"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

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
  return unstable_cache(
    async () => {
      try {
        let shapeCounts: { glassShape: string | null; _count: { _all: number } }[] = [];

        if (type === 'eyeglasses') {
          // @ts-ignore
          shapeCounts = await prisma.prescriptionGlasses.groupBy({
            by: ['glassShape'],
            _count: { _all: true },
            where: { glassShape: { not: null } }
          });
        } else {
          // @ts-ignore
          shapeCounts = await prisma.product.groupBy({
            by: ['glassShape'],
            _count: { _all: true },
            where: { glassShape: { not: null } }
          });
        }

        // Fetch shape images from GlassShape table
        const glassShapes = await prisma.glassShape.findMany({
          where: { isActive: true },
          select: { name: true, imageUrl: true, order: true },
        });

        // Create a map of shape name to imageUrl
        const shapeImageMap = new Map<string, { imageUrl: string | null, order: number }>();
        glassShapes.forEach((gs) => {
          shapeImageMap.set(gs.name.toLowerCase(), { imageUrl: gs.imageUrl, order: gs.order });
        });

        // Convert to array and sort
        const availableShapes: AvailableGlassShape[] = shapeCounts
          .filter(s => s.glassShape)
          .map(s => {
            const shapeName = s.glassShape!.trim();
            const mapData = shapeImageMap.get(shapeName.toLowerCase());
            return {
              shape: shapeName,
              count: s._count._all,
              imageUrl: mapData?.imageUrl || null,
              _order: mapData?.order ?? 999
            }
          })
          .sort((a, b) => {
            if (a._order !== b._order) return a._order - b._order;
            if (b.count !== a.count) return b.count - a.count;
            return a.shape.localeCompare(b.shape);
          })
          .map(({ _order, ...rest }) => rest);

        return availableShapes;
      } catch (error) {
        console.error("Error fetching available glass shapes:", error);
        return [];
      }
    },
    [`available-shapes-${type}`],
    {
      revalidate: 3600,
      tags: ['products', 'shapes']
    }
  )();
}

