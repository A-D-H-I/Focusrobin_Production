"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";

// Validation schemas
const navbarSettingsSchema = z.object({
  iconColorNotScrolled: z.string().trim().min(1).max(50),
  logoColorNotScrolled: z.string().trim().min(1).max(50),
});

/**
 * Get current navbar settings (Public - no auth required)
 */
export async function getNavbarSettings() {
  try {
    // Get the active settings (only one should be active at a time)
    const settings = await prisma.navbarSettings.findFirst({
      where: { isActive: true },
    });

    if (!settings) {
      return {
        success: true,
        settings: {
          iconColorNotScrolled: "white",
          logoColorNotScrolled: "white",
        },
      };
    }

    return {
      success: true,
      settings: {
        iconColorNotScrolled: settings.iconColorNotScrolled,
        logoColorNotScrolled: settings.logoColorNotScrolled,
      },
    };
  } catch (error: any) {
    console.error("Error fetching navbar settings:", error);
    if (error?.message?.includes("navbarSettings") || error?.code === "P2001") {
      return {
        success: true,
        settings: {
          iconColorNotScrolled: "white",
          logoColorNotScrolled: "white",
        },
      };
    }
    return {
      error: "Failed to load navbar settings. Please try again.",
    };
  }
}

/**
 * Update navbar settings (Admin only)
 */
export async function updateNavbarSettings(
  iconColorNotScrolled: string,
  logoColorNotScrolled: string
) {
  return safeAction(async () => {
    await requireAdmin();

    // Validate input
    const validatedInput = navbarSettingsSchema.safeParse({ iconColorNotScrolled, logoColorNotScrolled });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    // Deactivate all existing settings
    await prisma.navbarSettings.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new active settings
    const settings = await prisma.navbarSettings.create({
      data: {
        iconColorNotScrolled: validatedInput.data.iconColorNotScrolled,
        logoColorNotScrolled: validatedInput.data.logoColorNotScrolled,
        isActive: true,
      },
    });

    return {
      success: true,
      settings: {
        iconColorNotScrolled: settings.iconColorNotScrolled,
        logoColorNotScrolled: settings.logoColorNotScrolled,
      },
    };
  });
}
