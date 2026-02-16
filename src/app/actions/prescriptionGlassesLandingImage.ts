'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";

// Validation schemas
const prescriptionGlassesLandingImageSchema = z.object({
  imageUrl: z.string().min(1).max(2048),
  mobileTabletImageUrl: z.string().min(1).max(2048).optional().nullable(),
  alt: z.string().trim().min(1).max(200),
  isActive: z.boolean().optional().default(false),
});

const idSchema = z.string().min(1).max(30);

/**
 * Create a prescription glasses landing image (Admin only)
 */
export async function createPrescriptionGlassesLandingImage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.prescriptionGlassesLandingImage || typeof prisma.prescriptionGlassesLandingImage.create !== 'function') {
      return { error: 'PrescriptionGlassesLandingImage model not available. Please regenerate Prisma client.' };
    }

    const imageUrl = formData.get('imageUrl') as string;
    const mobileTabletImageUrlRaw = formData.get('mobileTabletImageUrl') as string;
    // Validate URL - if invalid or empty, set to null
    let mobileTabletImageUrl: string | null = null;
    if (mobileTabletImageUrlRaw && mobileTabletImageUrlRaw.trim()) {
      try {
        new URL(mobileTabletImageUrlRaw.trim());
        mobileTabletImageUrl = mobileTabletImageUrlRaw.trim();
      } catch {
        // Invalid URL, treat as null
        mobileTabletImageUrl = null;
      }
    }
    const alt = formData.get('alt') as string;
    const isActive = formData.get('isActive') === 'true';

    // Validate input
    const validatedInput = prescriptionGlassesLandingImageSchema.safeParse({
      imageUrl,
      mobileTabletImageUrl,
      alt,
      isActive
    });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // @ts-ignore
    const image = await prisma.prescriptionGlassesLandingImage.create({
      data: validatedInput.data,
    });

    revalidatePath('/shop/prescription-glasses');
    revalidatePath('/admin/prescription-glasses-landing');

    return { success: true, imageId: image.id };
  });
}

/**
 * Update a prescription glasses landing image (Admin only)
 */
export async function updatePrescriptionGlassesLandingImage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.prescriptionGlassesLandingImage || typeof prisma.prescriptionGlassesLandingImage.update !== 'function') {
      return { error: 'PrescriptionGlassesLandingImage model not available. Please regenerate Prisma client.' };
    }

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid image ID" };
    }

    const imageUrl = formData.get('imageUrl') as string;
    const mobileTabletImageUrlRaw = formData.get('mobileTabletImageUrl') as string;
    // Validate URL - if invalid or empty, set to null
    let mobileTabletImageUrl: string | null = null;
    if (mobileTabletImageUrlRaw && mobileTabletImageUrlRaw.trim()) {
      try {
        new URL(mobileTabletImageUrlRaw.trim());
        mobileTabletImageUrl = mobileTabletImageUrlRaw.trim();
      } catch {
        // Invalid URL, treat as null
        mobileTabletImageUrl = null;
      }
    }
    const alt = formData.get('alt') as string;
    const isActive = formData.get('isActive') === 'true';

    // Validate input
    const validatedInput = prescriptionGlassesLandingImageSchema.safeParse({
      imageUrl,
      mobileTabletImageUrl,
      alt,
      isActive
    });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // @ts-ignore
    const image = await prisma.prescriptionGlassesLandingImage.update({
      where: { id: validatedId.data },
      data: validatedInput.data,
    });

    revalidatePath('/shop/prescription-glasses');
    revalidatePath('/admin/prescription-glasses-landing');

    return { success: true, imageId: image.id };
  });
}

/**
 * Delete a prescription glasses landing image (Admin only)
 */
export async function deletePrescriptionGlassesLandingImage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.prescriptionGlassesLandingImage || typeof prisma.prescriptionGlassesLandingImage.delete !== 'function') {
      return { error: 'PrescriptionGlassesLandingImage model not available. Please regenerate Prisma client.' };
    }

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid image ID" };
    }

    // @ts-ignore
    await prisma.prescriptionGlassesLandingImage.delete({
      where: { id: validatedId.data },
    });

    revalidatePath('/shop/prescription-glasses');
    revalidatePath('/admin/prescription-glasses-landing');

    return { success: true };
  });
}

/**
 * Set active prescription glasses landing image (Admin only)
 */
export async function setActivePrescriptionGlassesLandingImage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.prescriptionGlassesLandingImage || typeof prisma.prescriptionGlassesLandingImage.updateMany !== 'function') {
      return { error: 'PrescriptionGlassesLandingImage model not available. Please regenerate Prisma client.' };
    }

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid image ID" };
    }

    // Deactivate all images
    // @ts-ignore
    await prisma.prescriptionGlassesLandingImage.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Activate the selected one
    // @ts-ignore
    await prisma.prescriptionGlassesLandingImage.update({
      where: { id: validatedId.data },
      data: { isActive: true },
    });

    revalidatePath('/shop/prescription-glasses');
    revalidatePath('/admin/prescription-glasses-landing');

    return { success: true };
  });
}

