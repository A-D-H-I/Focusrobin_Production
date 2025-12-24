'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";

// Validation schemas
const categoryImageSchema = z.object({
  category: z.string().trim().min(1).max(50),
  imageUrl: z.string().url().max(2048),
  mobileTabletImageUrl: z.string().url().max(2048).optional().nullable(),
  alt: z.string().trim().min(1).max(200),
  link: z.string().trim().min(1).max(500),
  isActive: z.boolean().optional().default(false),
});

const idSchema = z.string().min(1).max(30);

/**
 * Create a category image (Admin only)
 */
export async function createCategoryImage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.categoryImage || typeof prisma.categoryImage.create !== 'function') {
      return { error: 'CategoryImage model not available. Please regenerate Prisma client.' };
    }

    const category = formData.get('category') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const mobileTabletImageUrlRaw = formData.get('mobileTabletImageUrl') as string;
    // Validate URL - if invalid or empty, set to null
    let mobileTabletImageUrl: string | null = null;
    if (mobileTabletImageUrlRaw && mobileTabletImageUrlRaw.trim()) {
      try {
        new URL(mobileTabletImageUrlRaw.trim());
        mobileTabletImageUrl = mobileTabletImageUrlRaw.trim();
      } catch {
        // Invalid URL, treat as null
        mobileTabletImageUrl = null;
      }
    }
    const alt = formData.get('alt') as string;
    const link = formData.get('link') as string;
    const isActive = formData.get('isActive') === 'true';

    // Validate input
    const validatedInput = categoryImageSchema.safeParse({ 
      category, 
      imageUrl, 
      mobileTabletImageUrl,
      alt, 
      link, 
      isActive 
    });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // Check if category image already exists
    // @ts-ignore
    const existing = await prisma.categoryImage.findUnique({
      where: { category: validatedInput.data.category },
    });

    if (existing) {
      return { error: 'Category image already exists. Please update the existing one.' };
    }

    // @ts-ignore
    const categoryImage = await prisma.categoryImage.create({
      data: validatedInput.data,
    });

    revalidatePath('/');
    revalidatePath('/admin/category-images');

    return { success: true, categoryImageId: categoryImage.id };
  });
}

/**
 * Update a category image (Admin only)
 */
export async function updateCategoryImage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.categoryImage || typeof prisma.categoryImage.update !== 'function') {
      return { error: 'CategoryImage model not available. Please regenerate Prisma client.' };
    }

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid category image ID" };
    }

    const category = formData.get('category') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const mobileTabletImageUrlRaw = formData.get('mobileTabletImageUrl') as string;
    // Validate URL - if invalid or empty, set to null
    let mobileTabletImageUrl: string | null = null;
    if (mobileTabletImageUrlRaw && mobileTabletImageUrlRaw.trim()) {
      try {
        new URL(mobileTabletImageUrlRaw.trim());
        mobileTabletImageUrl = mobileTabletImageUrlRaw.trim();
      } catch {
        // Invalid URL, treat as null
        mobileTabletImageUrl = null;
      }
    }
    const alt = formData.get('alt') as string;
    const link = formData.get('link') as string;
    const isActive = formData.get('isActive') === 'true';

    // Validate input
    const validatedInput = categoryImageSchema.safeParse({ 
      category, 
      imageUrl, 
      mobileTabletImageUrl,
      alt, 
      link, 
      isActive 
    });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // @ts-ignore
    const categoryImage = await prisma.categoryImage.update({
      where: { id: validatedId.data },
      data: validatedInput.data,
    });

    revalidatePath('/');
    revalidatePath('/admin/category-images');

    return { success: true, categoryImageId: categoryImage.id };
  });
}

/**
 * Delete a category image (Admin only)
 */
export async function deleteCategoryImage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.categoryImage || typeof prisma.categoryImage.delete !== 'function') {
      return { error: 'CategoryImage model not available. Please regenerate Prisma client.' };
    }

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid category image ID" };
    }

    // @ts-ignore
    await prisma.categoryImage.delete({
      where: { id: validatedId.data },
    });

    revalidatePath('/');
    revalidatePath('/admin/category-images');

    return { success: true };
  });
}
