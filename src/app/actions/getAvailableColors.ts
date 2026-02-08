"use server";

import { prisma } from "@/lib/prisma";

export interface AvailableColor {
  colorName: string;
  colorHex: string;
  count: number;
}

/**
 * Get all available frame colors from products
 * Returns unique colors with their hex codes and product counts
 * Shows all colors regardless of stock (for display purposes)
 * @param type 'sunglasses' | 'eyeglasses' - Product type to fetch colors for
 */
export async function getAvailableFrameColors(type: 'sunglasses' | 'eyeglasses' = 'sunglasses'): Promise<AvailableColor[]> {
  try {
    let variants;

    if (type === 'eyeglasses') {
      // Fetch prescription glasses variants
      variants = await prisma.prescriptionGlassesVariant.findMany({
        select: {
          colorName: true,
          colorHex: true,
          stock: true,
        },
      });
    } else {
      // Fetch sunglasses variants (default)
      variants = await prisma.productVariant.findMany({
        select: {
          colorName: true,
          colorHex: true,
          stock: true,
        },
      });
    }

    // Group by both colorName AND colorHex to show distinct colors
    // Use a composite key: "colorName|colorHex" to ensure uniqueness
    const colorMap = new Map<string, { colorName: string; colorHex: string; count: number; hasStock: boolean }>();

    variants.forEach((variant) => {
      const normalizedHex = variant.colorHex.toLowerCase().trim();
      const normalizedName = variant.colorName.trim();
      const key = `${normalizedName}|${normalizedHex}`;

      if (colorMap.has(key)) {
        const existing = colorMap.get(key)!;
        existing.count += 1;
        // If any variant has stock, mark as having stock
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

    // Convert to array, prioritize colors with stock, then sort by count
    const availableColors: AvailableColor[] = Array.from(colorMap.values())
      .map((data) => ({
        colorName: data.colorName,
        colorHex: data.colorHex,
        count: data.count,
      }))
      .sort((a, b) => {
        // First sort by count (most common first)
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        // Then alphabetically by name
        return a.colorName.localeCompare(b.colorName);
      });

    return availableColors;
  } catch (error) {
    console.error("Error fetching available frame colors:", error);
    return [];
  }
}

