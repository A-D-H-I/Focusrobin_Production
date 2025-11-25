'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createGiftBanner(formData: FormData) {
  try {
    // @ts-ignore - giftBanner may not exist until Prisma client is regenerated
    if (!prisma.giftBanner || typeof prisma.giftBanner.create !== 'function') {
      return { error: 'GiftBanner model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const imageUrl = formData.get('imageUrl') as string;
    const title = formData.get('title') as string || 'Gift for your loved ones';
    const subtitle = formData.get('subtitle') as string || '';
    const link = formData.get('link') as string || '/shop/unisex';
    const isActive = formData.get('isActive') === 'true';

    if (!imageUrl) {
      return { error: 'Image URL is required' };
    }

    // @ts-ignore
    const giftBanner = await prisma.giftBanner.create({
      data: {
        imageUrl,
        title,
        subtitle: subtitle || null,
        link,
        isActive,
      },
    });

    revalidatePath('/');
    revalidatePath('/admin/gift-banner');

    return { success: true, giftBannerId: giftBanner.id };
  } catch (error) {
    console.error('Error creating gift banner:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create gift banner' };
  }
}

export async function updateGiftBanner(formData: FormData) {
  try {
    // @ts-ignore - giftBanner may not exist until Prisma client is regenerated
    if (!prisma.giftBanner || typeof prisma.giftBanner.update !== 'function') {
      return { error: 'GiftBanner model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const id = formData.get('id') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const title = formData.get('title') as string || 'Gift for your loved ones';
    const subtitle = formData.get('subtitle') as string || '';
    const link = formData.get('link') as string || '/shop/unisex';
    const isActive = formData.get('isActive') === 'true';

    if (!id || !imageUrl) {
      return { error: 'Missing required fields' };
    }

    // @ts-ignore
    const giftBanner = await prisma.giftBanner.update({
      where: { id },
      data: {
        imageUrl,
        title,
        subtitle: subtitle || null,
        link,
        isActive,
      },
    });

    revalidatePath('/');
    revalidatePath('/admin/gift-banner');

    return { success: true, giftBannerId: giftBanner.id };
  } catch (error) {
    console.error('Error updating gift banner:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update gift banner' };
  }
}

export async function deleteGiftBanner(formData: FormData) {
  try {
    // @ts-ignore - giftBanner may not exist until Prisma client is regenerated
    if (!prisma.giftBanner || typeof prisma.giftBanner.delete !== 'function') {
      return { error: 'GiftBanner model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const id = formData.get('id') as string;

    if (!id) {
      return { error: 'Missing gift banner ID' };
    }

    // @ts-ignore
    await prisma.giftBanner.delete({
      where: { id },
    });

    revalidatePath('/');
    revalidatePath('/admin/gift-banner');

    return { success: true };
  } catch (error) {
    console.error('Error deleting gift banner:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete gift banner' };
  }
}

