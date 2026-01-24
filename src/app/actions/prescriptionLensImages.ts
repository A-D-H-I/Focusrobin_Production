'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";

// Validation schema for prescription lens image
const prescriptionLensImageSchema = z.object({
  productId: z.string().min(1),
  productSlug: z.string().min(1),
  lensType: z.enum(["CLEAR", "TINTED", "PHOTOCHROMIC_SOLIS", "POLARIZED_NUPOLAR"]),
  lensIndex: z.string().optional().nullable(),
  coating: z.string().optional().nullable(),
  tintType: z.string().optional().nullable(),
  tintColor: z.string().optional().nullable(),
  tintShadePercent: z.number().int().optional().nullable(),
  tintRecipe: z.string().optional().nullable(),
  photochromicColor: z.string().optional().nullable(),
  polarizedColor: z.string().optional().nullable(),
  frameType: z.string().optional().nullable(),
  imageUrl: z.string().url().min(1),
  isOutdoor: z.boolean().optional().default(false),
});

/**
 * Get prescription lens image for a specific product and lens configuration
 * Finds the best matching image based on the provided configuration
 * Null fields in the database mean "any value is acceptable"
 */
export async function getPrescriptionLensImage(
  productId: string,
  lensType: string,
  lensIndex?: string | null,
  coating?: string | null,
  tintType?: string | null,
  tintColor?: string | null,
  tintShadePercent?: number | null,
  tintRecipe?: string | null,
  photochromicColor?: string | null,
  polarizedColor?: string | null,
  frameType?: string | null,
  isOutdoor?: boolean
) {
  return safeAction(async () => {
    // Get all images for this product and lens type
    const allImages = await prisma.prescriptionLensImage.findMany({
      where: {
        productId,
        lensType,
        isOutdoor: isOutdoor || false,
      },
    });

    if (allImages.length === 0) {
      return { image: null };
    }

    // Score each image based on how well it matches
    const scoredImages = allImages.map(img => {
      let score = 0;
      let maxScore = 0;

      // Lens index matching
      maxScore += 1;
      if (img.lensIndex === null || img.lensIndex === lensIndex) {
        score += 1;
      }

      // Coating matching
      maxScore += 1;
      if (img.coating === null || img.coating === coating) {
        score += 1;
      }

      // Frame type matching
      maxScore += 1;
      if (img.frameType === null || img.frameType === frameType) {
        score += 1;
      }

      // Lens-type specific matching
      if (lensType === "TINTED") {
        maxScore += 4;
        if (img.tintType === null || img.tintType === tintType) score += 1;
        if (img.tintColor === null || img.tintColor === tintColor) score += 1;
        if (img.tintShadePercent === null || img.tintShadePercent === tintShadePercent) score += 1;
        if (img.tintRecipe === null || img.tintRecipe === tintRecipe) score += 1;
      } else if (lensType === "PHOTOCHROMIC_SOLIS") {
        maxScore += 1;
        if (img.photochromicColor === null || img.photochromicColor === photochromicColor) score += 1;
      } else if (lensType === "POLARIZED_NUPOLAR") {
        maxScore += 1;
        if (img.polarizedColor === null || img.polarizedColor === polarizedColor) score += 1;
      }

      return { image: img, score, maxScore, ratio: score / maxScore };
    });

    // Sort by match ratio (best match first), then by specificity (more non-null fields)
    scoredImages.sort((a, b) => {
      if (Math.abs(a.ratio - b.ratio) > 0.001) {
        return b.ratio - a.ratio;
      }
      // If ratios are close, prefer more specific images (fewer nulls)
      const aNulls = [
        a.image.lensIndex,
        a.image.coating,
        a.image.tintType,
        a.image.tintColor,
        a.image.tintShadePercent,
        a.image.tintRecipe,
        a.image.photochromicColor,
        a.image.polarizedColor,
        a.image.frameType,
      ].filter(v => v === null).length;
      const bNulls = [
        b.image.lensIndex,
        b.image.coating,
        b.image.tintType,
        b.image.tintColor,
        b.image.tintShadePercent,
        b.image.tintRecipe,
        b.image.photochromicColor,
        b.image.polarizedColor,
        b.image.frameType,
      ].filter(v => v === null).length;
      return aNulls - bNulls;
    });

    // Return the best match (if score is acceptable, otherwise null)
    const bestMatch = scoredImages[0];
    if (bestMatch && bestMatch.ratio > 0) {
      return { image: bestMatch.image };
    }

    return { image: null };
  });
}

/**
 * Get all prescription lens images for a product
 */
export async function getPrescriptionLensImagesForProduct(productId: string) {
  return safeAction(async () => {
    const images = await prisma.prescriptionLensImage.findMany({
      where: { productId },
      orderBy: [
        { lensType: 'asc' },
        { lensIndex: 'asc' },
        { coating: 'asc' },
      ],
    });

    return { images };
  });
}

/**
 * Create or update a prescription lens image (Admin only)
 */
export async function upsertPrescriptionLensImage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    const id = formData.get('id') as string | null;
    const productId = formData.get('productId') as string;
    const productSlug = formData.get('productSlug') as string;
    const lensType = formData.get('lensType') as string;
    
    // Convert empty strings to null for optional fields
    const getOptionalField = (field: string): string | null => {
      const value = formData.get(field) as string;
      return value && value.trim() ? value.trim() : null;
    };
    
    const lensIndex = getOptionalField('lensIndex');
    const coating = getOptionalField('coating');
    const tintType = getOptionalField('tintType');
    const tintColor = getOptionalField('tintColor');
    const tintShadePercentRaw = formData.get('tintShadePercent') as string;
    const tintShadePercent = tintShadePercentRaw && tintShadePercentRaw.trim() ? parseInt(tintShadePercentRaw) : null;
    const tintRecipe = getOptionalField('tintRecipe');
    const photochromicColor = getOptionalField('photochromicColor');
    const polarizedColor = getOptionalField('polarizedColor');
    const frameType = getOptionalField('frameType');
    const imageUrl = formData.get('imageUrl') as string;
    const isOutdoor = formData.get('isOutdoor') === 'true';

    // Validate the data
    const validated = prescriptionLensImageSchema.parse({
      productId,
      productSlug,
      lensType,
      lensIndex,
      coating,
      tintType,
      tintColor,
      tintShadePercent,
      tintRecipe,
      photochromicColor,
      polarizedColor,
      frameType,
      imageUrl,
      isOutdoor,
    });

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, slug: true },
    });

    if (!product) {
      return { error: 'Product not found' };
    }

    // Use the actual product slug
    validated.productSlug = product.slug;

    if (id) {
      // Update existing image
      const existing = await prisma.prescriptionLensImage.findUnique({
        where: { id },
      });

      if (!existing) {
        return { error: 'Image not found' };
      }

      const image = await prisma.prescriptionLensImage.update({
        where: { id },
        data: validated,
      });

      revalidatePath(`/shop/${validated.productSlug}/prescription`);
      revalidatePath(`/admin/products/${product.slug}/edit`);
      
      return { success: true, image };
    } else {
      // Check for duplicate before creating
      const existing = await prisma.prescriptionLensImage.findFirst({
        where: {
          productId: validated.productId,
          lensType: validated.lensType,
          lensIndex: validated.lensIndex,
          coating: validated.coating,
          tintType: validated.tintType,
          tintColor: validated.tintColor,
          tintShadePercent: validated.tintShadePercent,
          tintRecipe: validated.tintRecipe,
          photochromicColor: validated.photochromicColor,
          polarizedColor: validated.polarizedColor,
          frameType: validated.frameType,
          isOutdoor: validated.isOutdoor,
        },
      });

      if (existing) {
        // Update existing instead of creating duplicate
        const image = await prisma.prescriptionLensImage.update({
          where: { id: existing.id },
          data: { imageUrl: validated.imageUrl },
        });

        revalidatePath(`/shop/${validated.productSlug}/prescription`);
        revalidatePath(`/admin/products/${product.slug}/edit`);
        
        return { success: true, image };
      }

      // Create new image
      const image = await prisma.prescriptionLensImage.create({
        data: validated,
      });

      revalidatePath(`/shop/${validated.productSlug}/prescription`);
      revalidatePath(`/admin/products/${product.slug}/edit`);
      
      return { success: true, image };
    }
  });
}

/**
 * Delete a prescription lens image (Admin only)
 */
export async function deletePrescriptionLensImage(imageId: string) {
  return safeAction(async () => {
    await requireAdmin();

    const image = await prisma.prescriptionLensImage.findUnique({
      where: { id: imageId },
      include: { Product: { select: { slug: true } } },
    });

    if (!image) {
      return { error: 'Image not found' };
    }

    await prisma.prescriptionLensImage.delete({
      where: { id: imageId },
    });

    revalidatePath(`/shop/${image.Product.slug}/prescription`);
    revalidatePath(`/admin/products/${image.Product.slug}/edit`);

    return { success: true };
  });
}

