'use server';

import { prisma } from '@/lib/prisma';
import { Gender, AssetType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export interface VariantData {
  name: string;
  sku: string;
  colorName: string;
  colorHex: string;
  lensColor: string;
  stock: number;
  asset_nobg?: string;
  asset_glb?: string;
  asset_tryon?: string;
  asset_hover?: string;
  asset_gallery?: string; // Comma-separated URLs
}

export async function createProduct(formData: FormData) {
  try {
    // Basic Details
    const name = formData.get('name') as string;
    // Normalize slug: trim, lowercase, replace spaces with hyphens, remove special chars
    const rawSlug = formData.get('slug') as string;
    const slug = rawSlug
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, '') // Remove special characters except hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    const description = formData.get('description') as string;
    const basePrice = parseFloat(formData.get('basePrice') as string);
    const discountPct = parseInt(formData.get('discountPct') as string) || 0;
    
    // Parse multiple genders from formData
    const genderCount = parseInt(formData.get('genderCount') as string) || 0;
    const genders: Gender[] = [];
    for (let i = 0; i < genderCount; i++) {
      const genderValue = formData.get(`gender-${i}`) as Gender;
      if (genderValue && Object.values(Gender).includes(genderValue)) {
        genders.push(genderValue);
      }
    }
    // Default to UNISEX if no genders selected
    if (genders.length === 0) {
      genders.push(Gender.UNISEX);
    }
    
    const tags = (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean) || [];

    // Dimensions
    const frameWidth = parseFloat(formData.get('frameWidth') as string);
    const lensWidth = parseFloat(formData.get('lensWidth') as string);
    const lensHeight = parseFloat(formData.get('lensHeight') as string);
    const bridgeWidth = parseFloat(formData.get('bridgeWidth') as string);
    const templeLength = parseFloat(formData.get('templeLength') as string);
    const weightBg = parseFloat(formData.get('weightBg') as string);

    // Specs
    const frameMaterial = formData.get('frameMaterial') as string;
    const lensMaterial = (formData.get('lensMaterial') as string) || 'Polycarbonate';
    const uvProtection = formData.get('uvProtection') as string;

    // Variants - parse from form data
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

      if (variantName && variantSku && variantColorName && variantColorHex && variantLensColor) {
        variantsData.push({
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
      }
    }

    if (variantsData.length === 0) {
      return { error: 'At least one variant is required' };
    }

    // Validate required fields
    if (!name || !slug || !description || !frameMaterial || !uvProtection) {
      return { error: 'Missing required fields' };
    }

    // Get or create default "Unisex" category (required by schema, but we use gender for display)
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

    // Create product with nested variants and assets
    // @ts-ignore - Prisma client types may not be fully regenerated, but schema uses capitalized relation names
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        basePrice,
        discountPct: discountPct || 0,
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
        categoryId,
        ProductVariant: {
          create: variantsData.map((variant) => {
            // Build assets array from the 5 asset types
            const assets: Array<{ url: string; type: AssetType; isPrimary: boolean }> = [];

            // NO_BG - Bestseller Image (Transparent BG)
            if (variant.asset_nobg) {
              assets.push({
                url: variant.asset_nobg,
                type: AssetType.NO_BG,
                isPrimary: false,
              });
            }

            // GLB - Live AR Model
            if (variant.asset_glb) {
              assets.push({
                url: variant.asset_glb,
                type: AssetType.GLB,
                isPrimary: false,
              });
            }

            // TRY_ON_2D - Photo Try-On (Front View)
            if (variant.asset_tryon) {
              assets.push({
                url: variant.asset_tryon,
                type: AssetType.TRY_ON_2D,
                isPrimary: false,
              });
            }

            // HOVER - Shop Card Hover (Tilted)
            if (variant.asset_hover) {
              assets.push({
                url: variant.asset_hover,
                type: AssetType.HOVER,
                isPrimary: false,
              });
            }

            // GALLERY - Gallery Images (multiple, comma-separated)
            if (variant.asset_gallery) {
              const galleryUrls = variant.asset_gallery
                .split(',')
                .map((url) => url.trim())
                .filter(Boolean);
              
              galleryUrls.forEach((url, index) => {
                assets.push({
                  url,
                  type: AssetType.GALLERY,
                  isPrimary: index === 0, // First gallery image is primary
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
  } catch (error) {
    console.error('Error creating product:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create product' };
  }
}

