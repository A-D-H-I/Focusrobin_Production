'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";
import { deleteFromS3 } from '@/lib/s3';

// Validation schemas
// For order 0: title, subtitle, ctaText are required
// For order > 0: title, subtitle, ctaText are optional (not used, but stored for consistency)
const heroImageSchema = z.object({
  desktopImageUrl: z.string().min(1).max(2048),
  mobileImageUrl: z.string().min(1).max(2048),
  title: z.string().trim().max(200),
  subtitle: z.string().trim().max(500),
  ctaText: z.string().trim().max(100),
  ctaLink: z.string().trim().min(1).max(500),
  isActive: z.boolean().optional().default(true),
  order: z.number().int().min(0).optional().default(0),
}).refine((data) => {
  // If order is 0, title, subtitle, and ctaText are required
  if (data.order === 0) {
    return data.title.length > 0 && data.subtitle.length > 0 && data.ctaText.length > 0;
  }
  // If order is not 0, these fields are optional (use defaults)
  return true;
}, {
  message: "Title, subtitle, and CTA button text are required for the first image (order 0)",
  path: ["title"],
});

const idSchema = z.string().min(1).max(30);

/**
 * Extract S3 object key from URL
 */
function getKeyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    // Handle full URL: https://bucket.s3.region.amazonaws.com/folder/key
    const urlObj = new URL(url);
    // Pathname starts with /, remove it to get the key
    return urlObj.pathname.substring(1);
  } catch (e) {
    // If it's already a key or invalid URL, return as is (safer to try deleting)
    return url;
  }
}

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
    const title = formData.get('title') as string || '';
    const subtitle = formData.get('subtitle') as string || '';
    const ctaText = formData.get('ctaText') as string || 'Shop Now';
    const ctaLink = formData.get('ctaLink') as string;
    const isActive = formData.get('isActive') === 'true';
    const order = parseInt(formData.get('order') as string) || 0;

    // For non-zero orders, use placeholder values if empty (they won't be used anyway)
    const finalTitle = order === 0 ? title : (title || 'Not Used');
    const finalSubtitle = order === 0 ? subtitle : (subtitle || 'Not Used');
    const finalCtaText = order === 0 ? ctaText : (ctaText || 'Shop Now');

    // Validate input
    const validatedInput = heroImageSchema.safeParse({
      desktopImageUrl, mobileImageUrl, title: finalTitle, subtitle: finalSubtitle, ctaText: finalCtaText, ctaLink, isActive, order
    });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
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
    const title = formData.get('title') as string || '';
    const subtitle = formData.get('subtitle') as string || '';
    const ctaText = formData.get('ctaText') as string || 'Shop Now';
    const ctaLink = formData.get('ctaLink') as string;
    const isActive = formData.get('isActive') === 'true';
    const order = parseInt(formData.get('order') as string) || 0;

    // For non-zero orders, use placeholder values if empty (they won't be used anyway)
    const finalTitle = order === 0 ? title : (title || 'Not Used');
    const finalSubtitle = order === 0 ? subtitle : (subtitle || 'Not Used');
    const finalCtaText = order === 0 ? ctaText : (ctaText || 'Shop Now');

    // Validate input
    const validatedInput = heroImageSchema.safeParse({
      desktopImageUrl, mobileImageUrl, title: finalTitle, subtitle: finalSubtitle, ctaText: finalCtaText, ctaLink, isActive, order
    });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // Get existing image to handle deletion
    // @ts-ignore
    const currentHero = await prisma.heroImage.findUnique({
      where: { id: validatedId.data },
    });

    if (currentHero) {
      // Delete old desktop image if changed
      if (currentHero.desktopImageUrl && currentHero.desktopImageUrl !== desktopImageUrl) {
        const key = getKeyFromUrl(currentHero.desktopImageUrl);
        if (key) await deleteFromS3(key);
      }
      // Delete old mobile image if changed
      if (currentHero.mobileImageUrl && currentHero.mobileImageUrl !== mobileImageUrl) {
        const key = getKeyFromUrl(currentHero.mobileImageUrl);
        if (key) await deleteFromS3(key);
      }
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

    // Get existing image to handle deletion
    // @ts-ignore
    const currentHero = await prisma.heroImage.findUnique({
      where: { id: validatedId.data },
    });

    if (currentHero) {
      // Delete images from S3
      if (currentHero.desktopImageUrl) {
        const key = getKeyFromUrl(currentHero.desktopImageUrl);
        if (key) await deleteFromS3(key);
      }
      if (currentHero.mobileImageUrl) {
        const key = getKeyFromUrl(currentHero.mobileImageUrl);
        if (key) await deleteFromS3(key);
      }
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
