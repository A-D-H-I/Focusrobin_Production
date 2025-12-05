'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";

// Validation schemas
const iconicImageSchema = z.object({
  imageUrl: z.string().url().max(2048),
  alt: z.string().trim().min(1).max(200),
  isActive: z.boolean().optional().default(false),
});

const idSchema = z.string().min(1).max(30);

/**
 * Create an iconic image (Admin only)
 */
export async function createIconicImage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.iconicImage || typeof prisma.iconicImage.create !== 'function') {
      return { error: 'IconicImage model not available. Please regenerate Prisma client.' };
    }

    const imageUrl = formData.get('imageUrl') as string;
    const alt = formData.get('alt') as string;
    const isActive = formData.get('isActive') === 'true';

    // Validate input
    const validatedInput = iconicImageSchema.safeParse({ imageUrl, alt, isActive });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // @ts-ignore
    const iconicImage = await prisma.iconicImage.create({
      data: validatedInput.data,
    });

    revalidatePath('/');
    revalidatePath('/admin/iconic');

    return { success: true, iconicImageId: iconicImage.id };
  });
}

/**
 * Update an iconic image (Admin only)
 */
export async function updateIconicImage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.iconicImage || typeof prisma.iconicImage.update !== 'function') {
      return { error: 'IconicImage model not available. Please regenerate Prisma client.' };
    }

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid iconic image ID" };
    }

    const imageUrl = formData.get('imageUrl') as string;
    const alt = formData.get('alt') as string;
    const isActive = formData.get('isActive') === 'true';

    // Validate input
    const validatedInput = iconicImageSchema.safeParse({ imageUrl, alt, isActive });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // @ts-ignore
    const iconicImage = await prisma.iconicImage.update({
      where: { id: validatedId.data },
      data: validatedInput.data,
    });

    revalidatePath('/');
    revalidatePath('/admin/iconic');

    return { success: true, iconicImageId: iconicImage.id };
  });
}

/**
 * Delete an iconic image (Admin only)
 */
export async function deleteIconicImage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.iconicImage || typeof prisma.iconicImage.delete !== 'function') {
      return { error: 'IconicImage model not available. Please regenerate Prisma client.' };
    }

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid iconic image ID" };
    }

    // @ts-ignore
    await prisma.iconicImage.delete({
      where: { id: validatedId.data },
    });

    revalidatePath('/');
    revalidatePath('/admin/iconic');

    return { success: true };
  });
}

/**
 * Set active iconic image (Admin only)
 */
export async function setActiveIconicImage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.iconicImage || typeof prisma.iconicImage.updateMany !== 'function') {
      return { error: 'IconicImage model not available. Please regenerate Prisma client.' };
    }

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid iconic image ID" };
    }

    // Deactivate all iconic images
    // @ts-ignore
    await prisma.iconicImage.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Activate the selected one
    // @ts-ignore
    await prisma.iconicImage.update({
      where: { id: validatedId.data },
      data: { isActive: true },
    });

    revalidatePath('/');
    revalidatePath('/admin/iconic');

    return { success: true };
  });
}
