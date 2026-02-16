"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, safeAction } from "@/lib/security";
import { rateLimit, getIdentifier } from "@/lib/rate-limit";
import { z } from "zod";

// Validation schemas
const reviewSchema = z.object({
  orderId: z.string().min(1).max(30),
  productId: z.string().min(1).max(30),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(200),
  comment: z.string().trim().max(2000),
  images: z.array(z.string().min(1)).max(5).optional().default([]),
});

const idSchema = z.string().min(1).max(30);

/**
 * Create a review for a delivered order (User action - rate limited)
 */
export async function createReview(
  orderId: string,
  productId: string,
  rating: number,
  title: string,
  comment: string,
  images: string[] = []
) {
  return safeAction(async () => {
    const { session } = await requireAuth();
    const userId = session.user.id;

    // Rate limit review submissions
    const rateLimitResult = rateLimit(
      getIdentifier(null, userId, "review"),
      "REVIEW_SUBMIT"
    );
    if (!rateLimitResult.success) {
      return { error: `Too many reviews. Please try again in ${rateLimitResult.retryAfter} seconds.` };
    }

    // Validate input
    const validatedInput = reviewSchema.safeParse({ orderId, productId, rating, title, comment, images });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    const { orderId: oid, productId: pid, rating: r, title: t, comment: c, images: imgs } = validatedInput.data;

    // IDOR Protection: Verify order belongs to user and is delivered
    const order = await prisma.order.findFirst({
      where: {
        id: oid,
        userId, // IDOR protected
        status: "DELIVERED",
      },
    });

    if (!order) {
      return { error: "Order not found or not delivered yet" };
    }

    // Check if product is in the order
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        orderId: oid,
        productId: pid,
      },
    });

    if (!orderItem) {
      return { error: "Product not found in this order" };
    }

    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: {
        orderId: oid,
        productId: pid,
        userId, // IDOR protected
      },
    });

    if (existingReview) {
      return { error: "You have already reviewed this product from this order" };
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        rating: r,
        title: t,
        comment: c,
        images: imgs,
        productId: pid,
        orderId: oid,
        userId,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        Product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Update product average rating
    const productReviews = await prisma.review.findMany({
      where: { productId: pid },
    });

    const averageRating =
      productReviews.reduce((sum, r) => sum + r.rating, 0) /
      productReviews.length;

    await prisma.product.update({
      where: { id: pid },
      data: {
        averageRating,
        reviewCount: productReviews.length,
      },
    });

    return {
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        images: review.images,
        createdAt: review.createdAt,
        User: review.User,
        Product: review.Product,
      },
    };
  });
}

/**
 * Get reviews for a product (Public)
 */
export async function getProductReviews(productId: string) {
  try {
    const validatedId = idSchema.safeParse(productId);
    if (!validatedId.success) {
      return { error: "Invalid product ID" };
    }

    const reviews = await prisma.review.findMany({
      where: { productId: validatedId.data },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        images: review.images,
        createdAt: review.createdAt,
        User: review.User,
      })),
    };
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return {
      error: "Failed to load reviews. Please try again.",
    };
  }
}

/**
 * Get user's reviews (User action - IDOR protected)
 */
export async function getUserReviews() {
  return safeAction(async () => {
    const { session } = await requireAuth();
    const userId = session.user.id;

    // IDOR Protection: Only fetch reviews for current user
    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        Product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        Order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        images: review.images,
        createdAt: review.createdAt,
        Product: review.Product,
        Order: review.Order,
      })),
    };
  });
}

/**
 * Get all reviews (Admin only)
 */
export async function getAllReviews() {
  return safeAction(async () => {
    await requireAdmin();

    const reviews = await prisma.review.findMany({
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        Order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        images: review.images,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        User: review.User,
        Product: review.Product,
        Order: review.Order,
      })),
    };
  });
}

/**
 * Update a review (Admin only)
 */
export async function updateReview(
  reviewId: string,
  rating?: number,
  title?: string,
  comment?: string,
  images?: string[]
) {
  return safeAction(async () => {
    await requireAdmin();

    // Validate ID
    const validatedId = idSchema.safeParse(reviewId);
    if (!validatedId.success) {
      return { error: "Invalid review ID" };
    }

    // Validate optional fields
    const updateData: any = {};
    if (rating !== undefined) {
      const ratingSchema = z.number().int().min(1).max(5);
      const validatedRating = ratingSchema.safeParse(rating);
      if (!validatedRating.success) {
        return { error: "Rating must be between 1 and 5" };
      }
      updateData.rating = validatedRating.data;
    }
    if (title !== undefined) {
      updateData.title = title.trim().slice(0, 200);
    }
    if (comment !== undefined) {
      updateData.comment = comment.trim().slice(0, 2000);
    }
    if (images !== undefined) {
      updateData.images = images.slice(0, 5);
    }

    const review = await prisma.review.update({
      where: { id: validatedId.data },
      data: updateData,
      include: {
        Product: {
          select: {
            id: true,
          },
        },
      },
    });

    // Update product average rating
    const productReviews = await prisma.review.findMany({
      where: { productId: review.productId },
    });

    const averageRating =
      productReviews.reduce((sum, r) => sum + r.rating, 0) /
      productReviews.length;

    await prisma.product.update({
      where: { id: review.productId! },
      data: {
        averageRating,
        reviewCount: productReviews.length,
      },
    });

    return {
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        images: review.images,
      },
    };
  });
}

/**
 * Delete a review (Admin only)
 */
export async function deleteReview(reviewId: string) {
  return safeAction(async () => {
    await requireAdmin();

    const validatedId = idSchema.safeParse(reviewId);
    if (!validatedId.success) {
      return { error: "Invalid review ID" };
    }

    const review = await prisma.review.findUnique({
      where: { id: validatedId.data },
      select: {
        productId: true,
      },
    });

    if (!review) {
      return { error: "Review not found" };
    }

    await prisma.review.delete({
      where: { id: validatedId.data },
    });

    // Update product average rating
    const productReviews = await prisma.review.findMany({
      where: { productId: review.productId },
    });

    if (productReviews.length > 0) {
      const averageRating =
        productReviews.reduce((sum, r) => sum + r.rating, 0) /
        productReviews.length;

      await prisma.product.update({
        where: { id: review.productId! },
        data: {
          averageRating,
          reviewCount: productReviews.length,
        },
      });
    } else {
      await prisma.product.update({
        where: { id: review.productId! },
        data: {
          averageRating: 0,
          reviewCount: 0,
        },
      });
    }

    return {
      success: true,
    };
  });
}

/**
 * Get delivered orders that can be reviewed by user (User action - IDOR protected)
 */
export async function getReviewableOrders() {
  return safeAction(async () => {
    const { session } = await requireAuth();
    const userId = session.user.id;

    // IDOR Protection: Only fetch user's orders
    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: "DELIVERED",
      },
      include: {
        items: {
          include: {
            Product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        Review: {
          select: {
            id: true,
            productId: true,
          },
        },
      },
      orderBy: {
        deliveredAt: "desc",
      },
    });

    // Filter out products that already have reviews
    const reviewableItems = orders.flatMap((order) =>
      order.items
        .filter(
          (item) =>
            item.productId && // Only include items with a product (product not deleted)
            !order.Review.some((r) => r.productId === item.productId)
        )
        .map((item) => ({
          orderId: order.id,
          orderNumber: order.orderNumber,
          productId: item.productId!,
          productName: item.productName,
          productSlug: item.Product?.slug || null,
          variantName: item.variantName,
          deliveredAt: order.deliveredAt,
        }))
    );

    return {
      success: true,
      items: reviewableItems,
    };
  });
}

