import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createPayPalOrder } from '@/lib/paypal';
import { getShippingProvider } from '@/lib/shipping-provider';

interface CreatePayPalOrderRequest {
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
  walletAmount?: number;
  promoCodeId?: string | null;
  orderTotal: number;
  // Business purchase fields
  isBusinessPurchase?: boolean;
  businessName?: string;
  businessNumber?: string;
  vatNumber?: string;
}

async function generateUniqueOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const orderNumber = `ORD-${year}-${random}`;

    // Check if this order number already exists
    const existing = await prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    });

    if (!existing) {
      return orderNumber;
    }

    attempts++;
  }

  // Fallback: use timestamp if all random attempts fail
  const timestamp = Date.now().toString().slice(-8);
  return `ORD-${year}-${timestamp}`;
}

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

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body: CreatePayPalOrderRequest = await request.json();

    console.log('[PayPal] Creating order for user:', userId);

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: {
        id: true,
        items: {
          select: {
            id: true,
            productId: true,
            variantId: true,
            quantity: true,
            prescriptionData: true,
            Product: {
              select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
                discountPct: true,
                ProductVariant: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    price: true,
                    stock: true,
                    ProductAsset: {
                      where: { isPrimary: true },
                      take: 1,
                      select: { url: true },
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
      return NextResponse.json(
        { error: 'Your cart is empty. Please add items to your cart first.' },
        { status: 400 }
      );
    }

    // Verify stock for all items
    for (const cartItem of cart.items) {
      const variant = cartItem.Product.ProductVariant.find((v: any) => v.id === cartItem.variantId);
      if (!variant) {
        return NextResponse.json(
          { error: `Variant not found for ${cartItem.Product.name}` },
          { status: 400 }
        );
      }
      if (variant.stock < cartItem.quantity) {
        return NextResponse.json(
          { error: `Not enough stock for ${cartItem.Product.name} (${variant.name}). Available: ${variant.stock}` },
          { status: 400 }
        );
      }
    }

    // Use the orderTotal from frontend
    const orderTotalFromFrontend = Number(body.orderTotal);
    if (!orderTotalFromFrontend || orderTotalFromFrontend <= 0) {
      return NextResponse.json(
        { error: 'Invalid order total. Please refresh and try again.' },
        { status: 400 }
      );
    }

    console.log('[PayPal] Using order total from frontend: €' + orderTotalFromFrontend.toFixed(2));

    // Build order items from database cart
    const orderItems: {
      productId: string;
      variantId: string;
      productName: string;
      variantName: string;
      sku: string;
      quantity: number;
      price: number;
      total: number;
      imageUrl: string | null;
      prescriptionData: any;
    }[] = [];

    let subtotal = 0;
    for (const cartItem of cart.items) {
      const variant = cartItem.Product.ProductVariant.find((v: any) => v.id === cartItem.variantId);
      if (!variant) continue;

      const prescriptionData = cartItem.prescriptionData ? (cartItem.prescriptionData as any) : null;

      let price: number;
      if (prescriptionData?.rxPriceBreakdown?.totalNet) {
        price = Number(prescriptionData.rxPriceBreakdown.totalNet);
      } else {
        const basePrice = variant.price
          ? Number(variant.price)
          : Number(cartItem.Product.basePrice);
        const discountPct = cartItem.Product.discountPct || 0;
        price = basePrice * (1 - discountPct / 100);
      }

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
        prescriptionData,
      });
    }

    const shipping = 0; // Free shipping
    const total = orderTotalFromFrontend;
    const orderTotalBeforePromo = subtotal + shipping;

    // Calculate frame quantity and frame subtotal (for frame-only discounts)
    // IMPORTANT: Count ALL frames (both regular frames AND frames from prescription glasses)
    // Discount applies to frame prices only, not prescription lens prices
    let frameQuantity = 0;
    let frameSubtotal = 0;
    for (const orderItem of orderItems) {
      // Count ALL frames (every item has a frame, whether it's regular or prescription)
      frameQuantity += orderItem.quantity;

      // Extract frame price (base product price, before prescription lenses)
      // For ALL items (both regular and prescription), use the base product price
      const cartItem = cart.items.find((ci: any) =>
        ci.productId === orderItem.productId && ci.variantId === orderItem.variantId
      );

      if (cartItem) {
        const variant = cartItem.Product.ProductVariant.find((v: any) => v.id === orderItem.variantId);
        if (variant) {
          // Get base frame price (before any prescription lenses)
          const basePrice = variant.price
            ? Number(variant.price)
            : Number(cartItem.Product.basePrice);
          const discountPct = cartItem.Product.discountPct || 0;
          const framePrice = basePrice * (1 - discountPct / 100);
          frameSubtotal += framePrice * orderItem.quantity;
        }
      }
    }

    // Validate and apply promo code if provided
    let promoDiscount = 0;
    let promoCashback = 0;
    let promoCodeId: string | null = null;

    if (body.promoCodeId) {
      const promoCode = await prisma.promoCode.findUnique({
        where: { id: body.promoCodeId },
      });

      if (promoCode && promoCode.isActive) {
        const now = new Date();
        if (promoCode.startDate <= now && (!promoCode.endDate || promoCode.endDate >= now)) {
          if (!promoCode.usageLimit || promoCode.usedCount < promoCode.usageLimit) {
            if (!promoCode.minPurchaseAmount || orderTotalBeforePromo >= Number(promoCode.minPurchaseAmount)) {
              // Check if this is a frame-only discount
              if (promoCode.applyToFramesOnly && promoCode.bulkFrameDiscountPercentage && promoCode.minFrameQuantity) {
                // Frame-only discount: check minimum frame quantity
                if (frameQuantity >= Number(promoCode.minFrameQuantity)) {
                  // Apply discount only to frames
                  promoDiscount = (frameSubtotal * Number(promoCode.bulkFrameDiscountPercentage)) / 100;
                  promoDiscount = Math.min(promoDiscount, frameSubtotal);
                  promoCodeId = promoCode.id;
                }
              } else {
                // Regular discount: applies to entire order
                if (promoCode.discountPercentage) {
                  promoDiscount = (orderTotalBeforePromo * Number(promoCode.discountPercentage)) / 100;
                } else if (promoCode.discountAmount) {
                  promoDiscount = Number(promoCode.discountAmount);
                }
                promoDiscount = Math.min(promoDiscount, orderTotalBeforePromo);

                if (promoCode.cashbackPercentage) {
                  promoCashback = (orderTotalBeforePromo * Number(promoCode.cashbackPercentage)) / 100;
                }

                promoCodeId = promoCode.id;
              }
            }
          }
        }
      }
    }

    const orderTotalAfterPromo = Math.max(0, orderTotalBeforePromo - promoDiscount);
    const walletAmount = body.walletAmount || 0;

    // Validate wallet amount
    if (walletAmount > 0) {
      let wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: { userId, balance: 0 },
        });
      }

      const walletBalance = Number(wallet.balance);

      if (walletAmount > walletBalance) {
        return NextResponse.json(
          { error: `Insufficient wallet balance. Available: €${walletBalance.toFixed(2)}, Requested: €${walletAmount.toFixed(2)}` },
          { status: 400 }
        );
      }

      if (walletAmount > orderTotalAfterPromo) {
        return NextResponse.json(
          { error: 'Wallet amount cannot exceed order total' },
          { status: 400 }
        );
      }
    }

    if (total <= 0) {
      return NextResponse.json(
        { error: 'Order total must be greater than 0. Please reduce wallet amount or add more items.' },
        { status: 400 }
      );
    }

    // Determine shipping provider
    const shippingProvider = getShippingProvider(body.shippingAddress.country);

    // Deduct wallet amount if used
    let walletTransactionId: string | null = null;
    if (walletAmount > 0) {
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        return NextResponse.json({ error: 'Wallet not found' }, { status: 400 });
      }

      await prisma.wallet.update({
        where: { userId },
        data: {
          balance: {
            decrement: walletAmount,
          },
        },
      });

      const walletTransaction = await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: walletAmount,
          type: 'DEBIT',
          description: `Order payment - Pending (PayPal)`,
        },
      });
      walletTransactionId = walletTransaction.id;
    }

    // Create order in database (PENDING status)
    let order;
    try {
      const orderNumber = await generateUniqueOrderNumber();
      order = await prisma.order.create({
        data: {
          userId,
          orderNumber,
          status: 'PENDING',
          paymentMethod: 'paypal',
          paymentStatus: 'PENDING',
          isPaid: false,
          subtotal,
          shipping,
          total,
          walletAmountUsed: walletAmount,
          promoCodeId: promoCodeId,
          promoDiscount: promoDiscount,
          promoCashback: promoCashback,
          currency: 'EUR',
          shippingProvider,
          shippingName: body.shippingAddress.name,
          shippingPhone: body.shippingAddress.phone,
          shippingAddressLine1: body.shippingAddress.addressLine1,
          shippingAddressLine2: body.shippingAddress.addressLine2 || null,
          shippingCity: body.shippingAddress.city,
          shippingState: body.shippingAddress.state || null,
          shippingPostalCode: body.shippingAddress.postalCode,
          shippingCountry: body.shippingAddress.country,
          billingName: body.billingAddress?.name || body.shippingAddress.name,
          billingPhone: body.billingAddress?.phone || body.shippingAddress.phone,
          billingAddressLine1: body.billingAddress?.addressLine1 || body.shippingAddress.addressLine1,
          billingAddressLine2: body.billingAddress?.addressLine2 || body.shippingAddress.addressLine2 || null,
          billingCity: body.billingAddress?.city || body.shippingAddress.city,
          billingState: body.billingAddress?.state || body.shippingAddress.state || null,
          billingPostalCode: body.billingAddress?.postalCode || body.shippingAddress.postalCode,
          billingCountry: body.billingAddress?.country || body.shippingAddress.country,
          // Business purchase fields
          isBusinessPurchase: body.isBusinessPurchase || false,
          businessName: body.businessName || null,
          businessNumber: body.businessNumber || null,
          vatNumber: body.vatNumber || null,
          items: {
            create: orderItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.productName,
              variantName: item.variantName,
              sku: item.sku,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
              imageUrl: item.imageUrl,
              prescriptionData: item.prescriptionData,
            })),
          },
        },
      });
    } catch (orderError: any) {
      // If order creation fails, refund wallet if it was deducted
      if (walletAmount > 0 && walletTransactionId) {
        console.error('[PayPal] Order creation failed, refunding wallet...');
        try {
          const wallet = await prisma.wallet.findUnique({ where: { userId } });
          if (wallet) {
            await prisma.wallet.update({
              where: { userId },
              data: { balance: { increment: walletAmount } },
            });
            await prisma.walletTransaction.delete({
              where: { id: walletTransactionId },
            }).catch(() => {
              // If delete fails, create a refund transaction instead
              prisma.walletTransaction.create({
                data: {
                  walletId: wallet.id,
                  amount: walletAmount,
                  type: 'CREDIT',
                  description: `Refund - Order creation failed`,
                },
              });
            });
          }
        } catch (refundError) {
          console.error('[PayPal] Failed to refund wallet after order creation failure:', refundError);
        }
      }
      throw orderError;
    }

    // Increment promo code usage count if used
    if (promoCodeId) {
      await prisma.promoCode.update({
        where: { id: promoCodeId },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      });
    }

    console.log('[PayPal] Order created in database:', order.id, order.orderNumber);

    // Create PayPal Order
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:9002';
    const encodedOrderId = encodeURIComponent(order.id);

    const paypalOrder = await createPayPalOrder({
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: total,
      currency: 'EUR',
      description: `FocusRobin Order ${order.orderNumber}`,
      returnUrl: `${baseUrl}/checkout/success`,
      cancelUrl: `${baseUrl}/checkout?cancelled=true&orderId=${encodedOrderId}&paymentMethod=paypal`,
    });

    // Update order with PayPal Order ID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paypalOrderId: paypalOrder.id,
      },
    });

    console.log('[PayPal] PayPal order created:', paypalOrder.id);

    // Find the approval link
    const approvalLink = paypalOrder.links.find(link => link.rel === 'approve');

    return NextResponse.json({
      success: true,
      paypalOrderId: paypalOrder.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      approvalUrl: approvalLink?.href || null,
      walletTransactionId,
    });
  } catch (error: any) {
    console.error('[PayPal] Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create PayPal order' },
      { status: 500 }
    );
  }
}

