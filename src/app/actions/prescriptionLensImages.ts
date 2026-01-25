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
 * Get prescription lens image for a specific lens configuration (Global - no productId)
 * 
 * NEW LOGIC: Show the most specific/relevant image based on what was just selected
 * Priority order (first match wins):
 * 1. Coating image (if coating is provided) - coating images are universal
 * 2. Lens Type specific images (Clear, Photochromic, Polarized, Tinted)
 * 3. Lens Index image (if lensIndex is provided) - index images are universal
 */
export async function getPrescriptionLensImage(
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
    // Priority 1: Coating image (universal - works with any lens type)
    if (coating) {
      const coatingImage = await prisma.prescriptionLensImage.findFirst({
        where: {
          coating: coating,
          lensType: null,
          lensIndex: null,
          isOutdoor: isOutdoor || false,
        },
      });
      if (coatingImage) {
        console.log(`[Lens Image] Found coating image: ${coating}`);
        return { image: coatingImage };
      }
    }

    // Priority 2: Lens Type specific images
    if (lensType) {
      // TINTED - try to match tint details
      if (lensType === "TINTED" && tintType && tintColor) {
        const tintedImage = await prisma.prescriptionLensImage.findFirst({
          where: {
            lensType: "TINTED",
            tintType: tintType,
            tintColor: tintColor,
            tintShadePercent: tintShadePercent,
            tintRecipe: tintRecipe,
            isOutdoor: isOutdoor || false,
          },
        });
        if (tintedImage) {
          console.log(`[Lens Image] Found tinted image: ${tintColor} ${tintType}`);
          return { image: tintedImage };
        }
      }

      // PHOTOCHROMIC - try to match color
      if (lensType === "PHOTOCHROMIC_SOLIS") {
        const photochromicImage = await prisma.prescriptionLensImage.findFirst({
          where: {
            lensType: "PHOTOCHROMIC_SOLIS",
            photochromicColor: photochromicColor || null,
            isOutdoor: isOutdoor || false,
          },
        });
        if (photochromicImage) {
          console.log(`[Lens Image] Found photochromic image: ${photochromicColor}`);
          return { image: photochromicImage };
        }
      }

      // POLARIZED - try to match color
      if (lensType === "POLARIZED_NUPOLAR") {
        const polarizedImage = await prisma.prescriptionLensImage.findFirst({
          where: {
            lensType: "POLARIZED_NUPOLAR",
            polarizedColor: polarizedColor || null,
            isOutdoor: isOutdoor || false,
          },
        });
        if (polarizedImage) {
          console.log(`[Lens Image] Found polarized image: ${polarizedColor}`);
          return { image: polarizedImage };
        }
      }

      // CLEAR lens type
      if (lensType === "CLEAR") {
        const clearImage = await prisma.prescriptionLensImage.findFirst({
          where: {
            lensType: "CLEAR",
            isOutdoor: isOutdoor || false,
          },
        });
        if (clearImage) {
          console.log(`[Lens Image] Found clear lens image`);
          return { image: clearImage };
        }
      }
    }

    // Priority 3: Lens Index image (universal - works with any lens type)
    if (lensIndex) {
      const lensIndexImage = await prisma.prescriptionLensImage.findFirst({
        where: {
          lensIndex: lensIndex,
          lensType: null,
          coating: null,
          isOutdoor: isOutdoor || false,
        },
      });
      if (lensIndexImage) {
        console.log(`[Lens Image] Found lens index image: ${lensIndex}`);
        return { image: lensIndexImage };
      }
    }

    // No matching image found
    console.log(`[Lens Image] No image found for: lensType=${lensType}, lensIndex=${lensIndex}, coating=${coating}`);
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

// Global prescription lens image schema (without productId)
// lensType is optional because we can have images for just lensIndex or coating
const globalPrescriptionLensImageSchema = z.object({
  lensType: z.enum(["CLEAR", "TINTED", "PHOTOCHROMIC_SOLIS", "POLARIZED_NUPOLAR"]).optional().nullable(),
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
 * Get all global prescription lens images (Admin only)
 */
export async function getAllPrescriptionLensImages() {
  return safeAction(async () => {
    await requireAdmin();
    
    const images = await prisma.prescriptionLensImage.findMany({
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
 * Create or update a global prescription lens image (Admin only)
 */
export async function upsertGlobalPrescriptionLensImage(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    const id = formData.get('id') as string | null;
    
    // Convert empty strings to null for optional fields
    const getOptionalField = (field: string): string | null => {
      const value = formData.get(field) as string;
      return value && value.trim() ? value.trim() : null;
    };
    
    const lensType = getOptionalField('lensType');
    
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
    const validated = globalPrescriptionLensImageSchema.parse({
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

      revalidatePath('/admin/prescription-lens-images');
      revalidatePath('/shop', 'layout');
      
      return { success: true, image };
    } else {
      // Check for duplicate before creating
      const existing = await prisma.prescriptionLensImage.findFirst({
        where: {
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

        revalidatePath('/admin/prescription-lens-images');
        revalidatePath('/shop', 'layout');
        
        return { success: true, image };
      }

      // Create new image
      const image = await prisma.prescriptionLensImage.create({
        data: validated,
      });

      revalidatePath('/admin/prescription-lens-images');
      revalidatePath('/shop', 'layout');
      
      return { success: true, image };
    }
  });
}

/**
 * Delete a global prescription lens image (Admin only)
 */
export async function deleteGlobalPrescriptionLensImage(imageId: string) {
  return safeAction(async () => {
    await requireAdmin();

    const image = await prisma.prescriptionLensImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return { error: 'Image not found' };
    }

    await prisma.prescriptionLensImage.delete({
      where: { id: imageId },
    });

    revalidatePath('/admin/prescription-lens-images');
    revalidatePath('/shop', 'layout');

    return { success: true };
  });
}

