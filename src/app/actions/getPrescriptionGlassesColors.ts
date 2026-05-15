"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export interface AvailableColor {
  colorName: string;
  colorHex: string;
  count: number;
}

/**
 * Get all available frame colors from prescription glasses
 * Returns unique colors with their hex codes and product counts
 * Shows all colors regardless of stock (for display purposes)
 */
export async function getPrescriptionGlassesColors(): Promise<AvailableColor[]> {
  return unstable_cache(
    async () => {
      try {
        // Fetch all variants (including those with 0 stock for display)
        const variants = await prisma.prescriptionGlassesVariant.findMany({
          select: {
            colorName: true,
            colorHex: true,
            stock: true,
          },
        });

        // Group by both colorName AND colorHex to show distinct colors
        const colorMap = new Map<string, { colorName: string; colorHex: string; count: number; hasStock: boolean }>();

        variants.forEach((variant) => {
          const normalizedHex = variant.colorHex.toLowerCase().trim();
          const normalizedName = variant.colorName.trim();
          const key = `${normalizedName}|${normalizedHex}`;
          
          if (colorMap.has(key)) {
            const existing = colorMap.get(key)!;
            existing.count += 1;
            if (variant.stock > 0) {
              existing.hasStock = true;
            }
          } else {
            colorMap.set(key, {
              colorName: normalizedName,
              colorHex: normalizedHex.startsWith('#') ? normalizedHex : `#${normalizedHex}`,
              count: 1,
              hasStock: variant.stock > 0,
            });
          }
        });

        // Convert to array, sort by count
        const availableColors: AvailableColor[] = Array.from(colorMap.values())
          .map((data) => ({
            colorName: data.colorName,
            colorHex: data.colorHex,
            count: data.count,
          }))
          .sort((a, b) => {
            if (b.count !== a.count) {
              return b.count - a.count;
            }
            return a.colorName.localeCompare(b.colorName);
          });

        return availableColors;
      } catch (error) {
        console.error("Error fetching available frame colors for prescription glasses:", error);
        return [];
      }
    },
    ['prescription-glasses-colors'],
    {
      revalidate: 3600,
      tags: ['products', 'colors']
    }
  )();
}
