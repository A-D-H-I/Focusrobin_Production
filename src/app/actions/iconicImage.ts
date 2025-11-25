'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createIconicImage(formData: FormData) {
  try {
    // @ts-ignore - iconicImage may not exist until Prisma client is regenerated
    if (!prisma.iconicImage || typeof prisma.iconicImage.create !== 'function') {
      return { error: 'IconicImage model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const imageUrl = formData.get('imageUrl') as string;
    const alt = formData.get('alt') as string;
    const isActive = formData.get('isActive') === 'true';

    if (!imageUrl || !alt) {
      return { error: 'Missing required fields' };
    }

    // @ts-ignore
    const iconicImage = await prisma.iconicImage.create({
      data: {
        imageUrl,
        alt,
        isActive,
      },
    });

    revalidatePath('/');
    revalidatePath('/admin/iconic');

    return { success: true, iconicImageId: iconicImage.id };
  } catch (error) {
    console.error('Error creating iconic image:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create iconic image' };
  }
}

export async function updateIconicImage(formData: FormData) {
  try {
    // @ts-ignore - iconicImage may not exist until Prisma client is regenerated
    if (!prisma.iconicImage || typeof prisma.iconicImage.update !== 'function') {
      return { error: 'IconicImage model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const id = formData.get('id') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const alt = formData.get('alt') as string;
    const isActive = formData.get('isActive') === 'true';

    if (!id || !imageUrl || !alt) {
      return { error: 'Missing required fields' };
    }

    // @ts-ignore
    const iconicImage = await prisma.iconicImage.update({
      where: { id },
      data: {
        imageUrl,
        alt,
        isActive,
      },
    });

    revalidatePath('/');
    revalidatePath('/admin/iconic');

    return { success: true, iconicImageId: iconicImage.id };
  } catch (error) {
    console.error('Error updating iconic image:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update iconic image' };
  }
}

export async function deleteIconicImage(formData: FormData) {
  try {
    // @ts-ignore - iconicImage may not exist until Prisma client is regenerated
    if (!prisma.iconicImage || typeof prisma.iconicImage.delete !== 'function') {
      return { error: 'IconicImage model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const id = formData.get('id') as string;

    if (!id) {
      return { error: 'Missing iconic image ID' };
    }

    // @ts-ignore
    await prisma.iconicImage.delete({
      where: { id },
    });

    revalidatePath('/');
    revalidatePath('/admin/iconic');

    return { success: true };
  } catch (error) {
    console.error('Error deleting iconic image:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete iconic image' };
  }
}

export async function setActiveIconicImage(formData: FormData) {
  try {
    // @ts-ignore - iconicImage may not exist until Prisma client is regenerated
    if (!prisma.iconicImage || typeof prisma.iconicImage.updateMany !== 'function') {
      return { error: 'IconicImage model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const id = formData.get('id') as string;

    if (!id) {
      return { error: 'Missing iconic image ID' };
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
      where: { id },
      data: { isActive: true },
    });

    revalidatePath('/');
    revalidatePath('/admin/iconic');

    return { success: true };
  } catch (error) {
    console.error('Error setting active iconic image:', error);
    return { error: error instanceof Error ? error.message : 'Failed to set active iconic image' };
  }
}

