'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";

// Validation schemas
const instagramImageSchema = z.object({
  imageUrl: z.string().url().max(2048),
  alt: z.string().trim().min(1).max(200),
  link: z.string().url().max(500).optional().default('https://www.instagram.com/'),
  isActive: z.boolean().optional().default(false),
  order: z.number().int().min(0).max(100).optional().default(0),
});

const idSchema = z.string().min(1).max(30);

/**
 * Create an instagram image (Admin only)
 */
export async function createInstagramImage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.instagramImage || typeof prisma.instagramImage.create !== 'function') {
      return { error: 'InstagramImage model not available. Please regenerate Prisma client.' };
    }

    const imageUrl = formData.get('imageUrl') as string;
    const alt = formData.get('alt') as string;
    const link = formData.get('link') as string || 'https://www.instagram.com/';
    const isActive = formData.get('isActive') === 'true';
    const order = parseInt(formData.get('order') as string) || 0;

    // Validate input
    const validatedInput = instagramImageSchema.safeParse({ imageUrl, alt, link, isActive, order });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // @ts-ignore
    const instagramImage = await prisma.instagramImage.create({
      data: validatedInput.data,
    });

    revalidatePath('/');
    revalidatePath('/admin/instagram');

    return { success: true, instagramImageId: instagramImage.id };
  });
}

/**
 * Update an instagram image (Admin only)
 */
export async function updateInstagramImage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.instagramImage || typeof prisma.instagramImage.update !== 'function') {
      return { error: 'InstagramImage model not available. Please regenerate Prisma client.' };
    }

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid instagram image ID" };
    }

    const imageUrl = formData.get('imageUrl') as string;
    const alt = formData.get('alt') as string;
    const link = formData.get('link') as string || 'https://www.instagram.com/';
    const isActive = formData.get('isActive') === 'true';
    const order = parseInt(formData.get('order') as string) || 0;

    // Validate input
    const validatedInput = instagramImageSchema.safeParse({ imageUrl, alt, link, isActive, order });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // @ts-ignore
    const instagramImage = await prisma.instagramImage.update({
      where: { id: validatedId.data },
      data: validatedInput.data,
    });

    revalidatePath('/');
    revalidatePath('/admin/instagram');

    return { success: true, instagramImageId: instagramImage.id };
  });
}

/**
 * Delete an instagram image (Admin only)
 */
export async function deleteInstagramImage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.instagramImage || typeof prisma.instagramImage.delete !== 'function') {
      return { error: 'InstagramImage model not available. Please regenerate Prisma client.' };
    }

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid instagram image ID" };
    }

    // @ts-ignore
    await prisma.instagramImage.delete({
      where: { id: validatedId.data },
    });

    revalidatePath('/');
    revalidatePath('/admin/instagram');

    return { success: true };
  });
}
