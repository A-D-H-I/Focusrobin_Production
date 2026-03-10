'use server';

import { prisma } from '@/lib/prisma';

export async function getFormSuggestions() {
    try {
        // Fetch distinct values straight from products and prescription glasses
        const products = await prisma.product.findMany({
            select: {
                frameMaterial: true,
                lensMaterial: true,
                uvProtection: true,
                glassShape: true,
            },
        });

        const rxGlasses = await prisma.prescriptionGlasses.findMany({
            select: {
                frameMaterial: true,
                lensMaterial: true,
                uvProtection: true,
                glassShape: true,
            },
        });

        const frameMaterials = new Set<string>();
        const lensMaterials = new Set<string>();
        const uvProtections = new Set<string>();
        const glassShapes = new Set<string>();

        const processItem = (item: any) => {
            if (item.frameMaterial) frameMaterials.add(item.frameMaterial.trim());
            if (item.lensMaterial) lensMaterials.add(item.lensMaterial.trim());
            if (item.uvProtection) uvProtections.add(item.uvProtection.trim());
            if (item.glassShape) glassShapes.add(item.glassShape.trim());
        };

        products.forEach(processItem);
        rxGlasses.forEach(processItem);

        return {
            success: true,
            data: {
                frameMaterials: Array.from(frameMaterials).filter(Boolean).sort(),
                lensMaterials: Array.from(lensMaterials).filter(Boolean).sort(),
                uvProtections: Array.from(uvProtections).filter(Boolean).sort(),
                glassShapes: Array.from(glassShapes).filter(Boolean).sort(),
            },
        };
    } catch (error) {
        console.error('Error fetching form suggestions:', error);
        return {
            success: false,
            data: {
                frameMaterials: [],
                lensMaterials: [],
                uvProtections: [],
                glassShapes: [],
            },
        };
    }
}
