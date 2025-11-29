"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getShippingProvider } from '@/lib/shipping-provider';

// Helper function to normalize image URLs (same as in prisma-product-mapper.ts)
function normalizeImageUrl(url: string | null): string | null {
  if (!url) return null;
  
  // If it's already a relative path starting with /, return as is
  if (url.startsWith('/')) return url;
  
  // If it's already a full URL (http/https), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  // Handle Windows absolute paths
  // Convert G:\Dev\...\public\image.jpg to /image.jpg
  // Or C:\...\public\images\product.jpg to /images/product.jpg
  const publicPathMatch = url.match(/[\\/]public[\\/](.+)$/i);
  if (publicPathMatch) {
    // Normalize path separators and ensure it starts with /
    return '/' + publicPathMatch[1].replace(/\\/g, '/');
  }
  
  // If it doesn't match any pattern, try to extract just the filename
  // and assume it's in the root of public folder
  const filenameMatch = url.match(/[\\/]([^\\/]+\.(jpg|jpeg|png|gif|webp|svg|glb))$/i);
  if (filenameMatch) {
    return '/' + filenameMatch[1];
  }
  
  // Fallback: return as is (might be a relative path without leading /)
  return url.startsWith('./') ? url.slice(1) : '/' + url;
}

interface CreateOrderData {
  paymentMethod: string;
  walletAmount?: number; // Amount to deduct from wallet
  shippingProvider?: string; // Shipping provider (Omniva or DHL)
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

/**
 * Generate a unique order number
 */
function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `ORD-${year}-${random}`;
}

/**
 * Create a new order from cart items
 */
export async function createOrder(orderData: CreateOrderData) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in to create an order" };
    }

    const userId = (session.user as any)?.id;
    if (!userId) {
      return { error: "User ID not found" };
    }

    console.log("Creating order for user:", userId);
    console.log("Order data:", {
      paymentMethod: orderData.paymentMethod,
      shippingAddress: orderData.shippingAddress,
    });

    // Get cart items with product details
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

    console.log("Cart found:", cart ? `Yes, ${cart.items.length} items` : "No");
    
    if (!cart || cart.items.length === 0) {
      return { error: "Cart is empty" };
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const cartItem of cart.items) {
      console.log("Processing cart item:", {
        productId: cartItem.productId,
        variantId: cartItem.variantId,
        productName: cartItem.Product.name,
        variantsCount: cartItem.Product.ProductVariant.length,
      });

      const variant = cartItem.Product.ProductVariant.find(
        (v) => v.id === cartItem.variantId
      );
      
      if (!variant) {
        console.error("Variant not found:", {
          cartItemVariantId: cartItem.variantId,
          availableVariants: cartItem.Product.ProductVariant.map((v: any) => ({ id: v.id, name: v.name })),
        });
        return { error: `Variant not found for product ${cartItem.Product.name}. Please refresh your cart and try again.` };
      }

      const basePrice = Number(cartItem.Product.basePrice);
      const variantPrice = variant.price ? Number(variant.price) : null;
      const price = variantPrice || basePrice;
      const itemTotal = price * cartItem.quantity;
      subtotal += itemTotal;

      const primaryAsset = variant.ProductAsset[0];
      // Normalize image URL - convert absolute paths to relative paths from public folder
      const imageUrl = normalizeImageUrl(primaryAsset?.url || null);

      console.log("Order item calculated:", {
        productName: cartItem.Product.name,
        variantName: variant.name,
        quantity: cartItem.quantity,
        price,
        itemTotal,
      });

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

    console.log("Order items prepared:", orderItems.length);
    console.log("Subtotal:", subtotal);

    const shipping = 0; // Free shipping for now
    const walletAmount = orderData.walletAmount || 0;
    const total = Math.max(0, subtotal + shipping - walletAmount);

    console.log("Creating order with:", {
      userId,
      orderNumber: generateOrderNumber(),
      itemCount: orderItems.length,
      subtotal,
      total,
    });

    // Check if Order model is available
    if (!prisma.order || typeof (prisma.order as any).create !== 'function') {
      console.error("Order model not available. Prisma client needs to be regenerated.");
      return { 
        error: "Order system is not ready. Please restart your development server and try again." 
      };
    }

    // Determine shipping provider based on country (if not provided)
    const shippingProvider = orderData.shippingProvider || getShippingProvider(orderData.shippingAddress.country);

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        orderNumber: generateOrderNumber(),
        status: "PENDING",
        paymentMethod: orderData.paymentMethod,
        paymentStatus: "PENDING",
        subtotal,
        shipping,
        total,
        currency: "EUR",
        shippingProvider,
        shippingName: orderData.shippingAddress.name,
        shippingPhone: orderData.shippingAddress.phone,
        shippingAddressLine1: orderData.shippingAddress.addressLine1,
        shippingAddressLine2: orderData.shippingAddress.addressLine2 || null,
        shippingCity: orderData.shippingAddress.city,
        shippingState: orderData.shippingAddress.state || null,
        shippingPostalCode: orderData.shippingAddress.postalCode,
        shippingCountry: orderData.shippingAddress.country,
        billingName: orderData.billingAddress?.name || orderData.shippingAddress.name,
        billingPhone: orderData.billingAddress?.phone || orderData.shippingAddress.phone,
        billingAddressLine1: orderData.billingAddress?.addressLine1 || orderData.shippingAddress.addressLine1,
        billingAddressLine2: orderData.billingAddress?.addressLine2 || orderData.shippingAddress.addressLine2 || null,
        billingCity: orderData.billingAddress?.city || orderData.shippingAddress.city,
        billingState: orderData.billingAddress?.state || orderData.shippingAddress.state || null,
        billingPostalCode: orderData.billingAddress?.postalCode || orderData.shippingAddress.postalCode,
        billingCountry: orderData.billingAddress?.country || orderData.shippingAddress.country,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    });

    console.log("Order created successfully:", order.id);

    // Deduct wallet amount if used
    if (walletAmount > 0) {
      try {
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

        console.log(`Wallet deducted: €${walletAmount.toFixed(2)}`);
      } catch (error) {
        console.error("Error deducting wallet amount:", error);
        return { error: "Failed to process wallet payment" };
      }
    }

    // Calculate and add cashback to wallet
    let totalCashback = 0;
    const cashbackItems = [];

    for (const cartItem of cart.items) {
      const product = cartItem.Product;
      const variant = product.ProductVariant.find((v: any) => v.id === cartItem.variantId);
      
      if (!variant) continue;

      const cashbackAmount = Number(product.cashbackAmount || 0);
      
      if (cashbackAmount > 0) {
        // Fixed cashback amount per item × quantity
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

    // Add cashback to user's wallet if there's any
    if (totalCashback > 0) {
      try {
        // Get or create wallet
        let wallet = await prisma.wallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          wallet = await prisma.wallet.create({
            data: { userId, balance: 0 },
          });
        }

        // Update wallet balance
        const currentBalance = Number(wallet.balance);
        const newBalance = currentBalance + totalCashback;

        await prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: newBalance },
        });

        // Create cashback transaction
        await prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: totalCashback,
            type: 'CREDIT',
            description: `Cashback from order ${order.orderNumber}${cashbackItems.length > 0 ? ` (${cashbackItems.map((item: any) => `${item.productName}${item.quantity > 1 ? ` x${item.quantity}` : ''}: €${item.total.toFixed(2)}`).join(', ')})` : ''}`,
          },
        });

        console.log(`Cashback added: €${totalCashback.toFixed(2)} to wallet`);
      } catch (error) {
        console.error("Error adding cashback to wallet:", error);
        // Don't fail the order if cashback fails, just log it
      }
    }

    // Clear cart after order creation
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    console.log("Cart cleared");

    return {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: Number(order.total),
      },
      cashback: totalCashback > 0 ? totalCashback : undefined,
    };
  } catch (error: any) {
    console.error("Error creating order:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    
    // Provide more specific error messages
    if (error?.code === 'P2002') {
      return { error: "Order number conflict. Please try again." };
    }
    if (error?.code === 'P2003') {
      return { error: "Invalid product or variant reference. Please refresh your cart and try again." };
    }
    
    return {
      error: error?.message || "Failed to create order. Please try again.",
    };
  }
}

/**
 * Get all orders for the current user
 */
export async function getUserOrders() {
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
          productSlug: item.Product.slug,
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
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return {
      error: "Failed to load orders. Please try again.",
    };
  }
}

/**
 * Get all orders (admin only)
 */
export async function getAllOrders() {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return { error: "Only admins can view all orders" };
    }

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
          productSlug: item.Product.slug,
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
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return {
      error: "Failed to load orders. Please try again.",
    };
  }
}

/**
 * Update order status (admin only)
 */
export async function updateOrderStatus(
  orderId: string,
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED"
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return { error: "Only admins can update order status" };
    }

    const updateData: any = {
      status,
    };

    // Set timestamps based on status
    if (status === "SHIPPED" && !updateData.shippedAt) {
      updateData.shippedAt = new Date();
    }
    if (status === "DELIVERED" && !updateData.deliveredAt) {
      updateData.deliveredAt = new Date();
    }

    const order = await prisma.order.update({
      where: { id: orderId },
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
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      error: "Failed to update order status. Please try again.",
    };
  }
}

/**
 * Update payment status (admin only)
 */
export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED"
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return { error: "Only admins can update payment status" };
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus },
    });

    return {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
      },
    };
  } catch (error) {
    console.error("Error updating payment status:", error);
    return {
      error: "Failed to update payment status. Please try again.",
    };
  }
}

/**
 * Update tracking information (admin only)
 */
export async function updateTracking(
  orderId: string,
  trackingNumber?: string,
  trackingMessage?: string
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN") {
      return { error: "Only admins can update tracking" };
    }

    const updateData: any = {};
    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber || null;
    }
    if (trackingMessage !== undefined) {
      updateData.trackingMessage = trackingMessage || null;
    }

    const order = await prisma.order.update({
      where: { id: orderId },
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
  } catch (error) {
    console.error("Error updating tracking:", error);
    return {
      error: "Failed to update tracking. Please try again.",
    };
  }
}

/**
 * Get a single order by ID
 */
export async function getOrder(orderId: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { error: "You must be logged in" };
    }

    const userId = (session.user as any)?.id;
    if (!userId) {
      return { error: "User ID not found" };
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
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
          productSlug: item.Product.slug,
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
  } catch (error) {
    console.error("Error fetching order:", error);
    return {
      error: "Failed to load order. Please try again.",
    };
  }
}

