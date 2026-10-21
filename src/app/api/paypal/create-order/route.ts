import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createPayPalOrder } from '@/lib/paypal';
import { getShippingProvider } from '@/lib/shipping-provider';
import { getCartForPricing, priceCartItems, resolvePromo, orderTotal, totalsMatch, PRICE_CHANGED_ERROR } from '@/lib/order-pricing';

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

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body: CreatePayPalOrderRequest = await request.json();

    console.log('[PayPal] Creating order for user:', userId);

    // Get user's cart (with everything needed to price it server-side)
    const cart = await getCartForPricing(userId);

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Your cart is empty. Please add items to your cart first.' },
        { status: 400 }
      );
    }

    // Verify stock for all items
    for (const cartItem of cart.items) {
      const product = cartItem.Product || cartItem.PrescriptionGlasses;
      const variants = cartItem.Product ? cartItem.Product.ProductVariant : (cartItem.PrescriptionGlasses?.PrescriptionGlassesVariant || []);
      const variant = variants.find((v: any) => v.id === cartItem.variantId);

      if (!variant) {
        return NextResponse.json(
          { error: `Variant not found for ${product?.name || 'Unknown Product'}` },
          { status: 400 }
        );
      }
      if (variant.stock < cartItem.quantity) {
        return NextResponse.json(
          { error: `Not enough stock for ${product?.name || 'Item'} (${variant.name}). Available: ${variant.stock}` },
          { status: 400 }
        );
      }
    }

    const orderTotalFromFrontend = Number(body.orderTotal);
    if (!orderTotalFromFrontend || orderTotalFromFrontend <= 0) {
      return NextResponse.json(
        { error: 'Invalid order total. Please refresh and try again.' },
        { status: 400 }
      );
    }

    // Price the order from the database. The browser's total is only checked against
    // this, never charged directly.
    const { orderItems, promoLines, subtotal } = priceCartItems(cart);
    const shipping = 0; // Free shipping
    const { promoCodeId, promoDiscount, promoCashback } = await resolvePromo(body.promoCodeId, promoLines);
    const orderTotalAfterPromo = Math.max(0, subtotal + shipping - promoDiscount);

    const walletAmount = body.walletAmount || 0;
    if (walletAmount < 0) {
      return NextResponse.json({ error: 'Invalid wallet amount.' }, { status: 400 });
    }
    const total = orderTotal(subtotal, shipping, promoDiscount, walletAmount);

    if (!totalsMatch(orderTotalFromFrontend, total)) {
      console.warn(`[PayPal] Total mismatch for user ${userId}: client €${orderTotalFromFrontend.toFixed(2)}, server €${total.toFixed(2)}`);
      return NextResponse.json({ error: PRICE_CHANGED_ERROR }, { status: 409 });
    }

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
              productId: item.productId || null,
              prescriptionGlassesId: item.prescriptionGlassesId || null,
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

