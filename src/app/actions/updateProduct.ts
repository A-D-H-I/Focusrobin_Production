'use server';

import { prisma } from '@/lib/prisma';
import { Gender, AssetType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export interface VariantData {
  id?: string; // For existing variants
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

export async function updateProduct(productId: string, formData: FormData) {
  try {
    // Basic Details
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
      const variantId = formData.get(`variant-${i}-id`) as string;
      const variantName = formData.get(`variant-${i}-name`) as string;
      const variantSku = formData.get(`variant-${i}-sku`) as string;
      const variantColorName = formData.get(`variant-${i}-colorName`) as string;
      const variantColorHex = formData.get(`variant-${i}-colorHex`) as string;
      const variantLensColor = formData.get(`variant-${i}-lensColor`) as string;
      const variantStock = parseInt(formData.get(`variant-${i}-stock`) as string) || 0;
      const asset_nobg = formData.get(`variant-${i}-asset_nobg`) as string;
      const asset_glb = formData.get(`variant-${i}-asset_glb`) as string;
      const asset_tryon = formData.get(`variant-${i}-asset_tryon`) as string;
      const asset_hover = formData.get(`variant-${i}-asset_hover`) as string;
      const asset_gallery = formData.get(`variant-${i}-asset_gallery`) as string;

      if (variantName && variantSku && variantColorName && variantColorHex && variantLensColor) {
        variantsData.push({
          id: variantId || undefined,
          name: variantName,
          sku: variantSku,
          colorName: variantColorName,
          colorHex: variantColorHex,
          lensColor: variantLensColor,
          stock: variantStock,
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

    // Check for duplicate SKUs (excluding current product's variants)
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { ProductVariant: { select: { id: true, sku: true } } },
    });

    if (!existingProduct) {
      return { error: 'Product not found' };
    }

    const existingSkus = existingProduct.ProductVariant.map(v => v.sku);
    const newSkus = variantsData.map(v => v.sku).filter(sku => !existingSkus.includes(sku));
    
    if (newSkus.length > 0) {
      const duplicateCheck = await prisma.productVariant.findMany({
        where: {
          sku: { in: newSkus },
        },
        select: { sku: true },
      });

      if (duplicateCheck.length > 0) {
        const duplicateSkus = duplicateCheck.map(v => v.sku).join(', ');
        return { error: `The following SKU(s) already exist: ${duplicateSkus}. Please use unique SKUs.` };
      }
    }

    // Check if slug already exists (for different product)
    if (slug !== existingProduct.slug) {
      const slugCheck = await prisma.product.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (slugCheck) {
        return { error: `A product with the slug "${slug}" already exists. Please use a different slug.` };
      }
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

    // Get existing variant IDs to track what to delete
    const existingVariantIds = existingProduct.ProductVariant.map(v => v.id);
    const updatedVariantIds = variantsData.filter(v => v.id).map(v => v.id!);
    const variantsToDelete = existingVariantIds.filter(id => !updatedVariantIds.includes(id));

    // Delete variants that are no longer in the form
    if (variantsToDelete.length > 0) {
      await prisma.productVariant.deleteMany({
        where: { id: { in: variantsToDelete } },
      });
    }

    // Update product (without variants first)
    // @ts-ignore - Prisma client types may not be fully regenerated
    const product = await prisma.product.update({
      where: { id: productId },
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
      },
    } as any);

    // Helper function to build assets array
    const buildAssets = (variant: VariantData): Array<{ url: string; type: AssetType; isPrimary: boolean }> => {
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

      return assets;
    };

    // Update existing variants and their assets
    for (const variant of variantsData.filter(v => v.id)) {
      const assets = buildAssets(variant);

      // Delete all existing assets for this variant
      await prisma.productAsset.deleteMany({
        where: { variantId: variant.id! },
      });

      // Update variant
      await prisma.productVariant.update({
        where: { id: variant.id! },
        data: {
          name: variant.name,
          sku: variant.sku,
          colorName: variant.colorName,
          colorHex: variant.colorHex,
          lensColor: variant.lensColor,
          stock: variant.stock,
          ProductAsset: {
            create: assets,
          },
        },
      });
    }

    // Create new variants
    for (const variant of variantsData.filter(v => !v.id)) {
      const assets = buildAssets(variant);

      await prisma.productVariant.create({
        data: {
          productId,
          name: variant.name,
          sku: variant.sku,
          colorName: variant.colorName,
          colorHex: variant.colorHex,
          lensColor: variant.lensColor,
          stock: variant.stock,
          ProductAsset: {
            create: assets,
          },
        },
      });
    }

    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${product.slug}`);
    revalidatePath('/shop');
    revalidatePath(`/products/${product.slug}`);

    return { success: true, productId: product.id };
  } catch (error) {
    console.error('Error updating product:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update product' };
  }
}

