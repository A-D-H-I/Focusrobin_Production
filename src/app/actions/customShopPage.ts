'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createCustomShopPage(formData: FormData) {
  try {
    // @ts-ignore - customShopPage may not exist until Prisma client is regenerated
    if (!prisma.customShopPage || typeof prisma.customShopPage.create !== 'function') {
      return { error: 'CustomShopPage model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const bannerImage = formData.get('bannerImage') as string;
    const videoUrl = formData.get('videoUrl') as string || '';
    const description = formData.get('description') as string || '';
    const isVisible = formData.get('isVisible') === 'true';
    const products = formData.get('products') as string; // Comma-separated product IDs

    if (!name || !slug || !bannerImage) {
      return { error: 'Missing required fields: name, slug, and banner image are required' };
    }

    // Check if slug already exists
    // @ts-ignore
    const existing = await prisma.customShopPage.findUnique({
      where: { slug },
    });

    if (existing) {
      return { error: 'A page with this slug already exists. Please use a different slug.' };
    }

    // Parse products array
    const productIds = products ? products.split(',').map(id => id.trim()).filter(id => id) : [];

    // @ts-ignore
    const customShopPage = await prisma.customShopPage.create({
      data: {
        name,
        slug,
        bannerImage,
        videoUrl: videoUrl || null,
        description: description || null,
        isVisible,
        products: productIds,
      },
    });

    revalidatePath('/admin/custom-shop-pages');
    if (isVisible) {
      revalidatePath(`/shop/${slug}`);
    }

    return { success: true, customShopPageId: customShopPage.id };
  } catch (error) {
    console.error('Error creating custom shop page:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create custom shop page' };
  }
}

export async function updateCustomShopPage(formData: FormData) {
  try {
    // @ts-ignore - customShopPage may not exist until Prisma client is regenerated
    if (!prisma.customShopPage || typeof prisma.customShopPage.update !== 'function') {
      return { error: 'CustomShopPage model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const bannerImage = formData.get('bannerImage') as string;
    const videoUrl = formData.get('videoUrl') as string || '';
    const description = formData.get('description') as string || '';
    const isVisible = formData.get('isVisible') === 'true';
    const products = formData.get('products') as string;

    if (!id || !name || !slug || !bannerImage) {
      return { error: 'Missing required fields' };
    }

    // Parse products array
    const productIds = products ? products.split(',').map(id => id.trim()).filter(id => id) : [];

    // @ts-ignore
    const customShopPage = await prisma.customShopPage.update({
      where: { id },
      data: {
        name,
        slug,
        bannerImage,
        videoUrl: videoUrl || null,
        description: description || null,
        isVisible,
        products: productIds,
      },
    });

    revalidatePath('/admin/custom-shop-pages');
    revalidatePath(`/shop/${slug}`);

    return { success: true, customShopPageId: customShopPage.id };
  } catch (error) {
    console.error('Error updating custom shop page:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update custom shop page' };
  }
}

export async function deleteCustomShopPage(formData: FormData) {
  try {
    // @ts-ignore - customShopPage may not exist until Prisma client is regenerated
    if (!prisma.customShopPage || typeof prisma.customShopPage.delete !== 'function') {
      return { error: 'CustomShopPage model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const id = formData.get('id') as string;
    const slug = formData.get('slug') as string;

    if (!id) {
      return { error: 'Missing custom shop page ID' };
    }

    // @ts-ignore
    await prisma.customShopPage.delete({
      where: { id },
    });

    revalidatePath('/admin/custom-shop-pages');
    if (slug) {
      revalidatePath(`/shop/${slug}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting custom shop page:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete custom shop page' };
  }
}

