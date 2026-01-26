"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, safeAction } from "@/lib/security";
import type { FullPrescriptionData } from "@/app/shop/[slug]/prescription/PrescriptionFlow";

/**
 * Save prescription data for logged-in user
 * NOTE: Only ONE prescription per user (shared across all products)
 * productSlug parameter is kept for backward compatibility but NOT saved to database
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

    // Extract prescription data (ONLY prescription values, NOT lens config or price breakdown)
    const {
      od,
      os,
      pd,
      pdOd,
      pdOs,
      hasTwoPDs,
      hasPrism,
      prescriptionImageUrl,
      // NOTE: rxConfig and rxPriceBreakdown are NOT saved to database - they are product-specific
      // and stored in localStorage/sessionStorage per product
    } = prescriptionData;

    console.log('[saveUserPrescription] Saving prescription (one per user, shared across products):', {
      userId,
      hasTwoPDs,
      pd: pd || 'empty',
      pdOd: pdOd || 'empty',
      pdOs: pdOs || 'empty',
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
        // NOTE: productSlug is NOT saved - prescription is shared across all products
        odSph: od.sph,
        odCyl: od.cyl,
        odAxis: od.axis,
        osSph: os.sph,
        osCyl: os.cyl,
        osAxis: os.axis,
        pd: pd || '',
        pdOd: (hasTwoPDs && pdOd) ? pdOd : null,
        pdOs: (hasTwoPDs && pdOs) ? pdOs : null,
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
        // NOTE: Lens configuration and price breakdown are NOT saved to database
        // They are product-specific and stored in localStorage/sessionStorage per product
      },
      update: {
        // NOTE: productSlug is NOT saved - prescription is shared across all products
        odSph: od.sph,
        odCyl: od.cyl,
        odAxis: od.axis,
        osSph: os.sph,
        osCyl: os.cyl,
        osAxis: os.axis,
        pd: pd || '',
        pdOd: (hasTwoPDs && pdOd) ? pdOd : null,
        pdOs: (hasTwoPDs && pdOs) ? pdOs : null,
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
        // NOTE: Lens configuration and price breakdown are NOT saved to database
        // They are product-specific and stored in localStorage/sessionStorage per product
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
      pd: prescription.pd || '',
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
      hasTwoPDs: fullData.hasTwoPDs,
      pd: fullData.pd || 'empty',
      pdOd: fullData.pdOd || 'empty',
      pdOs: fullData.pdOs || 'empty',
      hasPrism: fullData.hasPrism,
      odPrismHorizontal: fullData.od.prismHorizontal,
      odPrismHorizontalBase: fullData.od.prismHorizontalBase,
      osPrismHorizontal: fullData.os.prismHorizontal,
      osPrismHorizontalBase: fullData.os.prismHorizontalBase,
    });

    return { prescription: fullData };
  });
}

