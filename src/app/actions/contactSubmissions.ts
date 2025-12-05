"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, safeAction } from "@/lib/security";
import { z } from "zod";

// Validation schemas
const idSchema = z.string().min(1).max(30);

/**
 * Get all contact submissions (Admin only)
 */
export async function getContactSubmissions() {
  return safeAction(async () => {
    await requireAdmin();

    const submissions = await prisma.contactSubmission.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      submissions: submissions.map((submission) => ({
        id: submission.id,
        firstName: submission.firstName,
        lastName: submission.lastName,
        email: submission.email,
        phone: submission.phone,
        subject: submission.subject,
        message: submission.message,
        read: submission.read,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
      })),
    };
  });
}

/**
 * Mark contact submission as read (Admin only)
 */
export async function markContactSubmissionAsRead(submissionId: string) {
  return safeAction(async () => {
    await requireAdmin();

    // Validate input
    const validatedId = idSchema.safeParse(submissionId);
    if (!validatedId.success) {
      return { error: "Invalid submission ID" };
    }

    await prisma.contactSubmission.update({
      where: { id: validatedId.data },
      data: { read: true },
    });

    return { success: true };
  });
}

/**
 * Delete contact submission (Admin only)
 */
export async function deleteContactSubmission(submissionId: string) {
  return safeAction(async () => {
    await requireAdmin();

    // Validate input
    const validatedId = idSchema.safeParse(submissionId);
    if (!validatedId.success) {
      return { error: "Invalid submission ID" };
    }

    await prisma.contactSubmission.delete({
      where: { id: validatedId.data },
    });

    return { success: true };
  });
}
