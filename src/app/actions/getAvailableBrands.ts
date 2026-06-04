"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

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
    return unstable_cache(
        async () => {
            try {
                let brandCounts: { brand: string | null; _count: { _all: number } }[] = [];

                if (type === 'eyeglasses') {
                    // Fetch prescription glasses brands
                    // @ts-ignore - brand field exists in DB
                    brandCounts = await prisma.prescriptionGlasses.groupBy({
                        by: ['brand'],
                        where: { PrescriptionGlassesVariant: { some: { stock: { gt: 0 } } } },
                        _count: {
                            _all: true
                        }
                    });
                } else {
                    // Fetch sunglasses brands (default)
                    // @ts-ignore - brand field exists in DB
                    brandCounts = await prisma.product.groupBy({
                        by: ['brand'],
                        where: { ProductVariant: { some: { stock: { gt: 0 } } } },
                        _count: {
                            _all: true
                        }
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
                const brandImageMap = new Map(brandImages.map(b => [b.name.toLowerCase(), { imageUrl: b.imageUrl, order: b.order }]));

                const availableBrands: AvailableBrand[] = brandCounts
                    .map((item) => {
                        const brandName = item.brand?.trim() || 'FocusRobin';
                        const mapData = brandImageMap.get(brandName.toLowerCase());

                        return {
                            brand: brandName,
                            count: item._count._all,
                            imageUrl: mapData?.imageUrl || null,
                            _order: mapData?.order ?? 999
                        };
                    })
                    .sort((a, b) => {
                        // First sort by order from Brand table (if exists)
                        if (a._order !== b._order) {
                            return a._order - b._order;
                        }
                        // Then sort by count (desc) then name (asc)
                        if (b.count !== a.count) {
                            return b.count - a.count;
                        }
                        return a.brand.localeCompare(b.brand);
                    })
                    .map(({ _order, ...rest }) => rest);

                return availableBrands;
            } catch (error) {
                console.error("Error fetching available brands:", error);
                return [];
            }
        },
        [`available-brands-${type}`],
        {
            revalidate: 3600, // Cache for 1 hour
            tags: ['products', 'brands']
        }
    )();
}
