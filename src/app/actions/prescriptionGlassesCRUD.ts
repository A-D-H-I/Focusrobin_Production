'use server';

import { prisma } from '@/lib/prisma';
import { Gender, AssetType } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { calculateRetailPrice, calculateFinalPrice } from '@/lib/price-utils';
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";
import { deleteFromS3 } from '@/lib/s3';

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

export interface PrescriptionGlassesVariantData {
  id?: string;
  name: string;
  sku: string;
  colorName: string;
  colorHex: string;
  colorFamily?: string;
  lensColor: string;
  stock: number;
  price?: number;
  asset_nobg?: string;
  asset_glb?: string;
  asset_tryon?: string;
  asset_hover?: string;
  asset_gallery?: string;
}

// Validation schemas
const prescriptionGlassesSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(1).max(100),
  brand: z.string().trim().min(1).max(100).optional().default("FocusRobin"),
  description: z.string().trim().max(5000).optional().nullable(),
  basePrice: z.number().positive().max(100000),
  compareAtPrice: z.number().positive().max(100000).optional().nullable(),
  discountPct: z.number().int().min(0).max(99).optional().default(0),
  cashbackAmount: z.number().nonnegative().max(1000).optional().default(0),
  frameMaterial: z.string().trim().max(100).optional(),
  lensMaterial: z.string().trim().max(100).optional(),
  uvProtection: z.string().trim().max(50).optional().nullable(),
  glassShape: z.string().trim().max(100).optional().nullable(),
  frameWidth: z.number().min(0).optional().default(0),
  lensWidth: z.number().min(0).optional().default(0),
  lensHeight: z.number().min(0).optional().default(0),
  bridgeWidth: z.number().min(0).optional().default(0),
  templeLength: z.number().min(0).optional().default(0),
  weightBg: z.number().min(0).optional().default(0),
  tags: z.array(z.string().trim().max(50)).max(20).optional().default([]),
});

const variantSchema = z.object({
  name: z.string().trim().min(1).max(100),
  sku: z.string().trim().min(1).max(50),
  colorName: z.string().trim().min(1).max(50),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  colorFamily: z.string().trim().max(100).optional().nullable(),
  lensColor: z.string().trim().min(1).max(50),
  stock: z.number().int().nonnegative().max(10000).optional().default(0),
  price: z.number().positive().optional(),
  asset_nobg: z.string().max(2048).optional(),
  asset_glb: z.string().max(2048).optional(),
  asset_tryon: z.string().max(2048).optional(),
  asset_hover: z.string().max(2048).optional(),
  asset_gallery: z.string().max(10000).optional(),
});

/**
 * Create a new prescription glasses product (Admin only)
 */
export async function createPrescriptionGlasses(formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // Extract and validate basic data
    const name = formData.get('name') as string;
    const rawSlug = formData.get('slug') as string;
    const slug = rawSlug
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const brand = (formData.get('brand') as string) || 'FocusRobin';
    const descriptionRaw = formData.get('description') as string | null;
    const description = descriptionRaw?.trim() || null;
    const basePrice = parseFloat(formData.get('basePrice') as string);
    const compareAtPriceRaw = formData.get('compareAtPrice') as string;
    const compareAtPrice = compareAtPriceRaw && parseFloat(compareAtPriceRaw) > 0 ? parseFloat(compareAtPriceRaw) : null;
    const discountPct = parseInt(formData.get('discountPct') as string) || 0;
    const cashbackAmount = parseFloat(formData.get('cashbackAmount') as string) || 0;

    // Parse linked product info
    const linkedProductIdRaw = formData.get('linkedProductId') as string | null;
    const linkedProductId = linkedProductIdRaw && linkedProductIdRaw.trim() ? linkedProductIdRaw.trim() : null;
    const useSharedStock = formData.get('useSharedStock') === 'true';

    // Parse multiple genders
    const genderCount = parseInt(formData.get('genderCount') as string) || 0;
    const genders: Gender[] = [];
    for (let i = 0; i < genderCount; i++) {
      const genderValue = formData.get(`gender-${i}`) as Gender;
      if (genderValue && Object.values(Gender).includes(genderValue)) {
        genders.push(genderValue);
      }
    }
    if (genders.length === 0) {
      genders.push(Gender.UNISEX);
    }

    const tags = (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean) || [];

    // Dimensions
    const frameWidth = parseFloat(formData.get('frameWidth') as string) || 0;
    const lensWidth = parseFloat(formData.get('lensWidth') as string) || 0;
    const lensHeight = parseFloat(formData.get('lensHeight') as string) || 0;
    const bridgeWidth = parseFloat(formData.get('bridgeWidth') as string) || 0;
    const templeLength = parseFloat(formData.get('templeLength') as string) || 0;
    const weightBg = parseFloat(formData.get('weightBg') as string) || 0;

    // Specs
    const frameMaterial = (formData.get('frameMaterial') as string) || '';
    const lensMaterial = (formData.get('lensMaterial') as string) || '';
    const uvProtection = (formData.get('uvProtection') as string) || null;
    const glassShapeRaw = formData.get('glassShape') as string | null;
    const glassShape = glassShapeRaw?.trim() || null;

    // Dynamic Product Features
    const isPolarized = formData.get('isPolarized') === 'on';
    const isUVProtection = formData.get('isUVProtection') === 'on';
    const isHydrophobic = formData.get('isHydrophobic') === 'on';
    const isAntiScratch = formData.get('isAntiScratch') === 'on';
    const isBioBased = formData.get('isBioBased') === 'on';
    const warranty = (formData.get('warranty') as string) || '1.5 Years Warranty';
    const customFeaturesRaw = formData.get('customFeatures') as string;
    const customFeatures = customFeaturesRaw?.split(',').map(f => f.trim()).filter(Boolean) || [];

    // Product Highlights
    const showHighlights = formData.get('showHighlights') === 'on';
    const highlightCount = parseInt(formData.get('highlightCount') as string) || 0;
    const highlightsData: Array<{ title: string; description: string; imageUrl: string; order: number }> = [];
    for (let i = 0; i < highlightCount; i++) {
      const title = formData.get(`highlight-${i}-title`) as string;
      const description = formData.get(`highlight-${i}-description`) as string;
      const imageUrl = formData.get(`highlight-${i}-image`) as string;
      if (title && description) {
        highlightsData.push({ title, description, imageUrl: imageUrl || '', order: i });
      }
    }

    // Auto-create shape in GlassShape table if it doesn't exist
    if (glassShape) {
      try {
        await prisma.glassShape.upsert({
          where: { name: glassShape },
          update: {}, // Don't update if exists
          create: {
            name: glassShape,
            imageUrl: null,
            order: 0,
            isActive: true,
          },
        });
      } catch (error) {
        // Log but don't fail prescription glasses creation if shape creation fails
        console.error('Error auto-creating glass shape:', error);
      }
    }

    // Validate data
    const validation = prescriptionGlassesSchema.safeParse({
      name,
      slug,
      brand,
      description,
      basePrice,
      compareAtPrice,
      discountPct,
      cashbackAmount,
      frameMaterial,
      lensMaterial,
      uvProtection,
      glassShape,
      frameWidth,
      lensWidth,
      lensHeight,
      bridgeWidth,
      templeLength,
      weightBg,
      tags,
    });

    if (!validation.success) {
      return { error: validation.error.errors[0]?.message || "Invalid data" };
    }

    // Parse variants
    const variantsData: PrescriptionGlassesVariantData[] = [];
    const variantCount = parseInt(formData.get('variantCount') as string) || 0;

    for (let i = 0; i < variantCount; i++) {
      const variantName = formData.get(`variant-${i}-name`) as string;
      const variantSku = formData.get(`variant-${i}-sku`) as string;
      const variantColorName = formData.get(`variant-${i}-colorName`) as string;
      const variantColorHex = formData.get(`variant-${i}-colorHex`) as string;
      const variantColorFamily = formData.get(`variant-${i}-colorFamily`) as string;
      const variantLensColor = formData.get(`variant-${i}-lensColor`) as string;
      const variantStock = parseInt(formData.get(`variant-${i}-stock`) as string) || 0;
      const variantPrice = formData.get(`variant-${i}-price`) as string;
      const asset_nobg = formData.get(`variant-${i}-asset_nobg`) as string;
      const asset_glb = formData.get(`variant-${i}-asset_glb`) as string;
      const asset_tryon = formData.get(`variant-${i}-asset_tryon`) as string;
      const asset_hover = formData.get(`variant-${i}-asset_hover`) as string;
      const asset_gallery = formData.get(`variant-${i}-asset_gallery`) as string;

      const variantValidation = variantSchema.safeParse({
        name: variantName,
        sku: variantSku,
        colorName: variantColorName,
        colorHex: variantColorHex,
        colorFamily: variantColorFamily || undefined,
        lensColor: variantLensColor,
        stock: variantStock,
        price: variantPrice ? parseFloat(variantPrice) : undefined,
        asset_nobg: asset_nobg || undefined,
        asset_glb: asset_glb || undefined,
        asset_tryon: asset_tryon || undefined,
        asset_hover: asset_hover || undefined,
        asset_gallery: asset_gallery || undefined,
      });

      if (!variantValidation.success) {
        return { error: `Variant ${i + 1}: ${variantValidation.error.errors[0]?.message}` };
      }

      variantsData.push(variantValidation.data as PrescriptionGlassesVariantData);
    }

    if (variantsData.length === 0) {
      return { error: 'At least one variant is required' };
    }

    // Check for duplicate slug
    const existingSlug = await prisma.prescriptionGlasses.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existingSlug) {
      return { error: `A prescription glasses product with the slug "${slug}" already exists. Please use a different slug.` };
    }

    // Check for duplicate SKUs
    const skus = variantsData.map(v => v.sku);
    const duplicateCheck = await prisma.prescriptionGlassesVariant.findMany({
      where: {
        sku: { in: skus },
      },
      select: { sku: true },
    });

    if (duplicateCheck.length > 0) {
      const duplicateSkus = duplicateCheck.map(v => v.sku).join(', ');
      return { error: `The following SKU(s) already exist: ${duplicateSkus}. Please use unique SKUs.` };
    }

    // Get or create default category
    let categoryId: string;
    const defaultCategoryName = 'Prescription';

    const existingCategory = await prisma.category.findUnique({
      where: { name: defaultCategoryName },
    });

    if (existingCategory) {
      categoryId = existingCategory.id;
    } else {
      const newCategory = await prisma.category.create({
        data: { name: defaultCategoryName },
      });
      categoryId = newCategory.id;
    }

    // Create prescription glasses with variants
    const prescriptionGlasses = await prisma.prescriptionGlasses.create({
      data: {
        name: validation.data.name,
        slug: validation.data.slug,
        brand: validation.data.brand,
        description: validation.data.description || null,
        basePrice: validation.data.basePrice,
        compareAtPrice: (validation.data as any).compareAtPrice ?? null,
        calculatedRetailPrice: calculateFinalPrice(
          calculateRetailPrice(validation.data.basePrice, validation.data.brand ?? 'FocusRobin'),
          validation.data.discountPct || 0
        ),
        discountPct: validation.data.discountPct || 0,
        cashbackAmount: validation.data.cashbackAmount || 0,
        linkedProductId: linkedProductId,
        useSharedStock: linkedProductId ? useSharedStock : false,
        gender: genders,
        tags: validation.data.tags || [],
        frameWidth,
        lensWidth,
        lensHeight,
        bridgeWidth,
        templeLength,
        weightBg,
        frameMaterial,
        lensMaterial,
        uvProtection,
        glassShape,
        // Dynamic Product Features
        isPolarized,
        isUVProtection,
        isHydrophobic,
        isAntiScratch,
        isBioBased,
        warranty,
        customFeatures,
        showHighlights,
        categoryId,
        PrescriptionGlassesVariant: {
          create: variantsData.map((variant) => {
            const assets: Array<{ url: string; type: AssetType; isPrimary: boolean }> = [];

            if (variant.asset_nobg) {
              assets.push({
                url: variant.asset_nobg,
                type: AssetType.NO_BG,
                isPrimary: false,
              });
            }

            if (variant.asset_glb) {
              assets.push({
                url: variant.asset_glb,
                type: AssetType.GLB,
                isPrimary: false,
              });
            }

            if (variant.asset_tryon) {
              assets.push({
                url: variant.asset_tryon,
                type: AssetType.TRY_ON_2D,
                isPrimary: false,
              });
            }

            if (variant.asset_hover) {
              assets.push({
                url: variant.asset_hover,
                type: AssetType.HOVER,
                isPrimary: false,
              });
            }

            if (variant.asset_gallery) {
              const galleryUrls = variant.asset_gallery
                .split(',')
                .map((url) => url.trim())
                .filter(Boolean);

              galleryUrls.forEach((url, index) => {
                assets.push({
                  url,
                  type: AssetType.GALLERY,
                  isPrimary: index === 0,
                });
              });
            }

            return {
              name: variant.name,
              sku: variant.sku,
              colorName: variant.colorName,
              colorHex: variant.colorHex,
              colorFamily: variant.colorFamily || null,
              lensColor: variant.lensColor,
              stock: variant.stock,
              price: variant.price ?? null,
              PrescriptionGlassesAsset: {
                create: assets,
              },
            };
          }),
        },
        // Create highlights if present
        highlights: showHighlights && highlightsData.length > 0 ? {
          create: highlightsData.map(h => ({
            title: h.title,
            description: h.description,
            imageUrl: h.imageUrl,
            order: h.order,
          })),
        } : undefined,
      } as any,
    });

    revalidatePath('/shop/prescription-glasses');
    revalidatePath('/admin/prescription-glasses');
    revalidateTag('products');
    revalidateTag('prices');
    revalidateTag('shapes');
    revalidateTag('brands');
    revalidateTag('materials');
    revalidateTag('colors');
    revalidateTag('genders');

    return { success: true, prescriptionGlassesId: prescriptionGlasses.id };
  });
}

/**
 * Delete a prescription glasses product (Admin only)
 */
export async function deletePrescriptionGlasses(id: string) {
  return safeAction(async () => {
    await requireAdmin();

    const idSchema = z.string().min(1).max(30);
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid prescription glasses ID" };
    }

    // Check if exists and fetch images
    // @ts-ignore
    const existing = await prisma.prescriptionGlasses.findUnique({
      where: { id: validatedId.data },
      include: {
        highlights: true,
        PrescriptionGlassesVariant: {
          include: {
            PrescriptionGlassesAsset: true
          }
        }
      }
    });

    if (existing) {
      // 1. Delete Highlight Images
      if (existing.highlights && existing.highlights.length > 0) {
        for (const highlight of existing.highlights) {
          if (highlight.imageUrl) {
            const key = getKeyFromUrl(highlight.imageUrl);
            if (key) await deleteFromS3(key);
          }
        }
      }

      // 2. Delete Variant Asset Images
      if (existing.PrescriptionGlassesVariant && existing.PrescriptionGlassesVariant.length > 0) {
        for (const variant of existing.PrescriptionGlassesVariant) {
          if (variant.PrescriptionGlassesAsset && variant.PrescriptionGlassesAsset.length > 0) {
            for (const asset of variant.PrescriptionGlassesAsset) {
              if (asset.url) {
                const key = getKeyFromUrl(asset.url);
                if (key) await deleteFromS3(key);
              }
            }
          }
        }
      }
    }

    // @ts-ignore
    await prisma.prescriptionGlasses.delete({
      where: { id: validatedId.data },
    });

    revalidatePath('/shop/prescription-glasses');
    revalidatePath('/admin/prescription-glasses');
    revalidateTag('products');
    revalidateTag('prices');
    revalidateTag('shapes');
    revalidateTag('brands');
    revalidateTag('materials');
    revalidateTag('colors');
    revalidateTag('genders');

    return { success: true };
  });
}

/**
 * Update an existing prescription glasses product (Admin only)
 */
export async function updatePrescriptionGlasses(id: string, formData: FormData) {
  return safeAction(async () => {
    await requireAdmin();

    // Validate ID
    const idSchema = z.string().min(1).max(30);
    const validatedId = idSchema.safeParse(id);
    if (!validatedId.success) {
      return { error: "Invalid prescription glasses ID" };
    }

    // Check if exists
    const existing = await prisma.prescriptionGlasses.findUnique({
      where: { id: validatedId.data },
      select: {
        id: true,
        slug: true,
        highlights: true,
        PrescriptionGlassesVariant: {
          include: { PrescriptionGlassesAsset: true },
        },
      },
    });

    if (!existing) {
      return { error: "Prescription glasses not found" };
    }

    // Extract basic data
    const name = formData.get('name') as string;
    const rawSlug = formData.get('slug') as string;
    const slug = rawSlug
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const brand = (formData.get('brand') as string) || 'FocusRobin';
    const descriptionRaw = formData.get('description') as string | null;
    const description = descriptionRaw?.trim() || null;
    const basePrice = parseFloat(formData.get('basePrice') as string);
    const compareAtPriceUpdateRaw = formData.get('compareAtPrice') as string;
    const compareAtPriceUpdate = compareAtPriceUpdateRaw && parseFloat(compareAtPriceUpdateRaw) > 0 ? parseFloat(compareAtPriceUpdateRaw) : null;
    const discountPct = parseInt(formData.get('discountPct') as string) || 0;
    const cashbackAmount = parseFloat(formData.get('cashbackAmount') as string) || 0;

    // Parse linked product info
    const linkedProductIdRaw = formData.get('linkedProductId') as string | null;
    const linkedProductId = linkedProductIdRaw && linkedProductIdRaw.trim() && linkedProductIdRaw !== 'none' ? linkedProductIdRaw.trim() : null;
    const useSharedStock = formData.get('useSharedStock') === 'true';

    // Parse genders
    const genderCount = parseInt(formData.get('genderCount') as string) || 0;
    const genders: Gender[] = [];
    for (let i = 0; i < genderCount; i++) {
      const genderValue = formData.get(`gender-${i}`) as Gender;
      if (genderValue && Object.values(Gender).includes(genderValue)) {
        genders.push(genderValue);
      }
    }
    if (genders.length === 0) {
      genders.push(Gender.UNISEX);
    }

    const tags = (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean) || [];

    // Dimensions
    const frameWidth = parseFloat(formData.get('frameWidth') as string) || 0;
    const lensWidth = parseFloat(formData.get('lensWidth') as string) || 0;
    const lensHeight = parseFloat(formData.get('lensHeight') as string) || 0;
    const bridgeWidth = parseFloat(formData.get('bridgeWidth') as string) || 0;
    const templeLength = parseFloat(formData.get('templeLength') as string) || 0;
    const weightBg = parseFloat(formData.get('weightBg') as string) || 0;

    // Specs
    const frameMaterial = (formData.get('frameMaterial') as string) || '';
    const lensMaterial = (formData.get('lensMaterial') as string) || '';
    const uvProtection = (formData.get('uvProtection') as string) || null;
    const glassShapeRaw = formData.get('glassShape') as string | null;
    const glassShape = glassShapeRaw?.trim() || null;

    // Dynamic Product Features
    const isPolarized = formData.get('isPolarized') === 'on';
    const isUVProtection = formData.get('isUVProtection') === 'on';
    const isHydrophobic = formData.get('isHydrophobic') === 'on';
    const isAntiScratch = formData.get('isAntiScratch') === 'on';
    const isBioBased = formData.get('isBioBased') === 'on';
    const warranty = (formData.get('warranty') as string) || '1.5 Years Warranty';
    const customFeaturesRaw = formData.get('customFeatures') as string;
    const customFeatures = customFeaturesRaw?.split(',').map(f => f.trim()).filter(Boolean) || [];

    // Product Highlights
    const showHighlights = formData.get('showHighlights') === 'on';
    const highlightCount = parseInt(formData.get('highlightCount') as string) || 0;
    const highlightsData: Array<{ title: string; description: string; imageUrl: string; order: number }> = [];
    for (let i = 0; i < highlightCount; i++) {
      const title = formData.get(`highlight-${i}-title`) as string;
      const descriptionH = formData.get(`highlight-${i}-description`) as string;
      const imageUrl = formData.get(`highlight-${i}-image`) as string;
      if (title && descriptionH) {
        highlightsData.push({ title, description: descriptionH, imageUrl: imageUrl || '', order: i });
      }
    }

    // Check for slug conflict (if changed)
    if (slug !== existing.slug) {
      const slugConflict = await prisma.prescriptionGlasses.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (slugConflict) {
        return { error: `A prescription glasses product with the slug "${slug}" already exists.` };
      }
    }

    // Update prescription glasses (excluding variants - they need separate handling if needed)
    await prisma.prescriptionGlasses.update({
      where: { id: validatedId.data },
      data: {
        name,
        slug,
        brand,
        description,
        basePrice,
        compareAtPrice: compareAtPriceUpdate,
        calculatedRetailPrice: calculateFinalPrice(
          calculateRetailPrice(basePrice, brand),
          discountPct
        ),
        discountPct,
        cashbackAmount,
        linkedProductId,
        useSharedStock: linkedProductId ? useSharedStock : false,
        gender: genders,
        tags,
        frameWidth,
        lensWidth,
        lensHeight,
        bridgeWidth,
        templeLength,
        weightBg,
        frameMaterial,
        lensMaterial,
        uvProtection,
        glassShape,
        // Dynamic Product Features
        isPolarized,
        isUVProtection,
        isHydrophobic,
        isAntiScratch,
        isBioBased,
        warranty,
        customFeatures,
        showHighlights,
      } as any,
    });

    // Handle highlights update (delete and recreate)
    // First delete OLD highlight images from S3 if they are not reused
    if (existing.highlights && existing.highlights.length > 0) {
      for (const highlight of existing.highlights) {
        // Check if this image URL is being reused in the new highlights data
        const isReused = highlightsData.some(h => h.imageUrl === highlight.imageUrl);
        if (highlight.imageUrl && !isReused) {
          const key = getKeyFromUrl(highlight.imageUrl);
          if (key) await deleteFromS3(key);
        }
      }
    }

    // @ts-ignore
    await prisma.prescriptionHighlight.deleteMany({
      where: { prescriptionGlassesId: validatedId.data },
    });

    if (showHighlights && highlightsData.length > 0) {
      await prisma.prescriptionHighlight.createMany({
        data: highlightsData.map(h => ({
          prescriptionGlassesId: validatedId.data,
          title: h.title,
          description: h.description,
          imageUrl: h.imageUrl,
          order: h.order,
        })),
      });
    }

    // Handle variant updates
    const variantCount = parseInt(formData.get('variantCount') as string) || 0;
    const submittedVariantIds: string[] = [];

    for (let i = 0; i < variantCount; i++) {
      const variantId = formData.get(`variant-${i}-id`) as string | null;
      const variantName = formData.get(`variant-${i}-name`) as string;
      const variantSku = formData.get(`variant-${i}-sku`) as string;
      const variantColorName = formData.get(`variant-${i}-colorName`) as string;
      const variantColorHex = formData.get(`variant-${i}-colorHex`) as string;
      const variantColorFamily = formData.get(`variant-${i}-colorFamily`) as string;
      const variantLensColor = formData.get(`variant-${i}-lensColor`) as string;
      const variantStock = parseInt(formData.get(`variant-${i}-stock`) as string) || 0;
      const asset_nobg = (formData.get(`variant-${i}-asset_nobg`) as string) || '';
      const asset_glb = (formData.get(`variant-${i}-asset_glb`) as string) || '';
      const asset_tryon = (formData.get(`variant-${i}-asset_tryon`) as string) || '';
      const asset_hover = (formData.get(`variant-${i}-asset_hover`) as string) || '';
      const asset_gallery = (formData.get(`variant-${i}-asset_gallery`) as string) || '';

      if (!variantName || !variantSku || !variantColorHex) continue;

      // Build assets array
      const newAssets: Array<{ url: string; type: AssetType; isPrimary: boolean }> = [];
      if (asset_nobg) newAssets.push({ url: asset_nobg, type: AssetType.NO_BG, isPrimary: false });
      if (asset_glb) newAssets.push({ url: asset_glb, type: AssetType.GLB, isPrimary: false });
      if (asset_tryon) newAssets.push({ url: asset_tryon, type: AssetType.TRY_ON_2D, isPrimary: false });
      if (asset_hover) newAssets.push({ url: asset_hover, type: AssetType.HOVER, isPrimary: false });
      if (asset_gallery) {
        const galleryUrls = asset_gallery.split(',').map(u => u.trim()).filter(Boolean);
        galleryUrls.forEach((url, idx) => newAssets.push({ url, type: AssetType.GALLERY, isPrimary: idx === 0 }));
      }

      if (variantId) {
        // Update existing variant
        submittedVariantIds.push(variantId);
        await prisma.prescriptionGlassesVariant.update({
          where: { id: variantId },
          data: {
            name: variantName,
            sku: variantSku,
            colorName: variantColorName,
            colorHex: variantColorHex,
            colorFamily: variantColorFamily || null,
            lensColor: variantLensColor || '',
            stock: variantStock,
          },
        });
        // Replace assets: delete old, create new
        await prisma.prescriptionGlassesAsset.deleteMany({ where: { variantId } });
        if (newAssets.length > 0) {
          await prisma.prescriptionGlassesAsset.createMany({
            data: newAssets.map(a => ({ ...a, variantId })),
          });
        }
      } else {
        // Create new variant
        const newVariant = await prisma.prescriptionGlassesVariant.create({
          data: {
            name: variantName,
            sku: variantSku,
            colorName: variantColorName,
            colorHex: variantColorHex,
            colorFamily: variantColorFamily || null,
            lensColor: variantLensColor || '',
            stock: variantStock,
            prescriptionGlassesId: validatedId.data,
            PrescriptionGlassesAsset: { create: newAssets },
          },
        });
        submittedVariantIds.push(newVariant.id);
      }
    }

    // Delete variants that were removed in the form
    if (existing.PrescriptionGlassesVariant && existing.PrescriptionGlassesVariant.length > 0) {
      for (const oldVariant of existing.PrescriptionGlassesVariant) {
        if (!submittedVariantIds.includes(oldVariant.id)) {
          // Delete assets from S3
          for (const asset of oldVariant.PrescriptionGlassesAsset) {
            if (asset.url) {
              const key = getKeyFromUrl(asset.url);
              if (key) await deleteFromS3(key);
            }
          }
          await prisma.prescriptionGlassesVariant.delete({ where: { id: oldVariant.id } });
        }
      }
    }

    revalidatePath('/shop/prescription-glasses');
    revalidatePath('/admin/prescription-glasses');
    revalidatePath(`/shop/${slug}`);
    revalidateTag('products');
    revalidateTag('prices');
    revalidateTag('shapes');
    revalidateTag('brands');
    revalidateTag('materials');
    revalidateTag('colors');
    revalidateTag('genders');

    return { success: true };
  });
}
