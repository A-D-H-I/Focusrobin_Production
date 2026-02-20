"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export interface AvailableColor {
  colorName: string;
  colorHex: string;
  textureImageUrl?: string;
  count: number;
}

/**
 * Get available frame colors from products — ONLY those with colorFamily set.
 * Groups by colorFamily, fetches hex from the ColorFamily table for display.
 * Products without a colorFamily are excluded from filters/mega menu.
 */
export async function getAvailableFrameColors(type: 'sunglasses' | 'eyeglasses' = 'sunglasses'): Promise<AvailableColor[]> {
  return unstable_cache(
    async () => {
      try {
        // 1. Fetch all ColorFamily records for hex lookup
        const colorFamilies = await prisma.colorFamily.findMany();
        const familyHexMap = new Map<string, string>();
        colorFamilies.forEach(cf => {
          familyHexMap.set(cf.name.toLowerCase(), cf.hex);
        });

        // 2. Group by colorFamily to get counts
        let variantCounts: { colorFamily: string | null; _count: { _all: number } }[] = [];

        if (type === 'eyeglasses') {
          // @ts-ignore
          variantCounts = await prisma.prescriptionGlassesVariant.groupBy({
            by: ['colorFamily'],
            _count: { _all: true },
            where: { colorFamily: { not: null } }
          });
        } else {
          // @ts-ignore
          variantCounts = await prisma.productVariant.groupBy({
            by: ['colorFamily'],
            _count: { _all: true },
            where: { colorFamily: { not: null } }
          });
        }

        // 3. Fetch texture images (distinct)
        // We can't easily get "first texture" from groupBy, so we use findMany distinct
        let textures: { colorFamily: string | null; textureImageUrl: string | null }[] = [];

        if (type === 'eyeglasses') {
          textures = await prisma.prescriptionGlassesVariant.findMany({
            where: { colorFamily: { not: null } },
            distinct: ['colorFamily'],
            select: { colorFamily: true, textureImageUrl: true }
          });
        } else {
          textures = await prisma.productVariant.findMany({
            where: { colorFamily: { not: null } },
            distinct: ['colorFamily'],
            select: { colorFamily: true, textureImageUrl: true }
          });
        }

        const textureMap = new Map<string, string | null>();
        textures.forEach(t => {
          if (t.colorFamily) textureMap.set(t.colorFamily.toLowerCase(), t.textureImageUrl);
        });

        // 4. Map and sort
        const availableColors: AvailableColor[] = variantCounts
          .filter(v => v.colorFamily) // Should be filtered by where clause but double check
          .map(v => {
            const familyName = v.colorFamily!.trim();
            const key = familyName.toLowerCase();
            const hex = familyHexMap.get(key) || '#E5E7EB';
            const texture = textureMap.get(key);

            return {
              colorName: familyName,
              colorHex: hex,
              textureImageUrl: texture || undefined,
              count: v._count._all
            };
          })
          .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return a.colorName.localeCompare(b.colorName);
          });

        return availableColors;
      } catch (error) {
        console.error("Error fetching available frame colors:", error);
        return [];
      }
    },
    [`available-colors-${type}`],
    {
      revalidate: 3600,
      tags: ['products', 'variants', 'colors']
    }
  )();
}
