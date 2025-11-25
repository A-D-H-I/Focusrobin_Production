'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createCategoryImage(formData: FormData) {
  try {
    // @ts-ignore - categoryImage may not exist until Prisma client is regenerated
    if (!prisma.categoryImage || typeof prisma.categoryImage.create !== 'function') {
      return { error: 'CategoryImage model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const category = formData.get('category') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const alt = formData.get('alt') as string;
    const link = formData.get('link') as string;
    const isActive = formData.get('isActive') === 'true';

    if (!category || !imageUrl || !alt || !link) {
      return { error: 'Missing required fields' };
    }

    // Check if category image already exists
    // @ts-ignore
    const existing = await prisma.categoryImage.findUnique({
      where: { category },
    });

    if (existing) {
      return { error: 'Category image already exists. Please update the existing one.' };
    }

    // @ts-ignore
    const categoryImage = await prisma.categoryImage.create({
      data: {
        category,
        imageUrl,
        alt,
        link,
        isActive,
      },
    });

    revalidatePath('/');
    revalidatePath('/admin/category-images');

    return { success: true, categoryImageId: categoryImage.id };
  } catch (error) {
    console.error('Error creating category image:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create category image' };
  }
}

export async function updateCategoryImage(formData: FormData) {
  try {
    // @ts-ignore - categoryImage may not exist until Prisma client is regenerated
    if (!prisma.categoryImage || typeof prisma.categoryImage.update !== 'function') {
      return { error: 'CategoryImage model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const id = formData.get('id') as string;
    const category = formData.get('category') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const alt = formData.get('alt') as string;
    const link = formData.get('link') as string;
    const isActive = formData.get('isActive') === 'true';

    if (!id || !category || !imageUrl || !alt || !link) {
      return { error: 'Missing required fields' };
    }

    // @ts-ignore
    const categoryImage = await prisma.categoryImage.update({
      where: { id },
      data: {
        category,
        imageUrl,
        alt,
        link,
        isActive,
      },
    });

    revalidatePath('/');
    revalidatePath('/admin/category-images');

    return { success: true, categoryImageId: categoryImage.id };
  } catch (error) {
    console.error('Error updating category image:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update category image' };
  }
}

export async function deleteCategoryImage(formData: FormData) {
  try {
    // @ts-ignore - categoryImage may not exist until Prisma client is regenerated
    if (!prisma.categoryImage || typeof prisma.categoryImage.delete !== 'function') {
      return { error: 'CategoryImage model not available. Please regenerate Prisma client by running: npx prisma generate' };
    }

    const id = formData.get('id') as string;

    if (!id) {
      return { error: 'Missing category image ID' };
    }

    // @ts-ignore
    await prisma.categoryImage.delete({
      where: { id },
    });

    revalidatePath('/');
    revalidatePath('/admin/category-images');

    return { success: true };
  } catch (error) {
    console.error('Error deleting category image:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete category image' };
  }
}

