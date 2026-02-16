'use server';

import { prisma } from "@/lib/prisma";

export async function getAvailableColorFamilies() {
    try {
        const families = await prisma.colorFamily.findMany({
            orderBy: { name: 'asc' },
        });

        // Convert to Record<string, string> format used by frontend (name -> hex)
        const colorPalette: Record<string, string> = {};
        families.forEach(family => {
            colorPalette[family.name] = family.hex;
        });

        return colorPalette;
    } catch (error) {
        console.error('Error fetching color families:', error);
        return {};
    }
}

export async function getColorFamilyList() {
    try {
        const families = await prisma.colorFamily.findMany({
            orderBy: { name: 'asc' },
        });
        return families;
    } catch (error) {
        console.error('Error fetching color family list:', error);
        return [];
    }
}
