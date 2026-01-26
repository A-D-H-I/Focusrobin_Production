"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, safeAction } from "@/lib/security";
import { clearPricingCache } from "@/lib/pricing/syncDbPricing";

// Get all prescription pricing data
export async function getPrescriptionPricing() {
  return safeAction(async () => {
    await requireAuth();

    const [lensPrices, tintFees, edgingFees, profit] = await Promise.all([
      prisma.prescriptionLensPrice.findMany({
        orderBy: [
          { lensType: "asc" },
          { lensIndex: "asc" },
          { coating: "asc" },
        ],
      }),
      prisma.prescriptionTintFee.findMany({
        orderBy: { tintType: "asc" },
      }),
      prisma.prescriptionEdgingFee.findMany({
        orderBy: { frameType: "asc" },
      }),
      prisma.prescriptionProfit.findFirst({
        where: { isActive: true },
      }),
    ]);

    // Convert Decimal values to numbers for JSON serialization
    return {
      success: true,
      data: {
        lensPrices: lensPrices.map((lp) => ({
          ...lp,
          price: Number(lp.price),
        })),
        tintFees: tintFees.map((tf) => ({
          ...tf,
          price: Number(tf.price),
        })),
        edgingFees: edgingFees.map((ef) => ({
          ...ef,
          price: Number(ef.price),
        })),
        profit: profit?.profit ? Number(profit.profit) : null,
      },
    };
  });
}

// Update lens price
export async function updateLensPrice(
  id: string,
  price: number
) {
  return safeAction(async () => {
    await requireAuth();

    const updated = await prisma.prescriptionLensPrice.update({
      where: { id },
      data: { price },
    });

    clearPricingCache(); // Clear cache so new prices are loaded
    revalidatePath("/admin/prescription-pricing");
    return { success: true, data: updated };
  });
}

// Update tint fee
export async function updateTintFee(
  id: string,
  price: number
) {
  return safeAction(async () => {
    await requireAuth();

    const updated = await prisma.prescriptionTintFee.update({
      where: { id },
      data: { price },
    });

    clearPricingCache(); // Clear cache so new prices are loaded
    revalidatePath("/admin/prescription-pricing");
    return { success: true, data: updated };
  });
}

// Update edging fee
export async function updateEdgingFee(
  id: string,
  price: number
) {
  return safeAction(async () => {
    await requireAuth();

    const updated = await prisma.prescriptionEdgingFee.update({
      where: { id },
      data: { price },
    });

    clearPricingCache(); // Clear cache so new prices are loaded
    revalidatePath("/admin/prescription-pricing");
    return { success: true, data: updated };
  });
}

// Update fixed profit
export async function updateFixedProfit(profit: number) {
  return safeAction(async () => {
    await requireAuth();

    // Get or create profit record
    const existing = await prisma.prescriptionProfit.findFirst({
      where: { isActive: true },
    });

    if (existing) {
      await prisma.prescriptionProfit.update({
        where: { id: existing.id },
        data: { profit },
      });
    } else {
      // Deactivate all existing and create new
      await prisma.prescriptionProfit.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
      await prisma.prescriptionProfit.create({
        data: { profit, isActive: true },
      });
    }

    clearPricingCache(); // Clear cache so new profit is loaded
    revalidatePath("/admin/prescription-pricing");
    return { success: true };
  });
}

