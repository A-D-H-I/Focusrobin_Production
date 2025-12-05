'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";

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

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: validatedId.data },
      select: { id: true, slug: true },
    });

    if (!product) {
      return { error: 'Product not found' };
    }

    // Delete product - related data will be automatically deleted due to cascade
    await prisma.product.delete({
      where: { id: validatedId.data },
    });

    revalidatePath('/admin/products');
    revalidatePath('/shop');
    revalidatePath('/');

    return { success: true };
  });
}
