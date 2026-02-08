'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";

// Validation schemas
const shopBannerSchema = z.object({
    category: z.string().trim().min(1).max(50),
    imageUrl: z.string().url().max(2048),
    alt: z.string().trim().min(1).max(200),
    link: z.string().trim().max(500).optional().default(''),
    isActive: z.boolean().optional().default(false),
});

const idSchema = z.string().min(1).max(30);

/**
 * Create a prescription shop banner (Admin only)
 */
export async function createPrescriptionShopBanner(formData: FormData) {
    return safeAction(async () => {
        await requireAdmin();

        // @ts-ignore
        if (!prisma.prescriptionShopBanner || typeof prisma.prescriptionShopBanner.create !== 'function') {
            return { error: 'PrescriptionShopBanner model not available. Please regenerate Prisma client.' };
        }

        const category = formData.get('category') as string;
        const imageUrl = formData.get('imageUrl') as string;
        const alt = formData.get('alt') as string;
        const link = formData.get('link') as string || '';
        const isActive = formData.get('isActive') === 'true';

        // Validate input
        const validatedInput = shopBannerSchema.safeParse({ category, imageUrl, alt, link, isActive });
        if (!validatedInput.success) {
            return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
        }

        // Check if banner already exists
        // @ts-ignore
        const existing = await prisma.prescriptionShopBanner.findUnique({
            where: { category: validatedInput.data.category },
        });

        if (existing) {
            return { error: 'Banner already exists for this category. Please update the existing one.' };
        }

        // @ts-ignore
        const banner = await prisma.prescriptionShopBanner.create({
            data: {
                category: validatedInput.data.category,
                imageUrl: validatedInput.data.imageUrl,
                alt: validatedInput.data.alt,
                link: validatedInput.data.link || null,
                isActive: validatedInput.data.isActive,
            },
        });

        revalidatePath('/shop/prescription-glasses/men');
        revalidatePath('/shop/prescription-glasses/women');
        revalidatePath('/shop/prescription-glasses/kids');
        revalidatePath('/shop/prescription-glasses/unisex');
        revalidatePath('/admin/prescription-shop-banners');

        return { success: true, bannerId: banner.id };
    });
}

/**
 * Update a prescription shop banner (Admin only)
 */
export async function updatePrescriptionShopBanner(formData: FormData) {
    return safeAction(async () => {
        await requireAdmin();

        // @ts-ignore
        if (!prisma.prescriptionShopBanner || typeof prisma.prescriptionShopBanner.update !== 'function') {
            return { error: 'PrescriptionShopBanner model not available. Please regenerate Prisma client.' };
        }

        const id = formData.get('id') as string;
        const validatedId = idSchema.safeParse(id);
        if (!validatedId.success) {
            return { error: "Invalid banner ID" };
        }

        const category = formData.get('category') as string;
        const imageUrl = formData.get('imageUrl') as string;
        const alt = formData.get('alt') as string;
        const link = formData.get('link') as string || '';
        const isActive = formData.get('isActive') === 'true';

        // Validate input
        const validatedInput = shopBannerSchema.safeParse({ category, imageUrl, alt, link, isActive });
        if (!validatedInput.success) {
            return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
        }

        // @ts-ignore
        const banner = await prisma.prescriptionShopBanner.update({
            where: { id: validatedId.data },
            data: {
                category: validatedInput.data.category,
                imageUrl: validatedInput.data.imageUrl,
                alt: validatedInput.data.alt,
                link: validatedInput.data.link || null,
                isActive: validatedInput.data.isActive,
            },
        });

        revalidatePath('/shop/prescription-glasses/men');
        revalidatePath('/shop/prescription-glasses/women');
        revalidatePath('/shop/prescription-glasses/kids');
        revalidatePath('/shop/prescription-glasses/unisex');
        revalidatePath('/admin/prescription-shop-banners');

        return { success: true, bannerId: banner.id };
    });
}

/**
 * Delete a prescription shop banner (Admin only)
 */
export async function deletePrescriptionShopBanner(formData: FormData) {
    return safeAction(async () => {
        await requireAdmin();

        // @ts-ignore
        if (!prisma.prescriptionShopBanner || typeof prisma.prescriptionShopBanner.delete !== 'function') {
            return { error: 'PrescriptionShopBanner model not available. Please regenerate Prisma client.' };
        }

        const id = formData.get('id') as string;
        const validatedId = idSchema.safeParse(id);
        if (!validatedId.success) {
            return { error: "Invalid banner ID" };
        }

        // @ts-ignore
        await prisma.prescriptionShopBanner.delete({
            where: { id: validatedId.data },
        });

        revalidatePath('/shop/prescription-glasses/men');
        revalidatePath('/shop/prescription-glasses/women');
        revalidatePath('/shop/prescription-glasses/kids');
        revalidatePath('/shop/prescription-glasses/unisex');
        revalidatePath('/admin/prescription-shop-banners');

        return { success: true };
    });
}
