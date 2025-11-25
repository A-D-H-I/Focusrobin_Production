'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createShopBanner(formData: FormData) {
  try {
    // @ts-ignore - shopBanner may not exist until Prisma client is regenerated
    if (!prisma.shopBanner || typeof prisma.shopBanner.create !== 'function') {
      return { error: 'ShopBanner model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const category = formData.get('category') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const alt = formData.get('alt') as string;
    const link = formData.get('link') as string || '';
    const isActive = formData.get('isActive') === 'true';

    if (!category || !imageUrl || !alt) {
      return { error: 'Missing required fields' };
    }

    // Check if shop banner already exists
    // @ts-ignore
    const existing = await prisma.shopBanner.findUnique({
      where: { category },
    });

    if (existing) {
      return { error: 'Shop banner already exists for this category. Please update the existing one.' };
    }

    // @ts-ignore
    const shopBanner = await prisma.shopBanner.create({
      data: {
        category,
        imageUrl,
        alt,
        link: link || null,
        isActive,
      },
    });

    revalidatePath('/shop/men');
    revalidatePath('/shop/women');
    revalidatePath('/shop/kids');
    revalidatePath('/shop/unisex');
    revalidatePath('/admin/shop-banners');

    return { success: true, shopBannerId: shopBanner.id };
  } catch (error) {
    console.error('Error creating shop banner:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create shop banner' };
  }
}

export async function updateShopBanner(formData: FormData) {
  try {
    // @ts-ignore - shopBanner may not exist until Prisma client is regenerated
    if (!prisma.shopBanner || typeof prisma.shopBanner.update !== 'function') {
      return { error: 'ShopBanner model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const id = formData.get('id') as string;
    const category = formData.get('category') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const alt = formData.get('alt') as string;
    const link = formData.get('link') as string || '';
    const isActive = formData.get('isActive') === 'true';

    if (!id || !category || !imageUrl || !alt) {
      return { error: 'Missing required fields' };
    }

    // @ts-ignore
    const shopBanner = await prisma.shopBanner.update({
      where: { id },
      data: {
        category,
        imageUrl,
        alt,
        link: link || null,
        isActive,
      },
    });

    revalidatePath('/shop/men');
    revalidatePath('/shop/women');
    revalidatePath('/shop/kids');
    revalidatePath('/shop/unisex');
    revalidatePath('/admin/shop-banners');

    return { success: true, shopBannerId: shopBanner.id };
  } catch (error) {
    console.error('Error updating shop banner:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update shop banner' };
  }
}

export async function deleteShopBanner(formData: FormData) {
  try {
    // @ts-ignore - shopBanner may not exist until Prisma client is regenerated
    if (!prisma.shopBanner || typeof prisma.shopBanner.delete !== 'function') {
      return { error: 'ShopBanner model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const id = formData.get('id') as string;

    if (!id) {
      return { error: 'Missing shop banner ID' };
    }

    // @ts-ignore
    await prisma.shopBanner.delete({
      where: { id },
    });

    revalidatePath('/shop/men');
    revalidatePath('/shop/women');
    revalidatePath('/shop/kids');
    revalidatePath('/shop/unisex');
    revalidatePath('/admin/shop-banners');

    return { success: true };
  } catch (error) {
    console.error('Error deleting shop banner:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete shop banner' };
  }
}

