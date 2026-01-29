"use server";

import { prisma } from "@/lib/prisma";
import { Gender } from "@prisma/client";
import { mapPrismaProductToProduct } from "@/lib/prisma-product-mapper";
import type { Product } from "@/lib/productData";

/**
 * Get related products based on gender tags
 * Returns products that share at least one gender tag with the current product
 * Excludes the current product and limits to 8 products
 */
export async function getRelatedProducts(
  currentProductId: string,
  currentProductGenders: Gender[]
): Promise<Product[]> {
  try {
    if (!currentProductGenders || currentProductGenders.length === 0) {
      return [];
    }

    // Fetch products that share at least one gender with the current product
    const prismaProducts = (await prisma.product.findMany({
      where: {
        id: {
          not: currentProductId, // Exclude current product
        },
        gender: {
          hasSome: currentProductGenders, // Products that have at least one matching gender
        },
      },
      include: {
        ProductVariant: {
          include: {
            ProductAsset: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Show newest products first
      },
      take: 8, // Limit to 8 products
    })) as any;

    // Map Prisma products to frontend Product type
    const products = prismaProducts.map(mapPrismaProductToProduct);

    return products;
  } catch (error) {
    console.error("Error fetching related products:", error);
    return [];
  }
}












