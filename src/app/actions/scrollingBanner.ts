'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";

// Validation schemas
const bannerSchema = z.object({
  text: z.string().min(1).max(500),
  isActive: z.boolean().optional().default(true),
});

const idSchema = z.string().min(1).max(30);

/**
 * Create a scrolling banner (Admin only)
 */
export async function createScrollingBanner(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    const text = formData.get('text') as string;
    const isActive = formData.get('isActive') === 'true';

    // Validate input
    const validatedInput = bannerSchema.safeParse({ text, isActive });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // @ts-ignore
    const banner = await prisma.scrollingBanner.create({
      data: validatedInput.data,
    });

    revalidatePath('/');
    revalidatePath('/admin/scrolling-banner');
    return { success: true, banner };
  });
}

/**
 * Update a scrolling banner (Admin only)
 */
export async function updateScrollingBanner(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid banner ID" };
    }

    const text = formData.get('text') as string;
    const isActive = formData.get('isActive') === 'true';

    // Validate input
    const validatedInput = bannerSchema.safeParse({ text, isActive });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // @ts-ignore
    const banner = await prisma.scrollingBanner.update({
      where: { id: validatedId.data },
      data: validatedInput.data,
    });

    revalidatePath('/');
    revalidatePath('/admin/scrolling-banner');
    return { success: true, banner };
  });
}

/**
 * Delete a scrolling banner (Admin only)
 */
export async function deleteScrollingBanner(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid banner ID" };
    }

    // @ts-ignore
    await prisma.scrollingBanner.delete({
      where: { id: validatedId.data },
    });

    revalidatePath('/');
    revalidatePath('/admin/scrolling-banner');
    return { success: true };
  });
}

