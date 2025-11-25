'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createInstagramImage(formData: FormData) {
  try {
    // @ts-ignore - instagramImage may not exist until Prisma client is regenerated
    if (!prisma.instagramImage || typeof prisma.instagramImage.create !== 'function') {
      return { error: 'InstagramImage model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const imageUrl = formData.get('imageUrl') as string;
    const alt = formData.get('alt') as string;
    const link = formData.get('link') as string;
    const isActive = formData.get('isActive') === 'true';
    const order = parseInt(formData.get('order') as string) || 0;

    if (!imageUrl || !alt) {
      return { error: 'Missing required fields' };
    }

    // @ts-ignore
    const instagramImage = await prisma.instagramImage.create({
      data: {
        imageUrl,
        alt,
        link: link || 'https://www.instagram.com/p/DQwrNF9ikKg/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        isActive,
        order,
      },
    });

    revalidatePath('/');
    revalidatePath('/admin/instagram');

    return { success: true, instagramImageId: instagramImage.id };
  } catch (error) {
    console.error('Error creating instagram image:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create instagram image' };
  }
}

export async function updateInstagramImage(formData: FormData) {
  try {
    // @ts-ignore - instagramImage may not exist until Prisma client is regenerated
    if (!prisma.instagramImage || typeof prisma.instagramImage.update !== 'function') {
      return { error: 'InstagramImage model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const id = formData.get('id') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const alt = formData.get('alt') as string;
    const link = formData.get('link') as string;
    const isActive = formData.get('isActive') === 'true';
    const order = parseInt(formData.get('order') as string) || 0;

    if (!id || !imageUrl || !alt) {
      return { error: 'Missing required fields' };
    }

    // @ts-ignore
    const instagramImage = await prisma.instagramImage.update({
      where: { id },
      data: {
        imageUrl,
        alt,
        link: link || 'https://www.instagram.com/p/DQwrNF9ikKg/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
        isActive,
        order,
      },
    });

    revalidatePath('/');
    revalidatePath('/admin/instagram');

    return { success: true, instagramImageId: instagramImage.id };
  } catch (error) {
    console.error('Error updating instagram image:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update instagram image' };
  }
}

export async function deleteInstagramImage(formData: FormData) {
  try {
    // @ts-ignore - instagramImage may not exist until Prisma client is regenerated
    if (!prisma.instagramImage || typeof prisma.instagramImage.delete !== 'function') {
      return { error: 'InstagramImage model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const id = formData.get('id') as string;

    if (!id) {
      return { error: 'Missing instagram image ID' };
    }

    // @ts-ignore
    await prisma.instagramImage.delete({
      where: { id },
    });

    revalidatePath('/');
    revalidatePath('/admin/instagram');

    return { success: true };
  } catch (error) {
    console.error('Error deleting instagram image:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete instagram image' };
  }
}

