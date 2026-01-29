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
 * Prioritizes images uploaded to the GlassShape table
 */
export async function getProductsByGlassShape(): Promise<ShapeProduct[]> {
  try {
    // 1. Fetch active GlassShapes first to get their official images
    const glassShapes = await prisma.glassShape.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    // 2. Fetch products for these shapes to get valid links (slugs)
    // We only need one product per shape to generate the link
    const shapeMap = new Map<string, ShapeProduct>();

    // Create a lookup map for existing shapes
    const glassShapeLookup = new Map(glassShapes.map(s => [s.name.toLowerCase(), s]));

    // Fetch products with glassShape
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
        createdAt: true,
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
      orderBy: {
        createdAt: 'asc', // Order by creation date, oldest first
      },
    });

    products.forEach((product) => {
      if (!product.glassShape) return;

      const shapeName = product.glassShape;
      const normalizeShape = shapeName.toLowerCase();

      // If we haven't processed this shape yet
      if (!shapeMap.has(shapeName)) {
        // Check if we have an official GlassShape record
        const officialShape = glassShapeLookup.get(normalizeShape) ||
          glassShapes.find(s => s.name === shapeName);

        // Determine image URL:
        // 1. Use GlassShape image if available
        // 2. Fallback to first product image
        let imageUrl = "";

        if (officialShape) {
          if (officialShape.landingImageUrl) {
            imageUrl = officialShape.landingImageUrl;
          } else if (officialShape.imageUrl) {
            imageUrl = officialShape.imageUrl;
          }
        }

        // Fallback to product image if no shape image found
        if (!imageUrl) {
          imageUrl = product.ProductVariant[0]?.ProductAsset[0]?.url || "";
        }

        // Only add if we have a valid shape name (even if no image, we might want to show it)
        shapeMap.set(shapeName, {
          shape: shapeName, // Use the product's shape name for consistency
          productId: product.id,
          productSlug: product.slug,
          imageUrl: imageUrl,
        });
      }
    });

    // Convert to array
    // If we have official shapes, try to sort by their order
    let shapeProducts = Array.from(shapeMap.values());

    // Sort by:
    // 1. Official GlassShape order (if exists)
    // 2. Alphabetical
    shapeProducts.sort((a, b) => {
      const shapeA = glassShapeLookup.get(a.shape.toLowerCase());
      const shapeB = glassShapeLookup.get(b.shape.toLowerCase());

      const orderA = shapeA?.order ?? 999;
      const orderB = shapeB?.order ?? 999;

      if (orderA !== orderB) return orderA - orderB;
      return a.shape.localeCompare(b.shape);
    });

    return shapeProducts;
  } catch (error) {
    console.error("Error fetching products by glass shape:", error);
    return [];
  }
}

