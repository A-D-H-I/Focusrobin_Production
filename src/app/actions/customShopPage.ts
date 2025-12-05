'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";

// Validation schemas
const customShopPageSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  bannerImage: z.string().url().max(2048),
  videoUrl: z.string().url().max(2048).optional().or(z.literal('')),
  description: z.string().trim().max(2000).optional().default(''),
  isVisible: z.boolean().optional().default(false),
  products: z.array(z.string().max(30)).max(100).optional().default([]),
});

const idSchema = z.string().min(1).max(30);

/**
 * Create a custom shop page (Admin only)
 */
export async function createCustomShopPage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.customShopPage || typeof prisma.customShopPage.create !== 'function') {
      return { error: 'CustomShopPage model not available. Please regenerate Prisma client.' };
    }

    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const bannerImage = formData.get('bannerImage') as string;
    const videoUrl = formData.get('videoUrl') as string || '';
    const description = formData.get('description') as string || '';
    const isVisible = formData.get('isVisible') === 'true';
    const products = formData.get('products') as string;

    // Parse products array
    const productIds = products ? products.split(',').map(id => id.trim()).filter(id => id) : [];

    // Validate input
    const validatedInput = customShopPageSchema.safeParse({ 
      name, slug, bannerImage, videoUrl, description, isVisible, products: productIds 
    });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // Check if slug already exists
    // @ts-ignore
    const existing = await prisma.customShopPage.findUnique({
      where: { slug: validatedInput.data.slug },
    });

    if (existing) {
      return { error: 'A page with this slug already exists. Please use a different slug.' };
    }

    // @ts-ignore
    const customShopPage = await prisma.customShopPage.create({
      data: {
        name: validatedInput.data.name,
        slug: validatedInput.data.slug,
        bannerImage: validatedInput.data.bannerImage,
        videoUrl: validatedInput.data.videoUrl || null,
        description: validatedInput.data.description || null,
        isVisible: validatedInput.data.isVisible,
        products: validatedInput.data.products,
      },
    });

    revalidatePath('/admin/custom-shop-pages');
    if (validatedInput.data.isVisible) {
      revalidatePath(`/shop/${validatedInput.data.slug}`);
    }

    return { success: true, customShopPageId: customShopPage.id };
  });
}

/**
 * Update a custom shop page (Admin only)
 */
export async function updateCustomShopPage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.customShopPage || typeof prisma.customShopPage.update !== 'function') {
      return { error: 'CustomShopPage model not available. Please regenerate Prisma client.' };
    }

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid custom shop page ID" };
    }

    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const bannerImage = formData.get('bannerImage') as string;
    const videoUrl = formData.get('videoUrl') as string || '';
    const description = formData.get('description') as string || '';
    const isVisible = formData.get('isVisible') === 'true';
    const products = formData.get('products') as string;

    // Parse products array
    const productIds = products ? products.split(',').map(id => id.trim()).filter(id => id) : [];

    // Validate input
    const validatedInput = customShopPageSchema.safeParse({ 
      name, slug, bannerImage, videoUrl, description, isVisible, products: productIds 
    });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // @ts-ignore
    const customShopPage = await prisma.customShopPage.update({
      where: { id: validatedId.data },
      data: {
        name: validatedInput.data.name,
        slug: validatedInput.data.slug,
        bannerImage: validatedInput.data.bannerImage,
        videoUrl: validatedInput.data.videoUrl || null,
        description: validatedInput.data.description || null,
        isVisible: validatedInput.data.isVisible,
        products: validatedInput.data.products,
      },
    });

    revalidatePath('/admin/custom-shop-pages');
    revalidatePath(`/shop/${validatedInput.data.slug}`);

    return { success: true, customShopPageId: customShopPage.id };
  });
}

/**
 * Delete a custom shop page (Admin only)
 */
export async function deleteCustomShopPage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.customShopPage || typeof prisma.customShopPage.delete !== 'function') {
      return { error: 'CustomShopPage model not available. Please regenerate Prisma client.' };
    }

    const id = formData.get('id') as string;
    const slug = formData.get('slug') as string;
    
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid custom shop page ID" };
    }

    // @ts-ignore
    await prisma.customShopPage.delete({
      where: { id: validatedId.data },
    });

    revalidatePath('/admin/custom-shop-pages');
    if (slug) {
      revalidatePath(`/shop/${slug}`);
    }

    return { success: true };
  });
}
