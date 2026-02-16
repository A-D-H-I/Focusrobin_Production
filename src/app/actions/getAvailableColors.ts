"use server";

import { prisma } from "@/lib/prisma";

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
  try {
    // 1. Fetch all ColorFamily records for hex lookup
    const colorFamilies = await prisma.colorFamily.findMany();
    const familyHexMap = new Map<string, string>();
    colorFamilies.forEach(cf => {
      familyHexMap.set(cf.name.toLowerCase(), cf.hex);
    });

    // 2. Fetch variants that HAVE a colorFamily set
    let variants: { colorFamily: string | null; textureImageUrl: string | null; stock: number }[];

    if (type === 'eyeglasses') {
      variants = await prisma.prescriptionGlassesVariant.findMany({
        where: { colorFamily: { not: null } },
        select: {
          colorFamily: true,
          textureImageUrl: true,
          stock: true,
        },
      });
    } else {
      variants = await prisma.productVariant.findMany({
        where: { colorFamily: { not: null } },
        select: {
          colorFamily: true,
          textureImageUrl: true,
          stock: true,
        },
      });
    }

    // 3. Group by colorFamily
    const colorMap = new Map<string, {
      colorName: string;
      colorHex: string;
      textureImageUrl: string | null;
      count: number;
    }>();

    for (const variant of variants) {
      const family = (variant.colorFamily ?? '').trim();
      if (!family) continue;

      const key = family.toLowerCase();
      const hex = familyHexMap.get(key) || '#E5E7EB'; // fallback grey if family not in DB yet

      if (colorMap.has(key)) {
        const existing = colorMap.get(key)!;
        existing.count += 1;
        if (!existing.textureImageUrl && variant.textureImageUrl) {
          existing.textureImageUrl = variant.textureImageUrl;
        }
      } else {
        colorMap.set(key, {
          colorName: family,
          colorHex: hex,
          textureImageUrl: variant.textureImageUrl || null,
          count: 1,
        });
      }
    }

    // 4. Convert and sort
    const availableColors: AvailableColor[] = Array.from(colorMap.values())
      .map(data => ({
        colorName: data.colorName,
        colorHex: data.colorHex,
        textureImageUrl: data.textureImageUrl || undefined,
        count: data.count,
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.colorName.localeCompare(b.colorName);
      });

    return availableColors;
  } catch (error) {
    console.error("Error fetching available frame colors:", error);
    return [];
  }
}
