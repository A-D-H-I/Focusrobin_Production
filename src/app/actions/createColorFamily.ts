'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createColorFamily(formData: FormData) {
    const name = formData.get('name') as string;
    const hex = formData.get('hex') as string;
    const imageUrl = formData.get('imageUrl') as string;

    if (!name || !hex) {
        return { success: false, error: 'Name and Color/Hex are required' };
    }

    try {
        const newFamily = await prisma.colorFamily.create({
            data: {
                name,
                hex,
                imageUrl: imageUrl || null,
            },
        });

        revalidatePath('/admin/products');
        revalidatePath('/shop'); // Update shop filters

        return { success: true, family: newFamily };
    } catch (error) {
        console.error('Error creating color family:', error);
        return { success: false, error: 'Failed to create color family. Name might already exist.' };
    }
}
