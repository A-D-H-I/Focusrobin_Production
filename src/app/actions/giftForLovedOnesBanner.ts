'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";

// Validation schemas
const bannerSchema = z.object({
  imageUrl: z.string().url().max(2048),
  isActive: z.boolean().optional().default(false),
});

const idSchema = z.string().min(1).max(30);

/**
 * Create a gift for loved ones banner (Admin only)
 */
export async function createGiftForLovedOnesBanner(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    const imageUrl = formData.get('imageUrl') as string;
    const isActive = formData.get('isActive') === 'true';

    // Validate input
    const validatedInput = bannerSchema.safeParse({ imageUrl, isActive });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // @ts-ignore
    const banner = await prisma.giftForLovedOnesBanner.create({
      data: validatedInput.data,
    });

    revalidatePath('/');
    revalidatePath('/admin/gift-for-loved-ones-banner');
    return { success: true, banner };
  });
}

/**
 * Update a gift for loved ones banner (Admin only)
 */
export async function updateGiftForLovedOnesBanner(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid banner ID" };
    }

    const imageUrl = formData.get('imageUrl') as string;
    const isActive = formData.get('isActive') === 'true';

    // Validate input
    const validatedInput = bannerSchema.safeParse({ imageUrl, isActive });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // @ts-ignore
    const banner = await prisma.giftForLovedOnesBanner.update({
      where: { id: validatedId.data },
      data: validatedInput.data,
    });

    revalidatePath('/');
    revalidatePath('/admin/gift-for-loved-ones-banner');
    return { success: true, banner };
  });
}

/**
 * Delete a gift for loved ones banner (Admin only)
 */
export async function deleteGiftForLovedOnesBanner(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid banner ID" };
    }

    // @ts-ignore
    await prisma.giftForLovedOnesBanner.delete({
      where: { id: validatedId.data },
    });

    revalidatePath('/');
    revalidatePath('/admin/gift-for-loved-ones-banner');
    return { success: true };
  });
}
