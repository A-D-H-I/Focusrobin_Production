"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { safeAction } from "@/lib/security";

const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address").min(1).max(255),
});

/**
 * Subscribe to newsletter
 */
export async function subscribeNewsletter(formData: FormData) {
  return safeAction(async () => {
    const email = formData.get("email") as string;

    if (!email) {
      return { error: "Email is required" };
    }

    // Validate email
    const validation = newsletterSchema.safeParse({ email });
    if (!validation.success) {
      return { error: validation.error.errors[0].message };
    }

    const validatedEmail = validation.data.email.toLowerCase().trim();

    try {
      // Check if NewsletterSubscription model exists
      // @ts-ignore - Model may not exist until Prisma client is regenerated
      if (!prisma.newsletterSubscription || typeof prisma.newsletterSubscription.findUnique !== 'function') {
        console.error("[Newsletter] NewsletterSubscription model not available. Please run: npx prisma generate");
        return { error: "Newsletter service is temporarily unavailable. Please try again later." };
      }

      // Check if email already exists
      // @ts-ignore - Model may not exist until Prisma client is regenerated
      const existing = await prisma.newsletterSubscription.findUnique({
        where: { email: validatedEmail },
      });

      if (existing) {
        if (existing.isActive) {
          return { success: true, message: "You're already subscribed to our newsletter!" };
        } else {
          // Reactivate subscription
          // @ts-ignore - Model may not exist until Prisma client is regenerated
          await prisma.newsletterSubscription.update({
            where: { email: validatedEmail },
            data: { isActive: true, subscribedAt: new Date() },
          });
          return { success: true, message: "Welcome back! You've been resubscribed to our newsletter." };
        }
      }

      // Create new subscription
      // @ts-ignore - Model may not exist until Prisma client is regenerated
      await prisma.newsletterSubscription.create({
        data: {
          email: validatedEmail,
          isActive: true,
        },
      });

      return { success: true, message: "Thank you for subscribing to our newsletter!" };
    } catch (error: any) {
      console.error("[Newsletter] Subscription error:", error);
      
      // Handle unique constraint violation
      if (error.code === "P2002") {
        return { error: "This email is already subscribed." };
      }

      // Handle Prisma errors
      if (error.message?.includes("does not exist") || error.message?.includes("Unknown model")) {
        console.error("[Newsletter] Database model not found. Run: npx prisma generate");
        return { error: "Newsletter service is being updated. Please try again in a moment." };
      }

      return { error: "Something went wrong. Please try again later." };
    }
  });
}

