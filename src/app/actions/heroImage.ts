'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createHeroImage(formData: FormData) {
  try {
    // @ts-ignore - heroImage may not exist until Prisma client is regenerated
    if (!prisma.heroImage || typeof prisma.heroImage.create !== 'function') {
      return { error: 'HeroImage model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const desktopImageUrl = formData.get('desktopImageUrl') as string;
    const mobileImageUrl = formData.get('mobileImageUrl') as string;
    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;
    const ctaText = formData.get('ctaText') as string;
    const ctaLink = formData.get('ctaLink') as string;
    const isActive = formData.get('isActive') === 'true';

    // Validate required fields
    if (!desktopImageUrl || !mobileImageUrl || !title || !subtitle || !ctaText || !ctaLink) {
      return { error: 'Missing required fields' };
    }

    // If this hero image is set to active, deactivate all others
    if (isActive) {
      // @ts-ignore
      await prisma.heroImage.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    // @ts-ignore
    const heroImage = await prisma.heroImage.create({
      data: {
        desktopImageUrl,
        mobileImageUrl,
        title,
        subtitle,
        ctaText,
        ctaLink,
        isActive,
      },
    });

    revalidatePath('/');
    revalidatePath('/admin/hero');

    return { success: true, heroImageId: heroImage.id };
  } catch (error) {
    console.error('Error creating hero image:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create hero image' };
  }
}

export async function updateHeroImage(formData: FormData) {
  try {
    // @ts-ignore - heroImage may not exist until Prisma client is regenerated
    if (!prisma.heroImage || typeof prisma.heroImage.update !== 'function') {
      return { error: 'HeroImage model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const id = formData.get('id') as string;
    const desktopImageUrl = formData.get('desktopImageUrl') as string;
    const mobileImageUrl = formData.get('mobileImageUrl') as string;
    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;
    const ctaText = formData.get('ctaText') as string;
    const ctaLink = formData.get('ctaLink') as string;
    const isActive = formData.get('isActive') === 'true';

    // Validate required fields
    if (!id || !desktopImageUrl || !mobileImageUrl || !title || !subtitle || !ctaText || !ctaLink) {
      return { error: 'Missing required fields' };
    }

    // If this hero image is set to active, deactivate all others
    if (isActive) {
      // @ts-ignore
      await prisma.heroImage.updateMany({
        where: { 
          isActive: true,
          id: { not: id },
        },
        data: { isActive: false },
      });
    }

    // @ts-ignore
    const heroImage = await prisma.heroImage.update({
      where: { id },
      data: {
        desktopImageUrl,
        mobileImageUrl,
        title,
        subtitle,
        ctaText,
        ctaLink,
        isActive,
      },
    });

    revalidatePath('/');
    revalidatePath('/admin/hero');

    return { success: true, heroImageId: heroImage.id };
  } catch (error) {
    console.error('Error updating hero image:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update hero image' };
  }
}

export async function deleteHeroImage(formData: FormData) {
  try {
    // @ts-ignore - heroImage may not exist until Prisma client is regenerated
    if (!prisma.heroImage || typeof prisma.heroImage.delete !== 'function') {
      return { error: 'HeroImage model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const id = formData.get('id') as string;

    if (!id) {
      return { error: 'Missing hero image ID' };
    }

    // @ts-ignore
    await prisma.heroImage.delete({
      where: { id },
    });

    revalidatePath('/');
    revalidatePath('/admin/hero');

    return { success: true };
  } catch (error) {
    console.error('Error deleting hero image:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete hero image' };
  }
}

export async function setActiveHeroImage(formData: FormData) {
  try {
    // @ts-ignore - heroImage may not exist until Prisma client is regenerated
    if (!prisma.heroImage || typeof prisma.heroImage.updateMany !== 'function') {
      return { error: 'HeroImage model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const id = formData.get('id') as string;

    if (!id) {
      return { error: 'Missing hero image ID' };
    }

    // Deactivate all hero images
    // @ts-ignore
    await prisma.heroImage.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Activate the selected one
    // @ts-ignore
    await prisma.heroImage.update({
      where: { id },
      data: { isActive: true },
    });

    revalidatePath('/');
    revalidatePath('/admin/hero');

    return { success: true };
  } catch (error) {
    console.error('Error setting active hero image:', error);
    return { error: error instanceof Error ? error.message : 'Failed to set active hero image' };
  }
}

