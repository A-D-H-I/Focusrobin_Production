"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Get current navbar settings
 */
export async function getNavbarSettings() {
  try {
    // Get the active settings (only one should be active at a time)
    const settings = await prisma.navbarSettings.findFirst({
      where: { isActive: true },
    });

    if (!settings) {
      // Return default settings if none exist
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
    // If table doesn't exist, return defaults
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
      error: error?.message || "Failed to load navbar settings. Please try again.",
    };
  }
}

/**
 * Update navbar settings (admin only)
 */
export async function updateNavbarSettings(
  iconColorNotScrolled: string,
  logoColorNotScrolled: string
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return { error: "Only admins can update navbar settings" };
    }

    // Deactivate all existing settings
    await prisma.navbarSettings.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new active settings
    const settings = await prisma.navbarSettings.create({
      data: {
        iconColorNotScrolled,
        logoColorNotScrolled,
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
  } catch (error: any) {
    console.error("Error updating navbar settings:", error);
    // Check if it's a Prisma client issue
    if (error?.message?.includes("navbarSettings") || error?.code === "P2001") {
      return {
        error: "Database table not found. Please restart your development server after running the migration.",
      };
    }
    return {
      error: error?.message || "Failed to update navbar settings. Please try again.",
    };
  }
}

