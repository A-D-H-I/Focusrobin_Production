'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function createGiftForLovedOnesBanner(formData: FormData) {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    return { error: "Only admins can create banners" };
  }

  try {
    const imageUrl = formData.get('imageUrl') as string;
    const isActive = formData.get('isActive') === 'true';

    if (!imageUrl) {
      return { error: "Image URL is required" };
    }

    // @ts-ignore
    const banner = await prisma.giftForLovedOnesBanner.create({
      data: {
        imageUrl,
        isActive,
      },
    });

    revalidatePath('/');
    revalidatePath('/admin/gift-for-loved-ones-banner');
    return { success: true, banner };
  } catch (error) {
    console.error('Error creating gift for loved ones banner:', error);
    return { error: "Failed to create banner" };
  }
}

export async function updateGiftForLovedOnesBanner(formData: FormData) {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    return { error: "Only admins can update banners" };
  }

  try {
    const id = formData.get('id') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const isActive = formData.get('isActive') === 'true';

    if (!id) {
      return { error: "Banner ID is required" };
    }

    if (!imageUrl) {
      return { error: "Image URL is required" };
    }

    // @ts-ignore
    const banner = await prisma.giftForLovedOnesBanner.update({
      where: { id },
      data: {
        imageUrl,
        isActive,
      },
    });

    revalidatePath('/');
    revalidatePath('/admin/gift-for-loved-ones-banner');
    return { success: true, banner };
  } catch (error) {
    console.error('Error updating gift for loved ones banner:', error);
    return { error: "Failed to update banner" };
  }
}

export async function deleteGiftForLovedOnesBanner(formData: FormData) {
  const session = await auth();
  
  if (!session?.user) {
    return { error: "You must be logged in" };
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    return { error: "Only admins can delete banners" };
  }

  try {
    const id = formData.get('id') as string;

    if (!id) {
      return { error: "Banner ID is required" };
    }

    // @ts-ignore
    await prisma.giftForLovedOnesBanner.delete({
      where: { id },
    });

    revalidatePath('/');
    revalidatePath('/admin/gift-for-loved-ones-banner');
    return { success: true };
  } catch (error) {
    console.error('Error deleting gift for loved ones banner:', error);
    return { error: "Failed to delete banner" };
  }
}

