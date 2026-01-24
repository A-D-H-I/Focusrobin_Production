'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface GlassShapeData {
  id?: string;
  name: string;
  imageUrl?: string;
  order?: number;
  isActive?: boolean;
}

export async function createGlassShape(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const imageUrl = formData.get('imageUrl') as string | null;
    const orderStr = formData.get('order') as string | null;
    const isActiveStr = formData.get('isActive') as string | null;

    if (!name || name.trim() === '') {
      return { error: 'Shape name is required' };
    }

    // Check if shape with this name already exists
    const existing = await prisma.glassShape.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return { error: 'A shape with this name already exists' };
    }

    const order = orderStr ? parseInt(orderStr, 10) : 0;
    const isActive = isActiveStr === 'true' || isActiveStr === null;

    const glassShape = await prisma.glassShape.create({
      data: {
        name: name.trim(),
        imageUrl: imageUrl || null,
        order: order,
        isActive: isActive,
      },
    });

    revalidatePath('/admin/shapes');
    revalidatePath('/shop');
    revalidatePath('/');

    return { success: true, data: glassShape };
  } catch (error: any) {
    console.error('Error creating glass shape:', error);
    return { error: error.message || 'Failed to create glass shape' };
  }
}

export async function updateGlassShape(formData: FormData) {
  try {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const imageUrl = formData.get('imageUrl') as string | null;
    const orderStr = formData.get('order') as string | null;
    const isActiveStr = formData.get('isActive') as string | null;

    if (!id) {
      return { error: 'Shape ID is required' };
    }

    if (!name || name.trim() === '') {
      return { error: 'Shape name is required' };
    }

    // Check if another shape with this name exists
    const existing = await prisma.glassShape.findUnique({
      where: { name: name.trim() },
    });

    if (existing && existing.id !== id) {
      return { error: 'A shape with this name already exists' };
    }

    const order = orderStr ? parseInt(orderStr, 10) : 0;
    const isActive = isActiveStr === 'true';

    const glassShape = await prisma.glassShape.update({
      where: { id },
      data: {
        name: name.trim(),
        imageUrl: imageUrl || null,
        order: order,
        isActive: isActive,
      },
    });

    revalidatePath('/admin/shapes');
    revalidatePath('/shop');
    revalidatePath('/');

    return { success: true, data: glassShape };
  } catch (error: any) {
    console.error('Error updating glass shape:', error);
    return { error: error.message || 'Failed to update glass shape' };
  }
}

export async function deleteGlassShape(formData: FormData) {
  try {
    const id = formData.get('id') as string;

    if (!id) {
      return { error: 'Shape ID is required' };
    }

    await prisma.glassShape.delete({
      where: { id },
    });

    revalidatePath('/admin/shapes');
    revalidatePath('/shop');
    revalidatePath('/');

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting glass shape:', error);
    return { error: error.message || 'Failed to delete glass shape' };
  }
}

export async function getAllGlassShapes() {
  try {
    const shapes = await prisma.glassShape.findMany({
      orderBy: [
        { order: 'asc' },
        { name: 'asc' },
      ],
    });

    return { success: true, data: shapes };
  } catch (error: any) {
    console.error('Error fetching glass shapes:', error);
    return { error: error.message || 'Failed to fetch glass shapes' };
  }
}

/**
 * Sync glass shapes from existing products to GlassShape table
 * This ensures all shapes used in products are available in the admin panel
 */
export async function syncGlassShapesFromProducts() {
  try {
    // Get all glass shapes from products
    const products = await prisma.product.findMany({
      where: {
        glassShape: {
          not: null,
        },
      },
      select: {
        glassShape: true,
      },
    });

    // Get all glass shapes from prescription glasses
    const prescriptionGlasses = await prisma.prescriptionGlasses.findMany({
      where: {
        glassShape: {
          not: null,
        },
      },
      select: {
        glassShape: true,
      },
    });

    // Combine and get unique shapes
    const allShapes = new Set<string>();
    products.forEach((p) => {
      if (p.glassShape) {
        const trimmed = p.glassShape.trim();
        if (trimmed) {
          allShapes.add(trimmed);
        }
      }
    });
    prescriptionGlasses.forEach((pg) => {
      if (pg.glassShape) {
        const trimmed = pg.glassShape.trim();
        if (trimmed) {
          allShapes.add(trimmed);
        }
      }
    });

    // Get existing shapes from GlassShape table
    const existingShapes = await prisma.glassShape.findMany({
      select: {
        name: true,
      },
    });
    const existingShapeNames = new Set(existingShapes.map((s) => s.name));

    // Create missing shapes
    const shapesToCreate = Array.from(allShapes).filter(
      (shape) => !existingShapeNames.has(shape) && shape.length > 0
    );

    if (shapesToCreate.length > 0) {
      await prisma.glassShape.createMany({
        data: shapesToCreate.map((shape) => ({
          name: shape,
          imageUrl: null,
          order: 0,
          isActive: true,
        })),
        skipDuplicates: true,
      });
    }

    revalidatePath('/admin/shapes');
    revalidatePath('/shop');
    revalidatePath('/');

    return {
      success: true,
      created: shapesToCreate.length,
      shapes: shapesToCreate,
    };
  } catch (error: any) {
    console.error('Error syncing glass shapes:', error);
    return { error: error.message || 'Failed to sync glass shapes' };
  }
}

