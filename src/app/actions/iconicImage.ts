'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";
import { deleteFromS3 } from '@/lib/s3';

// Validation schemas
const iconicImageSchema = z.object({
  imageUrl: z.string().min(1).max(2048),
  mobileTabletImageUrl: z.string().min(1).max(2048).optional().nullable(),
  alt: z.string().trim().min(1).max(200),
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

// ... (createIconicImage stays same) ...

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
    const mobileTabletImageUrlRaw = formData.get('mobileTabletImageUrl') as string;
    // ... (rest of formData extraction) ...
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
    const isActive = formData.get('isActive') === 'true';

    // Validate input
    const validatedInput = iconicImageSchema.safeParse({
      imageUrl,
      mobileTabletImageUrl,
      alt,
      isActive
    });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // Get existing image to handle deletion
    // @ts-ignore
    const currentImage = await prisma.iconicImage.findUnique({
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

    // Get existing image to handle deletion
    // @ts-ignore
    const currentImage = await prisma.iconicImage.findUnique({
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
