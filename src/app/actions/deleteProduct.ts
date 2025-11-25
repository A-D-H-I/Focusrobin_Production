'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteProduct(productId: string) {
  try {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, slug: true },
    });

    if (!product) {
      return { error: 'Product not found' };
    }

    // Delete product - related data will be automatically deleted due to cascade:
    // - ProductVariant (cascade)
    // - ProductAsset (cascade from ProductVariant)
    // - Offer (cascade)
    // Note: Reviews are preserved (productId set to null) so users can still see their review history
    await prisma.product.delete({
      where: { id: productId },
    });

    revalidatePath('/admin/products');
    revalidatePath('/shop');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete product' };
  }
}

