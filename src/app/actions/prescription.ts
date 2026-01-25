"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, safeAction } from "@/lib/security";
import type { FullPrescriptionData } from "@/app/shop/[slug]/prescription/PrescriptionFlow";

/**
 * Save prescription data for logged-in user
 * NOTE: Only ONE prescription per user (shared across all products)
 * productSlug is stored for reference but doesn't affect uniqueness
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

    console.log('[saveUserPrescription] Saving prescription (one per user, shared across products):', {
      userId,
      productSlug,
      hasPrism,
      odPrismHorizontal: od.prismHorizontal,
      odPrismHorizontalBase: od.prismHorizontalBase,
      odPrismVertical: od.prismVertical,
      odPrismVerticalBase: od.prismVerticalBase,
      osPrismHorizontal: os.prismHorizontal,
      osPrismHorizontalBase: os.prismHorizontalBase,
      osPrismVertical: os.prismVertical,
      osPrismVerticalBase: os.prismVerticalBase,
    });

    // Create or update prescription (one per user, productSlug is just for reference)
    const prescription = await prisma.userPrescription.upsert({
      where: {
        userId: userId, // Unique constraint is on userId only
      },
      create: {
        userId,
        productSlug: productSlug || null, // Optional: last product used
        odSph: od.sph,
        odCyl: od.cyl,
        odAxis: od.axis,
        osSph: os.sph,
        osCyl: os.cyl,
        osAxis: os.axis,
        pd,
        pdOd: pdOd || null,
        pdOs: pdOs || null,
        hasTwoPDs,
        hasPrism,
        odPrismHorizontal: od.prismHorizontal || null,
        odPrismHorizontalBase: od.prismHorizontalBase || null,
        odPrismVertical: od.prismVertical || null,
        odPrismVerticalBase: od.prismVerticalBase || null,
        osPrismHorizontal: os.prismHorizontal || null,
        osPrismHorizontalBase: os.prismHorizontalBase || null,
        osPrismVertical: os.prismVertical || null,
        osPrismVerticalBase: os.prismVerticalBase || null,
        prescriptionImageUrl: prescriptionImageUrl || null,
        // NOTE: Lens configuration fields are required by schema but NOT used when loading
        // We save defaults here - actual lens config is stored in product-specific localStorage
        lensType: "CLEAR", // Default - not loaded back
        lensIndex: "1.56", // Default - not loaded back
        coating: "UC", // Default - not loaded back
        tintType: null,
        tintColor: null,
        tintShadePercent: null,
        tintRecipe: null,
        photochromicColor: null,
        polarizedColor: null,
        frameType: rxConfig?.frameType || "FULL_FRAME", // Only frameType is used (for edging fee, auto-detected per product)
        lensesPair: rxPriceBreakdown?.lensesPair ? rxPriceBreakdown.lensesPair : null,
        edgingFee: rxPriceBreakdown?.edgingFee ? rxPriceBreakdown.edgingFee : null,
        profit: rxPriceBreakdown?.profit ? rxPriceBreakdown.profit : null,
        rxRetailNet: rxPriceBreakdown?.rxRetailNet ? rxPriceBreakdown.rxRetailNet : null,
        totalNet: rxPriceBreakdown?.totalNet ? rxPriceBreakdown.totalNet : null,
      },
      update: {
        productSlug: productSlug || null, // Update last product reference
        odSph: od.sph,
        odCyl: od.cyl,
        odAxis: od.axis,
        osSph: os.sph,
        osCyl: os.cyl,
        osAxis: os.axis,
        pd,
        pdOd: pdOd || null,
        pdOs: pdOs || null,
        hasTwoPDs,
        hasPrism,
        odPrismHorizontal: od.prismHorizontal || null,
        odPrismHorizontalBase: od.prismHorizontalBase || null,
        odPrismVertical: od.prismVertical || null,
        odPrismVerticalBase: od.prismVerticalBase || null,
        osPrismHorizontal: os.prismHorizontal || null,
        osPrismHorizontalBase: os.prismHorizontalBase || null,
        osPrismVertical: os.prismVertical || null,
        osPrismVerticalBase: os.prismVerticalBase || null,
        prescriptionImageUrl: prescriptionImageUrl || null,
        // NOTE: Lens configuration fields are required by schema but NOT used when loading
        // We save defaults here - actual lens config is stored in product-specific localStorage
        lensType: "CLEAR", // Default - not loaded back
        lensIndex: "1.56", // Default - not loaded back
        coating: "UC", // Default - not loaded back
        tintType: null,
        tintColor: null,
        tintShadePercent: null,
        tintRecipe: null,
        photochromicColor: null,
        polarizedColor: null,
        frameType: rxConfig?.frameType || "FULL_FRAME", // Only frameType is used (for edging fee, auto-detected per product)
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
 * NOTE: Returns the single prescription for the user (shared across all products)
 * productSlug parameter is kept for backward compatibility but not used in query
 */
export async function getUserPrescription(productSlug: string) {
  return safeAction(async () => {
    const { session } = await requireAuth();
    const userId = (session.user as any)?.id;

    if (!userId) {
      return { error: "User not authenticated" };
    }

    // Get the single prescription for this user (shared across all products)
    const prescription = await prisma.userPrescription.findUnique({
      where: {
        userId: userId, // Unique constraint is on userId only
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
        prismHorizontal: prescription.odPrismHorizontal || undefined,
        prismHorizontalBase: prescription.odPrismHorizontalBase || undefined,
        prismVertical: prescription.odPrismVertical || undefined,
        prismVerticalBase: prescription.odPrismVerticalBase || undefined,
      },
      os: {
        sph: prescription.osSph,
        cyl: prescription.osCyl,
        axis: prescription.osAxis,
        prismHorizontal: prescription.osPrismHorizontal || undefined,
        prismHorizontalBase: prescription.osPrismHorizontalBase || undefined,
        prismVertical: prescription.osPrismVertical || undefined,
        prismVerticalBase: prescription.osPrismVerticalBase || undefined,
      },
      pd: prescription.pd,
      pdOd: prescription.pdOd || undefined,
      pdOs: prescription.pdOs || undefined,
      hasTwoPDs: prescription.hasTwoPDs,
      hasPrism: prescription.hasPrism,
      prescriptionImageUrl: prescription.prescriptionImageUrl || undefined,
      // NOTE: Lens configuration is NOT loaded from database - it's product-specific
      // Lens config should be loaded from localStorage/sessionStorage per product
      // Only frameType is loaded (for edging fee calculation, but will be auto-detected per product)
      rxConfig: undefined, // Don't load lens config from DB - it's product-specific
      rxPriceBreakdown: undefined, // Price breakdown is calculated dynamically, not stored
    };

    console.log('[getUserPrescription] Loaded prescription from DB:', {
      hasPrism: fullData.hasPrism,
      odPrismHorizontal: fullData.od.prismHorizontal,
      odPrismHorizontalBase: fullData.od.prismHorizontalBase,
      osPrismHorizontal: fullData.os.prismHorizontal,
      osPrismHorizontalBase: fullData.os.prismHorizontalBase,
    });

    return { prescription: fullData };
  });
}

