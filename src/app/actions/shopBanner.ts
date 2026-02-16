'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";
import { deleteFromS3 } from '@/lib/s3';

// Validation schemas
const shopBannerSchema = z.object({
  category: z.string().trim().min(1).max(50),
  imageUrl: z.string().min(1).max(2048),
  alt: z.string().trim().min(1).max(200),
  link: z.string().trim().max(500).optional().default(''),
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

// ... (createShopBanner stays same) ...

/**
 * Update a shop banner (Admin only)
 */
export async function updateShopBanner(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.shopBanner || typeof prisma.shopBanner.update !== 'function') {
      return { error: 'ShopBanner model not available. Please regenerate Prisma client.' };
    }

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid shop banner ID" };
    }

    const category = formData.get('category') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const alt = formData.get('alt') as string;
    const link = formData.get('link') as string || '';
    const isActive = formData.get('isActive') === 'true';

    // Validate input
    const validatedInput = shopBannerSchema.safeParse({ category, imageUrl, alt, link, isActive });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // Get existing image to handle deletion
    // @ts-ignore
    const currentBanner = await prisma.shopBanner.findUnique({
      where: { id: validatedId.data },
    });

    if (currentBanner) {
      // Delete old image if changed
      if (currentBanner.imageUrl && currentBanner.imageUrl !== imageUrl) {
        const key = getKeyFromUrl(currentBanner.imageUrl);
        if (key) await deleteFromS3(key);
      }
    }

    // @ts-ignore
    const shopBanner = await prisma.shopBanner.update({
      where: { id: validatedId.data },
      data: {
        category: validatedInput.data.category,
        imageUrl: validatedInput.data.imageUrl,
        alt: validatedInput.data.alt,
        link: validatedInput.data.link || null,
        isActive: validatedInput.data.isActive,
      },
    });

    revalidatePath('/shop/men');
    revalidatePath('/shop/women');
    revalidatePath('/shop/kids');
    revalidatePath('/shop/unisex');
    revalidatePath('/admin/shop-banners');

    return { success: true, shopBannerId: shopBanner.id };
  });
}

/**
 * Delete a shop banner (Admin only)
 */
export async function deleteShopBanner(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.shopBanner || typeof prisma.shopBanner.delete !== 'function') {
      return { error: 'ShopBanner model not available. Please regenerate Prisma client.' };
    }

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid shop banner ID" };
    }

    // Get existing image to handle deletion
    // @ts-ignore
    const currentBanner = await prisma.shopBanner.findUnique({
      where: { id: validatedId.data },
    });

    if (currentBanner) {
      // Delete image from S3
      if (currentBanner.imageUrl) {
        const key = getKeyFromUrl(currentBanner.imageUrl);
        if (key) await deleteFromS3(key);
      }
    }

    // @ts-ignore
    await prisma.shopBanner.delete({
      where: { id: validatedId.data },
    });

    revalidatePath('/shop/men');
    revalidatePath('/shop/women');
    revalidatePath('/shop/kids');
    revalidatePath('/shop/unisex');
    revalidatePath('/admin/shop-banners');

    return { success: true };
  });
}
