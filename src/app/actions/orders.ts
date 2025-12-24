"use server";

import { prisma } from "@/lib/prisma";
import { getShippingProvider } from '@/lib/shipping-provider';
import { requireAuth, requireAdmin, safeAction } from "@/lib/security";
import { rateLimit, getIdentifier } from "@/lib/rate-limit";
import { createOrderSchema, updateOrderStatusSchema, updatePaymentStatusSchema, updateTrackingSchema } from "@/lib/validations";
import { z } from "zod";

// Helper function to convert Google Drive links
function convertGoogleDriveLink(url: string): string {
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch) {
    return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}`;
  }
  const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (driveOpenMatch) {
    return `https://lh3.googleusercontent.com/d/${driveOpenMatch[1]}`;
  }
  const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) {
    return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
  }
  if (url.includes('googleusercontent.com')) {
    return url;
  }
  return url;
}

// Helper function to normalize image URLs
function normalizeImageUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('/')) return url;
  
  // Check for Google Drive links and convert them
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.includes('drive.google.com')) {
      return convertGoogleDriveLink(url);
    }
    return url;
  }
  
  const publicPathMatch = url.match(/[\\/]public[\\/](.+)$/i);
  if (publicPathMatch) {
    return '/' + publicPathMatch[1].replace(/\\/g, '/');
  }
  
  const filenameMatch = url.match(/[\\/]([^\\/]+\.(jpg|jpeg|png|gif|webp|svg|glb))$/i);
  if (filenameMatch) {
    return '/' + filenameMatch[1];
  }
  
  return url.startsWith('./') ? url.slice(1) : '/' + url;
}

interface CreateOrderData {
  paymentMethod: string;
  walletAmount?: number;
  shippingProvider?: string;
  shippingAddress: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
}

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `ORD-${year}-${random}`;
}

/**
 * Create a new order from cart items (User action - rate limited)
 */
export async function createOrder(orderData: CreateOrderData) {
  return safeAction(async () => {
    const { session } = await requireAuth();
    const userId = session.user.id;

    // Rate limit order creation
    const rateLimitResult = rateLimit(
      getIdentifier(null, userId, "order"),
      "ORDER_CREATE"
    );
    if (!rateLimitResult.success) {
      return { error: `Too many order attempts. Please try again in ${rateLimitResult.retryAfter} seconds.` };
    }

    // Validate input with Zod
    const validatedInput = createOrderSchema.safeParse(orderData);
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid order data" };
    }

    const validData = validatedInput.data;

    // Get cart items (IDOR protected - uses session userId)
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            Product: {
              include: {
                ProductVariant: {
                  include: {
                    ProductAsset: {
                      where: { isPrimary: true },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return { error: "Cart is empty" };
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const cartItem of cart.items) {
      const variant = cartItem.Product.ProductVariant.find(
        (v) => v.id === cartItem.variantId
      );
      
      if (!variant) {
        return { error: `Variant not found for product ${cartItem.Product.name}. Please refresh your cart.` };
      }

      const basePrice = Number(cartItem.Product.basePrice);
      const variantPrice = variant.price ? Number(variant.price) : null;
      const price = variantPrice || basePrice;
      const itemTotal = price * cartItem.quantity;
      subtotal += itemTotal;

      const primaryAsset = variant.ProductAsset[0];
      const imageUrl = normalizeImageUrl(primaryAsset?.url || null);

      orderItems.push({
        productId: cartItem.productId,
        variantId: cartItem.variantId,
        productName: cartItem.Product.name,
        variantName: variant.name,
        sku: variant.sku,
        quantity: cartItem.quantity,
        price,
        total: itemTotal,
        imageUrl,
      });
    }

    const shipping = 0;
    const walletAmount = validData.walletAmount || 0;
    const total = Math.max(0, subtotal + shipping - walletAmount);

    // Determine shipping provider
    const shippingProvider = validData.shippingProvider || getShippingProvider(validData.shippingAddress.country);

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        orderNumber: generateOrderNumber(),
        status: "PENDING",
        paymentMethod: validData.paymentMethod,
        paymentStatus: "PENDING",
        subtotal,
        shipping,
        total,
        currency: "EUR",
        shippingProvider,
        shippingName: validData.shippingAddress.name,
        shippingPhone: validData.shippingAddress.phone,
        shippingAddressLine1: validData.shippingAddress.addressLine1,
        shippingAddressLine2: validData.shippingAddress.addressLine2 || null,
        shippingCity: validData.shippingAddress.city,
        shippingState: validData.shippingAddress.state || null,
        shippingPostalCode: validData.shippingAddress.postalCode,
        shippingCountry: validData.shippingAddress.country,
        billingName: validData.billingAddress?.name || validData.shippingAddress.name,
        billingPhone: validData.billingAddress?.phone || validData.shippingAddress.phone,
        billingAddressLine1: validData.billingAddress?.addressLine1 || validData.shippingAddress.addressLine1,
        billingAddressLine2: validData.billingAddress?.addressLine2 || validData.shippingAddress.addressLine2 || null,
        billingCity: validData.billingAddress?.city || validData.shippingAddress.city,
        billingState: validData.billingAddress?.state || validData.shippingAddress.state || null,
        billingPostalCode: validData.billingAddress?.postalCode || validData.shippingAddress.postalCode,
        billingCountry: validData.billingAddress?.country || validData.shippingAddress.country,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    });

    // Deduct wallet amount if used
    if (walletAmount > 0) {
      let wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: { userId, balance: 0 },
        });
      }

      const currentBalance = Number(wallet.balance);
      if (currentBalance < walletAmount) {
        return { error: "Insufficient wallet balance" };
      }

      const newBalance = currentBalance - walletAmount;

      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: walletAmount,
          type: 'DEBIT',
          description: `Payment for order ${order.orderNumber}`,
        },
      });
    }

    // Calculate and add cashback
    let totalCashback = 0;
    const cashbackItems: { productName: string; amount: number; quantity: number; total: number }[] = [];

    for (const cartItem of cart.items) {
      const product = cartItem.Product;
      const cashbackAmount = Number(product.cashbackAmount || 0);
      
      if (cashbackAmount > 0) {
        const itemCashback = cashbackAmount * cartItem.quantity;
        totalCashback += itemCashback;
        cashbackItems.push({
          productName: product.name,
          amount: cashbackAmount,
          quantity: cartItem.quantity,
          total: itemCashback,
        });
      }
    }

    if (totalCashback > 0) {
      let wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: { userId, balance: 0 },
        });
      }

      const currentBalance = Number(wallet.balance);
      const newBalance = currentBalance + totalCashback;

      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: totalCashback,
          type: 'CREDIT',
          description: `Cashback from order ${order.orderNumber}${cashbackItems.length > 0 ? ` (${cashbackItems.map((item) => `${item.productName}${item.quantity > 1 ? ` x${item.quantity}` : ''}: €${item.total.toFixed(2)}`).join(', ')})` : ''}`,
        },
      });
    }

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Send order confirmation email (async, don't block response)
    console.log(`[Order] Triggering order confirmation email for ${order.orderNumber}...`);
    try {
      const { sendOrderConfirmationEmail } = await import("@/lib/order-email");
      // Fire and forget - don't block the response
      sendOrderConfirmationEmail(order.id)
        .then((result) => {
          if (result.success) {
            console.log(`[Order] ✓ Order confirmation email sent for ${order.orderNumber}`);
          } else {
            console.error(`[Order] ✗ Failed to send confirmation email for ${order.orderNumber}:`, result.error);
          }
        })
        .catch((error) => {
          console.error(`[Order] ✗ Exception sending confirmation email for ${order.orderNumber}:`, error);
        });
    } catch (emailError: any) {
      console.error("[Order] ✗ Error importing email module:", emailError.message);
    }

    return {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: Number(order.total),
      },
      cashback: totalCashback > 0 ? totalCashback : undefined,
    };
  });
}

/**
 * Get all orders for the current user (User action - IDOR protected)
 */
export async function getUserOrders() {
  return safeAction(async () => {
    const { session } = await requireAuth();
    const userId = session.user.id;

    // IDOR Protection: Only fetch orders for current user
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            Product: {
              select: {
                id: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: Number(order.total),
        currency: order.currency,
        shippingProvider: order.shippingProvider,
        trackingNumber: order.trackingNumber,
        trackingMessage: order.trackingMessage,
        createdAt: order.createdAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productSlug: item.Product?.slug || null,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
          quantity: item.quantity,
          price: Number(item.price),
          total: Number(item.total),
          imageUrl: item.imageUrl,
        })),
      })),
    };
  });
}

/**
 * Get all orders (Admin only)
 */
export async function getAllOrders() {
  return safeAction(async () => {
    await requireAdmin();

    const orders = await prisma.order.findMany({
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            Product: {
              select: {
                id: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        userName: order.User?.name || "Unknown",
        userEmail: order.User?.email || "Unknown",
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        subtotal: Number(order.subtotal),
        shipping: Number(order.shipping),
        total: Number(order.total),
        currency: order.currency,
        shippingName: order.shippingName,
        shippingPhone: order.shippingPhone,
        shippingAddressLine1: order.shippingAddressLine1,
        shippingAddressLine2: order.shippingAddressLine2,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState,
        shippingPostalCode: order.shippingPostalCode,
        shippingCountry: order.shippingCountry,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productSlug: item.Product?.slug || null,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
          quantity: item.quantity,
          price: Number(item.price),
          total: Number(item.total),
          imageUrl: item.imageUrl,
        })),
      })),
    };
  });
}

/**
 * Update order status (Admin only)
 */
export async function updateOrderStatus(
  orderId: string,
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED"
) {
  return safeAction(async () => {
    await requireAdmin();

    // Validate input
    const validatedInput = updateOrderStatusSchema.safeParse({ orderId, status });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    const updateData: any = {
      status: validatedInput.data.status,
    };

    if (status === "SHIPPED") {
      updateData.shippedAt = new Date();
    }
    if (status === "DELIVERED") {
      updateData.deliveredAt = new Date();
    }

    const order = await prisma.order.update({
      where: { id: validatedInput.data.orderId },
      data: updateData,
    });

    return {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      },
    };
  });
}

/**
 * Update payment status (Admin only)
 */
export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED"
) {
  return safeAction(async () => {
    await requireAdmin();

    // Validate input
    const validatedInput = updatePaymentStatusSchema.safeParse({ orderId, paymentStatus });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    const order = await prisma.order.update({
      where: { id: validatedInput.data.orderId },
      data: { paymentStatus: validatedInput.data.paymentStatus },
    });

    return {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
      },
    };
  });
}

/**
 * Update tracking information (Admin only)
 */
export async function updateTracking(
  orderId: string,
  trackingNumber?: string,
  trackingMessage?: string
) {
  return safeAction(async () => {
    await requireAdmin();

    // Validate input
    const validatedInput = updateTrackingSchema.safeParse({ orderId, trackingNumber, trackingMessage });
    if (!validatedInput.success) {
      return { error: validatedInput.error.errors[0]?.message || "Invalid input" };
    }

    const updateData: any = {};
    if (validatedInput.data.trackingNumber !== undefined) {
      updateData.trackingNumber = validatedInput.data.trackingNumber || null;
    }
    if (validatedInput.data.trackingMessage !== undefined) {
      updateData.trackingMessage = validatedInput.data.trackingMessage || null;
    }

    const order = await prisma.order.update({
      where: { id: validatedInput.data.orderId },
      data: updateData,
    });

    return {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        trackingNumber: order.trackingNumber,
        trackingMessage: order.trackingMessage,
      },
    };
  });
}

/**
 * Get a single order by ID (User action - IDOR protected)
 */
export async function getOrder(orderId: string) {
  return safeAction(async () => {
    const { session } = await requireAuth();
    const userId = session.user.id;

    // Validate input
    const schema = z.string().min(1).max(30);
    const validatedId = schema.safeParse(orderId);
    if (!validatedId.success) {
      return { error: "Invalid order ID" };
    }

    // IDOR Protection: Only fetch order if it belongs to current user
    const order = await prisma.order.findFirst({
      where: {
        id: validatedId.data,
        userId,
      },
      include: {
        items: {
          include: {
            Product: {
              select: {
                id: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return { error: "Order not found" };
    }

    return {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        subtotal: Number(order.subtotal),
        shipping: Number(order.shipping),
        total: Number(order.total),
        currency: order.currency,
        shippingName: order.shippingName,
        shippingPhone: order.shippingPhone,
        shippingAddressLine1: order.shippingAddressLine1,
        shippingAddressLine2: order.shippingAddressLine2,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState,
        shippingPostalCode: order.shippingPostalCode,
        shippingCountry: order.shippingCountry,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productSlug: item.Product?.slug || null,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
          quantity: item.quantity,
          price: Number(item.price),
          total: Number(item.total),
          imageUrl: item.imageUrl,
        })),
      },
    };
  });
}
