"use server";

import { prisma } from "@/lib/prisma";

export interface ShapeProduct {
  shape: string;
  productId: string;
  productSlug: string;
  imageUrl: string;
}

/**
 * Get products grouped by glass shape with their primary images
 * Returns one product per shape to use as the representative image
 */
export async function getProductsByGlassShape(): Promise<ShapeProduct[]> {
  try {
    // Fetch products with glassShape and their variants/assets
    const products = await prisma.product.findMany({
      where: {
        glassShape: {
          not: null,
        },
      },
      select: {
        id: true,
        slug: true,
        glassShape: true,
        ProductVariant: {
          select: {
            ProductAsset: {
              where: {
                isPrimary: true,
              },
              select: {
                url: true,
              },
              take: 1,
            },
          },
          take: 1, // Just get the first variant
        },
      },
    });

    // Group by glassShape and get one product per shape
    const shapeMap = new Map<string, ShapeProduct>();

    products.forEach((product) => {
      if (product.glassShape && !shapeMap.has(product.glassShape)) {
        // Get the first available image from the first variant
        const imageUrl =
          product.ProductVariant[0]?.ProductAsset[0]?.url || "";

        shapeMap.set(product.glassShape, {
          shape: product.glassShape,
          productId: product.id,
          productSlug: product.slug,
          imageUrl: imageUrl,
        });
      }
    });

    // Convert to array and sort alphabetically
    const shapeProducts: ShapeProduct[] = Array.from(shapeMap.values()).sort(
      (a, b) => a.shape.localeCompare(b.shape)
    );

    return shapeProducts;
  } catch (error) {
    console.error("Error fetching products by glass shape:", error);
    return [];
  }
}

