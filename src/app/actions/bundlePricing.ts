"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, safeAction } from "@/lib/security";
import { BUNDLE_PRICES, type LensBundle } from "@/lib/lensPricing";

const CACHE_TAG = "bundle-prices";

/**
 * Get all bundle prices from DB.
 * If DB is empty, seeds it with defaults from lensPricing.ts
 */
export async function getBundlePrices() {
    return safeAction(async () => {
        // No auth required for reading (used in shop) but we can restrict if needed.
        // For shop context, we often need it public.

        // Fetch all
        let prices = await prisma.lensBundlePrice.findMany();

        // Seed if empty
        if (prices.length === 0) {
            console.log("Seeding bundle prices to DB...");
            const seedData = Object.entries(BUNDLE_PRICES).map(([bundle, price]) => ({
                bundleId: bundle,
                price: price,
            }));

            // Create in transaction
            await prisma.$transaction(
                seedData.map((data) =>
                    prisma.lensBundlePrice.create({ data })
                )
            );

            // Fetch again
            prices = await prisma.lensBundlePrice.findMany();
        }

        // Convert to Record<LensBundle, number> map
        const priceMap: Partial<Record<LensBundle, number>> = {};

        prices.forEach((p) => {
            // Safe cast as we expect bundleId to match LensBundle enum
            priceMap[p.bundleId as LensBundle] = Number(p.price);
        });

        // Ensure we have all from BUNDLE_PRICES keys (merge with defaults if any missing)
        const finalMap: Record<LensBundle, number> = { ...BUNDLE_PRICES };

        // Override with DB values
        Object.entries(priceMap).forEach(([key, value]) => {
            if (value !== undefined) {
                finalMap[key as LensBundle] = value;
            }
        });

        return {
            success: true,
            data: finalMap,
        };
    });
}

/**
 * Update a specific bundle price
 */
export async function updateBundlePrice(bundleId: string, price: number) {
    return safeAction(async () => {
        try {
            const auth = await requireAuth(); // Admin only
            console.log(`[UpdateBundlePrice] User ${auth.session.user.id} (${auth.session.user.role}) updating ${bundleId} to ${price}`);

            // Check if admin
            if (auth.session.user.role !== "ADMIN") {
                console.error(`[UpdateBundlePrice] Access denied. User role: ${auth.session.user.role}`);
                throw new Error("Unauthorized: Admin access required");
            }

            await prisma.lensBundlePrice.upsert({
                where: { bundleId },
                update: { price },
                create: { bundleId, price },
            });
            console.log(`[UpdateBundlePrice] Success for ${bundleId}`);
        } catch (e: any) {
            console.error(`[UpdateBundlePrice] Error: ${e.message}`, e);
            throw e;
        }

        revalidatePath("/admin/prescription-pricing");
        revalidatePath("/shop"); // Clear shop cache too if needed

        return { success: true };
    });
}
