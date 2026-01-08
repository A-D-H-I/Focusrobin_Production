"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, safeAction } from "@/lib/security";
import type { FullPrescriptionData } from "@/app/shop/[slug]/prescription/PrescriptionFlow";

/**
 * Save prescription data for logged-in user
 */
export async function saveUserPrescription(
  productSlug: string,
  prescriptionData: FullPrescriptionData
) {
  return safeAction(async () => {
    const { session } = await requireAuth();
    const userId = (session.user as any)?.id;

    if (!userId) {
      return { error: "User not authenticated" };
    }

    // Extract prescription data
    const {
      od,
      os,
      pd,
      pdOd,
      pdOs,
      hasTwoPDs,
      hasPrism,
      prescriptionImageUrl,
      rxConfig,
      rxPriceBreakdown,
    } = prescriptionData;

    // Create or update prescription
    const prescription = await prisma.userPrescription.upsert({
      where: {
        userId_productSlug: {
          userId,
          productSlug,
        },
      },
      create: {
        userId,
        productSlug,
        odSph: od.sph,
        odCyl: od.cyl,
        odAxis: od.axis,
        osSph: os.sph,
        osCyl: os.cyl,
        osAxis: os.axis,
        pd,
        // TODO: Add these fields to Prisma schema: pdOd String?, pdOs String?, prescriptionImageUrl String?
        // pdOd: pdOd || null,
        // pdOs: pdOs || null,
        // prescriptionImageUrl: prescriptionImageUrl || null, // S3 URL for uploaded prescription image
        hasTwoPDs,
        hasPrism,
        lensType: rxConfig.lensType,
        lensIndex: rxConfig.lensIndex,
        coating: rxConfig.coating,
        tintType: rxConfig.tintType || null,
        tintColor: rxConfig.tintColor || null,
        tintShadePercent: rxConfig.tintShadePercent || null,
        tintRecipe: rxConfig.tintRecipe || null,
        photochromicColor: rxConfig.photochromicColor || null,
        polarizedColor: rxConfig.polarizedColor || null,
        frameType: rxConfig.frameType,
        lensesPair: rxPriceBreakdown?.lensesPair ? rxPriceBreakdown.lensesPair : null,
        edgingFee: rxPriceBreakdown?.edgingFee ? rxPriceBreakdown.edgingFee : null,
        profit: rxPriceBreakdown?.profit ? rxPriceBreakdown.profit : null,
        rxRetailNet: rxPriceBreakdown?.rxRetailNet ? rxPriceBreakdown.rxRetailNet : null,
        totalNet: rxPriceBreakdown?.totalNet ? rxPriceBreakdown.totalNet : null,
      },
      update: {
        odSph: od.sph,
        odCyl: od.cyl,
        odAxis: od.axis,
        osSph: os.sph,
        osCyl: os.cyl,
        osAxis: os.axis,
        pd,
        // TODO: Add these fields to Prisma schema: pdOd String?, pdOs String?, prescriptionImageUrl String?
        // pdOd: pdOd || null,
        // pdOs: pdOs || null,
        // prescriptionImageUrl: prescriptionImageUrl || null, // S3 URL for uploaded prescription image
        hasTwoPDs,
        hasPrism,
        lensType: rxConfig.lensType,
        lensIndex: rxConfig.lensIndex,
        coating: rxConfig.coating,
        tintType: rxConfig.tintType || null,
        tintColor: rxConfig.tintColor || null,
        tintShadePercent: rxConfig.tintShadePercent || null,
        tintRecipe: rxConfig.tintRecipe || null,
        photochromicColor: rxConfig.photochromicColor || null,
        polarizedColor: rxConfig.polarizedColor || null,
        frameType: rxConfig.frameType,
        lensesPair: rxPriceBreakdown?.lensesPair ? rxPriceBreakdown.lensesPair : null,
        edgingFee: rxPriceBreakdown?.edgingFee ? rxPriceBreakdown.edgingFee : null,
        profit: rxPriceBreakdown?.profit ? rxPriceBreakdown.profit : null,
        rxRetailNet: rxPriceBreakdown?.rxRetailNet ? rxPriceBreakdown.rxRetailNet : null,
        totalNet: rxPriceBreakdown?.totalNet ? rxPriceBreakdown.totalNet : null,
      },
    });

    return { success: true, prescription };
  });
}

/**
 * Get saved prescription for logged-in user
 */
export async function getUserPrescription(productSlug: string) {
  return safeAction(async () => {
    const { session } = await requireAuth();
    const userId = (session.user as any)?.id;

    if (!userId) {
      return { error: "User not authenticated" };
    }

    const prescription = await prisma.userPrescription.findUnique({
      where: {
        userId_productSlug: {
          userId,
          productSlug,
        },
      },
    });

    if (!prescription) {
      return { prescription: null };
    }

    // Convert database format to FullPrescriptionData format
    const fullData: FullPrescriptionData = {
      od: {
        sph: prescription.odSph,
        cyl: prescription.odCyl,
        axis: prescription.odAxis,
      },
      os: {
        sph: prescription.osSph,
        cyl: prescription.osCyl,
        axis: prescription.osAxis,
      },
      pd: prescription.pd,
      hasTwoPDs: prescription.hasTwoPDs,
      hasPrism: prescription.hasPrism,
      rxConfig: {
        lensType: prescription.lensType as any,
        lensIndex: prescription.lensIndex as any,
        coating: prescription.coating as any,
        tintType: prescription.tintType as any,
        tintColor: prescription.tintColor as any,
        tintShadePercent: prescription.tintShadePercent || undefined,
        tintRecipe: prescription.tintRecipe || undefined,
        photochromicColor: prescription.photochromicColor as any,
        polarizedColor: prescription.polarizedColor as any,
        frameType: prescription.frameType as any,
      },
      rxPriceBreakdown: prescription.lensesPair
        ? {
            lensesPair: Number(prescription.lensesPair),
            edgingFee: Number(prescription.edgingFee || 0),
            profit: Number(prescription.profit || 0),
            rxRetailNet: Number(prescription.rxRetailNet || 0),
            totalNet: Number(prescription.totalNet || 0),
          }
        : undefined,
    };

    return { prescription: fullData };
  });
}

