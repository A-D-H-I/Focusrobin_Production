'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const SplitBannerSchema = z.object({
    id: z.string().optional(),
    sectionKey: z.string(),
    title: z.string().min(1, "Title is required"),
    leftImageUrl: z.string().min(1, "Left image is required"),
    leftLink: z.string().min(1, "Left link is required"),
    leftButtonText: z.string().min(1, "Left button text is required"),
    rightImageUrl: z.string().min(1, "Right image is required"),
    rightLink: z.string().min(1, "Right link is required"),
    rightButtonText: z.string().min(1, "Right button text is required"),
    isActive: z.boolean().default(true),
});

export async function getSplitBanner(sectionKey: string) {
    try {
        // @ts-ignore
        if (!prisma.splitBanner) return null;

        // @ts-ignore
        const banner = await prisma.splitBanner.findUnique({
            where: { sectionKey },
        });
        return banner;
    } catch (error) {
        console.error('Error fetching split banner:', error);
        return null;
    }
}

export async function createSplitBanner(formData: FormData) {
    try {
        const rawData = {
            sectionKey: formData.get('sectionKey'),
            title: formData.get('title'),
            leftImageUrl: formData.get('leftImageUrl'),
            leftLink: formData.get('leftLink'),
            leftButtonText: formData.get('leftButtonText'),
            rightImageUrl: formData.get('rightImageUrl'),
            rightLink: formData.get('rightLink'),
            rightButtonText: formData.get('rightButtonText'),
            isActive: formData.get('isActive') === 'true',
        };

        const validatedData = SplitBannerSchema.parse(rawData);

        // @ts-ignore
        await prisma.splitBanner.create({
            data: validatedData,
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error creating split banner:', error);
        return { error: 'Failed to create split banner' };
    }
}

export async function updateSplitBanner(formData: FormData) {
    try {
        const rawData = {
            id: formData.get('id'),
            sectionKey: formData.get('sectionKey'),
            title: formData.get('title'),
            leftImageUrl: formData.get('leftImageUrl'),
            leftLink: formData.get('leftLink'),
            leftButtonText: formData.get('leftButtonText'),
            rightImageUrl: formData.get('rightImageUrl'),
            rightLink: formData.get('rightLink'),
            rightButtonText: formData.get('rightButtonText'),
            isActive: formData.get('isActive') === 'true',
        };

        const validatedData = SplitBannerSchema.parse(rawData);

        if (!validatedData.id) return { error: 'ID is required for update' };

        // @ts-ignore
        await prisma.splitBanner.update({
            where: { id: validatedData.id },
            data: {
                title: validatedData.title,
                leftImageUrl: validatedData.leftImageUrl,
                leftLink: validatedData.leftLink,
                leftButtonText: validatedData.leftButtonText,
                rightImageUrl: validatedData.rightImageUrl,
                rightLink: validatedData.rightLink,
                rightButtonText: validatedData.rightButtonText,
                isActive: validatedData.isActive,
                // sectionKey is usually not updated, but we can if needed
            },
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error updating split banner:', error);
        return { error: 'Failed to update split banner' };
    }
}

export async function deleteSplitBanner(formData: FormData) {
    try {
        const id = formData.get('id') as string;
        if (!id) return { error: 'ID is required' };

        // @ts-ignore
        await prisma.splitBanner.delete({
            where: { id },
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error deleting split banner:', error);
        return { error: 'Failed to delete split banner' };
    }
}
