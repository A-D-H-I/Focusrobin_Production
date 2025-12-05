'use server';

import { prisma } from '@/lib/prisma';
import { Gender, AssetType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";

export interface VariantData {
  name: string;
  sku: string;
  colorName: string;
  colorHex: string;
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
const productSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(1).max(100),
  description: z.string().trim().min(10, "Description must be at least 10 characters long").max(5000),
  basePrice: z.number().positive().max(100000),
  discountPct: z.number().int().min(0).max(99).optional().default(0),
  cashbackAmount: z.number().nonnegative().max(1000).optional().default(0),
  frameMaterial: z.string().trim().min(2).max(100),
  lensMaterial: z.string().trim().max(100).optional().default("Polycarbonate"),
  uvProtection: z.string().trim().min(2).max(50),
  frameWidth: z.number().positive().optional(),
  lensWidth: z.number().positive().optional(),
  lensHeight: z.number().positive().optional(),
  bridgeWidth: z.number().positive().optional(),
  templeLength: z.number().positive().optional(),
  weightBg: z.number().positive().optional(),
  tags: z.array(z.string().trim().max(50)).max(20).optional().default([]),
});

const variantSchema = z.object({
  name: z.string().trim().min(1).max(100),
  sku: z.string().trim().min(1).max(50),
  colorName: z.string().trim().min(1).max(50),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
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
 * Create a new product (Admin only)
 */
export async function createProduct(formData: FormData) {
  return safeAction(async () => {
    // Require admin role
    await requireAdmin();

    // Extract and validate basic product data
    const name = formData.get('name') as string;
    const rawSlug = formData.get('slug') as string;
    const slug = rawSlug
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const description = formData.get('description') as string;
    const basePrice = parseFloat(formData.get('basePrice') as string);
    const discountPct = parseInt(formData.get('discountPct') as string) || 0;
    const cashbackAmount = parseFloat(formData.get('cashbackAmount') as string) || 0;
    
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
    const frameWidth = parseFloat(formData.get('frameWidth') as string) || undefined;
    const lensWidth = parseFloat(formData.get('lensWidth') as string) || undefined;
    const lensHeight = parseFloat(formData.get('lensHeight') as string) || undefined;
    const bridgeWidth = parseFloat(formData.get('bridgeWidth') as string) || undefined;
    const templeLength = parseFloat(formData.get('templeLength') as string) || undefined;
    const weightBg = parseFloat(formData.get('weightBg') as string) || undefined;

    // Specs
    const frameMaterial = formData.get('frameMaterial') as string;
    const lensMaterial = (formData.get('lensMaterial') as string) || 'Polycarbonate';
    const uvProtection = formData.get('uvProtection') as string;

    // Validate product data
    const productValidation = productSchema.safeParse({
      name,
      slug,
      description,
      basePrice,
      discountPct,
      cashbackAmount,
      frameMaterial,
      lensMaterial,
      uvProtection,
      frameWidth,
      lensWidth,
      lensHeight,
      bridgeWidth,
      templeLength,
      weightBg,
      tags,
    });

    if (!productValidation.success) {
      return { error: productValidation.error.errors[0]?.message || "Invalid product data" };
    }

    // Parse variants
    const variantsData: VariantData[] = [];
    const variantCount = parseInt(formData.get('variantCount') as string) || 0;

    for (let i = 0; i < variantCount; i++) {
      const variantName = formData.get(`variant-${i}-name`) as string;
      const variantSku = formData.get(`variant-${i}-sku`) as string;
      const variantColorName = formData.get(`variant-${i}-colorName`) as string;
      const variantColorHex = formData.get(`variant-${i}-colorHex`) as string;
      const variantLensColor = formData.get(`variant-${i}-lensColor`) as string;
      const variantStock = parseInt(formData.get(`variant-${i}-stock`) as string) || 0;
      const variantPrice = formData.get(`variant-${i}-price`) as string;
      const asset_nobg = formData.get(`variant-${i}-asset_nobg`) as string;
      const asset_glb = formData.get(`variant-${i}-asset_glb`) as string;
      const asset_tryon = formData.get(`variant-${i}-asset_tryon`) as string;
      const asset_hover = formData.get(`variant-${i}-asset_hover`) as string;
      const asset_gallery = formData.get(`variant-${i}-asset_gallery`) as string;

      // Validate each variant
      const variantValidation = variantSchema.safeParse({
        name: variantName,
        sku: variantSku,
        colorName: variantColorName,
        colorHex: variantColorHex,
        lensColor: variantLensColor,
        stock: variantStock,
        price: variantPrice ? parseFloat(variantPrice) : undefined,
        asset_nobg: asset_nobg || undefined,
        asset_glb: asset_glb || undefined,
        asset_tryon: asset_tryon || undefined,
        asset_hover: asset_hover || undefined,
        asset_gallery: asset_gallery || undefined,
      });

      if (variantValidation.success) {
        variantsData.push(variantValidation.data);
      }
    }

    if (variantsData.length === 0) {
      return { error: 'At least one valid variant is required' };
    }

    // Get or create default category
    let categoryId: string;
    const defaultCategoryName = 'Unisex';
    
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

    // Create product with variants
    const product = await prisma.product.create({
      data: {
        name: productValidation.data.name,
        slug: productValidation.data.slug,
        description: productValidation.data.description,
        basePrice: productValidation.data.basePrice,
        discountPct: productValidation.data.discountPct || 0,
        cashbackAmount: productValidation.data.cashbackAmount || 0,
        gender: genders,
        tags: productValidation.data.tags || [],
        frameWidth: productValidation.data.frameWidth,
        lensWidth: productValidation.data.lensWidth,
        lensHeight: productValidation.data.lensHeight,
        bridgeWidth: productValidation.data.bridgeWidth,
        templeLength: productValidation.data.templeLength,
        weightBg: productValidation.data.weightBg,
        frameMaterial: productValidation.data.frameMaterial,
        lensMaterial: productValidation.data.lensMaterial,
        uvProtection: productValidation.data.uvProtection,
        categoryId,
        ProductVariant: {
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
              lensColor: variant.lensColor,
              stock: variant.stock,
              price: variant.price,
              ProductAsset: {
                create: assets,
              },
            };
          }),
        },
      },
    } as any);

    revalidatePath('/admin/add');
    revalidatePath('/shop');

    return { success: true, productId: product.id };
  });
}
