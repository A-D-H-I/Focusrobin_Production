'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";
import { deleteFromS3 } from '@/lib/s3';

/**
 * Extract S3 object key from URL
 */
function getKeyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    // Handle full URL: https://bucket.s3.region.amazonaws.com/folder/key
    const urlObj = new URL(url);
    // Pathname starts with /, remove it to get the key
    return urlObj.pathname.substring(1);
  } catch (e) {
    // If it's already a key or invalid URL, return as is (safer to try deleting)
    return url;
  }
}

/**
 * Delete a product (Admin only)
 */
export async function deleteProduct(productId: string) {
  return safeAction(async () => {
    // Require admin role
    await requireAdmin();

    // Validate input
    const schema = z.string().min(1).max(30);
    const validatedId = schema.safeParse(productId);
    if (!validatedId.success) {
      return { error: "Invalid product ID" };
    }

    // Check if product exists and fetch all associated images
    // @ts-ignore
    const product = await prisma.product.findUnique({
      where: { id: validatedId.data },
      include: {
        ProductVariant: {
          include: {
            ProductAsset: true
          }
        },
        highlights: true
      }
    });

    if (!product) {
      return { error: 'Product not found' };
    }

    // 1. Delete Product Level Images
    if (product.lensBaseImageUrl) {
      const key = getKeyFromUrl(product.lensBaseImageUrl);
      if (key) await deleteFromS3(key);
    }
    if (product.lensMaskImageUrl) {
      const key = getKeyFromUrl(product.lensMaskImageUrl);
      if (key) await deleteFromS3(key);
    }
    if (product.lensBackgroundImageUrl) {
      const key = getKeyFromUrl(product.lensBackgroundImageUrl);
      if (key) await deleteFromS3(key);
    }

    // 2. Delete Highlight Images
    if (product.highlights && product.highlights.length > 0) {
      for (const highlight of product.highlights) {
        if (highlight.imageUrl) {
          const key = getKeyFromUrl(highlight.imageUrl);
          if (key) await deleteFromS3(key);
        }
      }
    }

    // 3. Delete Variant Asset Images
    if (product.ProductVariant && product.ProductVariant.length > 0) {
      for (const variant of product.ProductVariant) {
        if (variant.ProductAsset && variant.ProductAsset.length > 0) {
          for (const asset of variant.ProductAsset) {
            if (asset.url) {
              const key = getKeyFromUrl(asset.url);
              if (key) await deleteFromS3(key);
            }
          }
        }
      }
    }

    // Delete product - related data will be automatically deleted due to cascade
    // @ts-ignore
    await prisma.product.delete({
      where: { id: validatedId.data },
    });

    revalidatePath('/admin/products');
    revalidatePath('/shop');
    revalidatePath('/');

    return { success: true };
  });
}
