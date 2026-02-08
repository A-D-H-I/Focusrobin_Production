"use server";

import { prisma } from "@/lib/prisma";

export interface AvailableBrand {
    brand: string;
    count: number;
}

/**
 * Get all available brands from products
 * Returns unique brands with product counts
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
            }))
            .sort((a, b) => {
                // Sort by count (desc) then name (asc)
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
