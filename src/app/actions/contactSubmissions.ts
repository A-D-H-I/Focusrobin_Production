"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getContactSubmissions() {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return { error: "Only admins can view contact submissions" };
    }

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
  } catch (error) {
    console.error("Error fetching contact submissions:", error);
    return {
      error: "Failed to load contact submissions. Please try again.",
    };
  }
}

export async function markContactSubmissionAsRead(submissionId: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return { error: "Only admins can mark submissions as read" };
    }

    await prisma.contactSubmission.update({
      where: { id: submissionId },
      data: { read: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking submission as read:", error);
    return {
      error: "Failed to update submission. Please try again.",
    };
  }
}

export async function deleteContactSubmission(submissionId: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return { error: "Only admins can delete submissions" };
    }

    await prisma.contactSubmission.delete({
      where: { id: submissionId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting submission:", error);
    return {
      error: "Failed to delete submission. Please try again.",
    };
  }
}

