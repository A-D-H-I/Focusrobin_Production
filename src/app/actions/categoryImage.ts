'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";
import { deleteFromS3 } from '@/lib/s3';

// Validation schemas
const categoryImageSchema = z.object({
  category: z.string().trim().min(1).max(50),
  imageUrl: z.string().min(1).max(2048),
  mobileTabletImageUrl: z.string().min(1).max(2048).optional().nullable(),
  alt: z.string().trim().min(1).max(200),
  link: z.string().trim().min(1).max(500),
  isActive: z.boolean().optional().default(false),
});

const idSchema = z.string().min(1).max(30);

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
 * Create a new category image (Admin only)
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
    let mobileTabletImageUrl: string | null = null;
    if (mobileTabletImageUrlRaw && mobileTabletImageUrlRaw.trim()) {
      try {
        new URL(mobileTabletImageUrlRaw.trim());
        mobileTabletImageUrl = mobileTabletImageUrlRaw.trim();
      } catch {
        mobileTabletImageUrl = null;
      }
    }
    const alt = formData.get('alt') as string;
    const link = formData.get('link') as string;
    const isActive = formData.get('isActive') === 'true';

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

    // Get existing image to handle deletion
    // @ts-ignore
    const currentImage = await prisma.categoryImage.findUnique({
      where: { id: validatedId.data },
    });

    if (currentImage) {
      // Delete old desktop image if changed
      if (currentImage.imageUrl && currentImage.imageUrl !== imageUrl) {
        const key = getKeyFromUrl(currentImage.imageUrl);
        if (key) await deleteFromS3(key);
      }
      // Delete old mobile image if changed
      if (currentImage.mobileTabletImageUrl && currentImage.mobileTabletImageUrl !== mobileTabletImageUrl) {
        const key = getKeyFromUrl(currentImage.mobileTabletImageUrl);
        if (key) await deleteFromS3(key);
      }
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

    // Get existing image to handle deletion
    // @ts-ignore
    const currentImage = await prisma.categoryImage.findUnique({
      where: { id: validatedId.data },
    });

    if (currentImage) {
      // Delete images from S3
      if (currentImage.imageUrl) {
        const key = getKeyFromUrl(currentImage.imageUrl);
        if (key) await deleteFromS3(key);
      }
      if (currentImage.mobileTabletImageUrl) {
        const key = getKeyFromUrl(currentImage.mobileTabletImageUrl);
        if (key) await deleteFromS3(key);
      }
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
