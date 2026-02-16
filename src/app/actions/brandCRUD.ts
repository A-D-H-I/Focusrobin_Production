'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { deleteFromS3 } from '@/lib/s3';

export interface BrandData {
    id?: string;
    name: string;
    imageUrl?: string;
    landingImageUrl?: string;
    order?: number;
    isActive?: boolean;
}

/**
 * Extract S3 object key from URL
 */
function getKeyFromUrl(url: string): string | null {
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

export async function createBrand(formData: FormData) {
    try {
        const name = formData.get('name') as string;
        const imageUrl = formData.get('imageUrl') as string | null;
        const landingImageUrl = formData.get('landingImageUrl') as string | null;
        const orderStr = formData.get('order') as string | null;
        const isActiveStr = formData.get('isActive') as string | null;

        if (!name || name.trim() === '') {
            return { error: 'Brand name is required' };
        }

        // Check if brand with this name already exists
        const existing = await prisma.brand.findUnique({
            where: { name: name.trim() },
        });

        if (existing) {
            return { error: 'A brand with this name already exists' };
        }

        const order = orderStr ? parseInt(orderStr, 10) : 0;
        const isActive = isActiveStr === 'true' || isActiveStr === null;

        const brand = await prisma.brand.create({
            data: {
                name: name.trim(),
                imageUrl: imageUrl || null,
                landingImageUrl: landingImageUrl || null,
                order: order,
                isActive: isActive,
            },
        });

        revalidatePath('/admin/brands');
        revalidatePath('/shop');
        revalidatePath('/');

        return { success: true, data: brand };
    } catch (error: any) {
        console.error('Error creating brand:', error);
        return { error: error.message || 'Failed to create brand' };
    }
}

export async function updateBrand(formData: FormData) {
    try {
        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        const imageUrl = formData.get('imageUrl') as string | null;
        const landingImageUrl = formData.get('landingImageUrl') as string | null;
        const orderStr = formData.get('order') as string | null;
        const isActiveStr = formData.get('isActive') as string | null;

        if (!id) {
            return { error: 'Brand ID is required' };
        }

        if (!name || name.trim() === '') {
            return { error: 'Brand name is required' };
        }

        // Check if another brand with this name exists
        const existing = await prisma.brand.findUnique({
            where: { name: name.trim() },
        });

        if (existing && existing.id !== id) {
            return { error: 'A brand with this name already exists' };
        }

        // Get current brand data to check for changed images
        const currentBrand = await prisma.brand.findUnique({
            where: { id },
        });

        if (!currentBrand) {
            return { error: 'Brand not found' };
        }

        // Handle Image Deletion from S3 if images changed
        if (currentBrand.imageUrl && currentBrand.imageUrl !== imageUrl) {
            const key = getKeyFromUrl(currentBrand.imageUrl);
            if (key) await deleteFromS3(key);
        }

        if (currentBrand.landingImageUrl && currentBrand.landingImageUrl !== landingImageUrl) {
            const key = getKeyFromUrl(currentBrand.landingImageUrl);
            if (key) await deleteFromS3(key);
        }

        const order = orderStr ? parseInt(orderStr, 10) : 0;
        const isActive = isActiveStr === 'true';

        const brand = await prisma.brand.update({
            where: { id },
            data: {
                name: name.trim(),
                imageUrl: imageUrl || null,
                landingImageUrl: landingImageUrl || null,
                order: order,
                isActive: isActive,
            },
        });

        revalidatePath('/admin/brands');
        revalidatePath('/shop');
        revalidatePath('/');

        return { success: true, data: brand };
    } catch (error: any) {
        console.error('Error updating brand:', error);
        return { error: error.message || 'Failed to update brand' };
    }
}

export async function deleteBrand(formData: FormData) {
    try {
        const id = formData.get('id') as string;

        if (!id) {
            return { error: 'Brand ID is required' };
        }

        // Get brand to delete images
        const brand = await prisma.brand.findUnique({
            where: { id },
        });

        if (brand) {
            // Delete images from S3
            if (brand.imageUrl) {
                const key = getKeyFromUrl(brand.imageUrl);
                if (key) await deleteFromS3(key);
            }
            if (brand.landingImageUrl) {
                const key = getKeyFromUrl(brand.landingImageUrl);
                if (key) await deleteFromS3(key);
            }

            await prisma.brand.delete({
                where: { id },
            });
        }

        revalidatePath('/admin/brands');
        revalidatePath('/shop');
        revalidatePath('/');

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting brand:', error);
        return { error: error.message || 'Failed to delete brand' };
    }
}

export async function getAllBrands() {
    try {
        const brands = await prisma.brand.findMany({
            orderBy: [
                { order: 'asc' },
                { name: 'asc' },
            ],
        });

        return { success: true, data: brands };
    } catch (error: any) {
        console.error('Error fetching brands:', error);
        return { error: error.message || 'Failed to fetch brands' };
    }
}

/**
 * Sync brands from existing products to Brand table
 * This ensures all brands used in products are available in the admin panel
 */
export async function syncBrandsFromProducts() {
    try {
        // Get all brands from products
        // @ts-ignore - brand field exists in DB but client might be stale
        const products = await prisma.product.findMany({
            select: {
                brand: true,
            } as any,
        });

        // Get all brands from prescription glasses
        // @ts-ignore - brand field exists in DB but client might be stale
        const prescriptionGlasses = await prisma.prescriptionGlasses.findMany({
            select: {
                brand: true,
            } as any,
        });

        // Combine and get unique brands
        const allBrands = new Set<string>();
        products.forEach((p: any) => {
            if (p.brand) {
                const trimmed = p.brand.trim();
                if (trimmed) {
                    allBrands.add(trimmed);
                }
            }
        });
        prescriptionGlasses.forEach((pg: any) => {
            if (pg.brand) {
                const trimmed = pg.brand.trim();
                if (trimmed) {
                    allBrands.add(trimmed);
                }
            }
        });

        // Get existing brands from Brand table
        const existingBrands = await prisma.brand.findMany({
            select: {
                name: true,
            },
        });
        const existingBrandNames = new Set(existingBrands.map((b) => b.name));

        // Create missing brands
        const brandsToCreate = Array.from(allBrands).filter(
            (brand) => !existingBrandNames.has(brand) && brand.length > 0
        );

        if (brandsToCreate.length > 0) {
            await prisma.brand.createMany({
                data: brandsToCreate.map((brand) => ({
                    name: brand,
                    imageUrl: null,
                    landingImageUrl: null,
                    order: 0,
                    isActive: true,
                })),
                skipDuplicates: true,
            });
        }

        revalidatePath('/admin/brands');
        revalidatePath('/shop');
        revalidatePath('/');

        return {
            success: true,
            created: brandsToCreate.length,
            brands: brandsToCreate,
        };
    } catch (error: any) {
        console.error('Error syncing brands:', error);
        return { error: error.message || 'Failed to sync brands' };
    }
}
