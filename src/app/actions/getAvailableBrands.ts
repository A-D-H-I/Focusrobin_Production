"use server";

import { prisma } from "@/lib/prisma";

export interface AvailableBrand {
    brand: string;
    count: number;
    imageUrl: string | null;
}

/**
 * Get all available brands from products
 * Returns unique brands with product counts and images from Brand table
 * @param type 'sunglasses' | 'eyeglasses' - Product type to fetch brands for
 */
export async function getAvailableBrands(type: 'sunglasses' | 'eyeglasses' = 'sunglasses'): Promise<AvailableBrand[]> {
    try {
        let products;

        if (type === 'eyeglasses') {
            // Fetch prescription glasses brands
            // @ts-ignore - brand field exists in DB but client might be stale
            products = await prisma.prescriptionGlasses.findMany({
                select: {
                    brand: true,
                } as any,
            });
        } else {
            // Fetch sunglasses brands (default)
            // @ts-ignore - brand field exists in DB but client might be stale
            products = await prisma.product.findMany({
                select: {
                    brand: true,
                } as any,
            });
        }

        // Fetch brand images from Brand table
        const brandImages = await prisma.brand.findMany({
            where: { isActive: true },
            select: {
                name: true,
                imageUrl: true,
                order: true,
            },
            orderBy: [
                { order: 'asc' },
                { name: 'asc' },
            ],
        });
        const brandImageMap = new Map(brandImages.map(b => [b.name, { imageUrl: b.imageUrl, order: b.order }]));

        const brandMap = new Map<string, number>();

        products.forEach((product: any) => {
            // Handle potentially null/undefined brands
            const brandName = product.brand?.trim() || 'FocusRobin';
            brandMap.set(brandName, (brandMap.get(brandName) || 0) + 1);
        });

        const availableBrands: AvailableBrand[] = Array.from(brandMap.entries())
            .map(([brand, count]) => ({
                brand,
                count,
                imageUrl: brandImageMap.get(brand)?.imageUrl || null,
            }))
            .sort((a, b) => {
                // First sort by order from Brand table (if exists)
                const aOrder = brandImageMap.get(a.brand)?.order ?? 999;
                const bOrder = brandImageMap.get(b.brand)?.order ?? 999;
                if (aOrder !== bOrder) {
                    return aOrder - bOrder;
                }
                // Then sort by count (desc) then name (asc)
                if (b.count !== a.count) {
                    return b.count - a.count;
                }
                return a.brand.localeCompare(b.brand);
            });

        return availableBrands;
    } catch (error) {
        console.error("Error fetching available brands:", error);
        return [];
    }
}
