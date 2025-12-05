'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";

// Validation schemas
const heroImageSchema = z.object({
  desktopImageUrl: z.string().url().max(2048),
  mobileImageUrl: z.string().url().max(2048),
  title: z.string().trim().min(1).max(200),
  subtitle: z.string().trim().min(1).max(500),
  ctaText: z.string().trim().min(1).max(100),
  ctaLink: z.string().trim().min(1).max(500),
  isActive: z.boolean().optional().default(false),
});

const idSchema = z.string().min(1).max(30);

/**
 * Create a hero image (Admin only)
 */
export async function createHeroImage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore - heroImage may not exist until Prisma client is regenerated
    if (!prisma.heroImage || typeof prisma.heroImage.create !== 'function') {
      return { error: 'HeroImage model not available. Please regenerate Prisma client.' };
    }

    const desktopImageUrl = formData.get('desktopImageUrl') as string;
    const mobileImageUrl = formData.get('mobileImageUrl') as string;
    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;
    const ctaText = formData.get('ctaText') as string;
    const ctaLink = formData.get('ctaLink') as string;
    const isActive = formData.get('isActive') === 'true';

    // Validate input
    const validatedInput = heroImageSchema.safeParse({
      desktopImageUrl, mobileImageUrl, title, subtitle, ctaText, ctaLink, isActive
    });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // If this hero image is set to active, deactivate all others
    if (validatedInput.data.isActive) {
      // @ts-ignore
      await prisma.heroImage.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    // @ts-ignore
    const heroImage = await prisma.heroImage.create({
      data: validatedInput.data,
    });

    revalidatePath('/');
    revalidatePath('/admin/hero');

    return { success: true, heroImageId: heroImage.id };
  });
}

/**
 * Update a hero image (Admin only)
 */
export async function updateHeroImage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.heroImage || typeof prisma.heroImage.update !== 'function') {
      return { error: 'HeroImage model not available. Please regenerate Prisma client.' };
    }

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid hero image ID" };
    }

    const desktopImageUrl = formData.get('desktopImageUrl') as string;
    const mobileImageUrl = formData.get('mobileImageUrl') as string;
    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;
    const ctaText = formData.get('ctaText') as string;
    const ctaLink = formData.get('ctaLink') as string;
    const isActive = formData.get('isActive') === 'true';

    // Validate input
    const validatedInput = heroImageSchema.safeParse({
      desktopImageUrl, mobileImageUrl, title, subtitle, ctaText, ctaLink, isActive
    });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // If this hero image is set to active, deactivate all others
    if (validatedInput.data.isActive) {
      // @ts-ignore
      await prisma.heroImage.updateMany({
        where: { 
          isActive: true,
          id: { not: validatedId.data },
        },
        data: { isActive: false },
      });
    }

    // @ts-ignore
    const heroImage = await prisma.heroImage.update({
      where: { id: validatedId.data },
      data: validatedInput.data,
    });

    revalidatePath('/');
    revalidatePath('/admin/hero');

    return { success: true, heroImageId: heroImage.id };
  });
}

/**
 * Delete a hero image (Admin only)
 */
export async function deleteHeroImage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.heroImage || typeof prisma.heroImage.delete !== 'function') {
      return { error: 'HeroImage model not available. Please regenerate Prisma client.' };
    }

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid hero image ID" };
    }

    // @ts-ignore
    await prisma.heroImage.delete({
      where: { id: validatedId.data },
    });

    revalidatePath('/');
    revalidatePath('/admin/hero');

    return { success: true };
  });
}

/**
 * Set active hero image (Admin only)
 */
export async function setActiveHeroImage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // @ts-ignore
    if (!prisma.heroImage || typeof prisma.heroImage.updateMany !== 'function') {
      return { error: 'HeroImage model not available. Please regenerate Prisma client.' };
    }

    const id = formData.get('id') as string;
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid hero image ID" };
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
      where: { id: validatedId.data },
      data: { isActive: true },
    });

    revalidatePath('/');
    revalidatePath('/admin/hero');

    return { success: true };
  });
}
