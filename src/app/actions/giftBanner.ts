'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";
import { deleteFromS3 } from '@/lib/s3';

// Validation schemas
const giftBannerSchema = z.object({
  imageUrl: z.string().min(1).max(2048),
  mobileTabletImageUrl: z.string().min(1).max(2048).optional().nullable(),
  title: z.string().trim().max(200).optional().default('Gift for your loved ones'),
  subtitle: z.string().trim().max(500).optional().default(''),
  link: z.string().trim().max(500).optional().default('/shop/unisex'),
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

// ... (createGiftBanner stays same) ...

/**
 * Update a gift banner (Admin only)
 */
export async function updateGiftBanner(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.giftBanner || typeof prisma.giftBanner.update !== 'function') {
      return { error: 'GiftBanner model not available. Please regenerate Prisma client.' };
    }

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid gift banner ID" };
    }

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
    const title = formData.get('title') as string || 'Gift for your loved ones';
    const subtitle = formData.get('subtitle') as string || '';
    const link = formData.get('link') as string || '/shop/unisex';
    const isActive = formData.get('isActive') === 'true';

    // Validate input
    const validatedInput = giftBannerSchema.safeParse({
      imageUrl,
      mobileTabletImageUrl,
      title,
      subtitle,
      link,
      isActive
    });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // Get existing image to handle deletion
    // @ts-ignore
    const currentBanner = await prisma.giftBanner.findUnique({
      where: { id: validatedId.data },
    });

    if (currentBanner) {
      // Delete old desktop image if changed
      if (currentBanner.imageUrl && currentBanner.imageUrl !== imageUrl) {
        const key = getKeyFromUrl(currentBanner.imageUrl);
        if (key) await deleteFromS3(key);
      }
      // Delete old mobile image if changed
      if (currentBanner.mobileTabletImageUrl && currentBanner.mobileTabletImageUrl !== mobileTabletImageUrl) {
        const key = getKeyFromUrl(currentBanner.mobileTabletImageUrl);
        if (key) await deleteFromS3(key);
      }
    }

    // @ts-ignore
    const giftBanner = await prisma.giftBanner.update({
      where: { id: validatedId.data },
      data: {
        imageUrl: validatedInput.data.imageUrl,
        mobileTabletImageUrl: validatedInput.data.mobileTabletImageUrl || null,
        title: validatedInput.data.title,
        subtitle: validatedInput.data.subtitle || null,
        link: validatedInput.data.link,
        isActive: validatedInput.data.isActive,
      },
    });

    revalidatePath('/');
    revalidatePath('/admin/gift-banner');

    return { success: true, giftBannerId: giftBanner.id };
  });
}

/**
 * Delete a gift banner (Admin only)
 */
export async function deleteGiftBanner(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.giftBanner || typeof prisma.giftBanner.delete !== 'function') {
      return { error: 'GiftBanner model not available. Please regenerate Prisma client.' };
    }

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid gift banner ID" };
    }

    // Get existing image to handle deletion
    // @ts-ignore
    const currentBanner = await prisma.giftBanner.findUnique({
      where: { id: validatedId.data },
    });

    if (currentBanner) {
      // Delete images from S3
      if (currentBanner.imageUrl) {
        const key = getKeyFromUrl(currentBanner.imageUrl);
        if (key) await deleteFromS3(key);
      }
      if (currentBanner.mobileTabletImageUrl) {
        const key = getKeyFromUrl(currentBanner.mobileTabletImageUrl);
        if (key) await deleteFromS3(key);
      }
    }

    // @ts-ignore
    await prisma.giftBanner.delete({
      where: { id: validatedId.data },
    });

    revalidatePath('/');
    revalidatePath('/admin/gift-banner');

    return { success: true };
  });
}
