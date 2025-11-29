"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Create a review for a delivered order
 */
export async function createReview(
  orderId: string,
  productId: string,
  rating: number,
  title: string,
  comment: string,
  images: string[] = []
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userId = (session.user as any)?.id;
    if (!userId) {
      return { error: "User ID not found" };
    }

    // Verify order belongs to user and is delivered
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        status: "DELIVERED",
      },
    });

    if (!order) {
      return { error: "Order not found or not delivered yet" };
    }

    // Check if product is in the order
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        orderId,
        productId,
      },
    });

    if (!orderItem) {
      return { error: "Product not found in this order" };
    }

    // Check if review already exists for this order and product
    const existingReview = await prisma.review.findFirst({
      where: {
        orderId,
        productId,
        userId,
      },
    });

    if (existingReview) {
      return { error: "You have already reviewed this product from this order" };
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        rating,
        title,
        comment,
        images,
        productId,
        orderId: orderId || null, // Allow null if orderId is not provided
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

    // Update product average rating and review count
    const productReviews = await prisma.review.findMany({
      where: { productId },
    });

    const averageRating =
      productReviews.reduce((sum, r) => sum + r.rating, 0) /
      productReviews.length;

    await prisma.product.update({
      where: { id: productId },
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
  } catch (error: any) {
    console.error("Error creating review:", error);
    // Return more specific error message
    const errorMessage = error?.message || "Failed to create review. Please try again.";
    return {
      error: errorMessage.includes("Unique constraint") 
        ? "You have already reviewed this product from this order"
        : errorMessage.includes("Foreign key constraint")
        ? "Invalid order or product. Please refresh and try again."
        : errorMessage,
    };
  }
}

/**
 * Get reviews for a product
 */
export async function getProductReviews(productId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId },
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
 * Get user's reviews
 */
export async function getUserReviews() {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userId = (session.user as any)?.id;
    if (!userId) {
      return { error: "User ID not found" };
    }

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
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return {
      error: "Failed to load reviews. Please try again.",
    };
  }
}

/**
 * Get all reviews (admin only)
 */
export async function getAllReviews() {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return { error: "Only admins can view all reviews" };
    }

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
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    return {
      error: "Failed to load reviews. Please try again.",
    };
  }
}

/**
 * Update a review (admin only)
 */
export async function updateReview(
  reviewId: string,
  rating?: number,
  title?: string,
  comment?: string,
  images?: string[]
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return { error: "Only admins can update reviews" };
    }

    const updateData: any = {};
    if (rating !== undefined) updateData.rating = rating;
    if (title !== undefined) updateData.title = title;
    if (comment !== undefined) updateData.comment = comment;
    if (images !== undefined) updateData.images = images;

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        Product: {
          select: {
            id: true,
          },
        },
      },
    });

    // Update product average rating and review count
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
  } catch (error) {
    console.error("Error updating review:", error);
    return {
      error: "Failed to update review. Please try again.",
    };
  }
}

/**
 * Delete a review (admin only)
 */
export async function deleteReview(reviewId: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return { error: "Only admins can delete reviews" };
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        productId: true,
      },
    });

    if (!review) {
      return { error: "Review not found" };
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Update product average rating and review count
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
  } catch (error) {
    console.error("Error deleting review:", error);
    return {
      error: "Failed to delete review. Please try again.",
    };
  }
}

/**
 * Get delivered orders that can be reviewed by user
 */
export async function getReviewableOrders() {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userId = (session.user as any)?.id;
    if (!userId) {
      return { error: "User ID not found" };
    }

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
            !order.Review.some((r) => r.productId === item.productId)
        )
        .map((item) => ({
          orderId: order.id,
          orderNumber: order.orderNumber,
          productId: item.productId,
          productName: item.productName,
          productSlug: item.Product.slug,
          variantName: item.variantName,
          deliveredAt: order.deliveredAt,
        }))
    );

    return {
      success: true,
      items: reviewableItems,
    };
  } catch (error) {
    console.error("Error fetching reviewable orders:", error);
    return {
      error: "Failed to load reviewable orders. Please try again.",
    };
  }
}

