'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";

// Validation schemas
const shopBannerSchema = z.object({
  category: z.string().trim().min(1).max(50),
  imageUrl: z.string().url().max(2048),
  alt: z.string().trim().min(1).max(200),
  link: z.string().trim().max(500).optional().default(''),
  isActive: z.boolean().optional().default(false),
});

const idSchema = z.string().min(1).max(30);

/**
 * Create a shop banner (Admin only)
 */
export async function createShopBanner(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.shopBanner || typeof prisma.shopBanner.create !== 'function') {
      return { error: 'ShopBanner model not available. Please regenerate Prisma client.' };
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

    // Check if shop banner already exists
    // @ts-ignore
    const existing = await prisma.shopBanner.findUnique({
      where: { category: validatedInput.data.category },
    });

    if (existing) {
      return { error: 'Shop banner already exists for this category. Please update the existing one.' };
    }

    // @ts-ignore
    const shopBanner = await prisma.shopBanner.create({
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
