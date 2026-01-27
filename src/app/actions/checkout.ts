"use server";

import { prisma } from "@/lib/prisma";
import stripe from "@/lib/stripe";
import { requireAuth, safeAction } from "@/lib/security";
import { rateLimit, getIdentifier } from "@/lib/rate-limit";
import { getShippingProvider } from "@/lib/shipping-provider";

interface CheckoutData {
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
  // The total amount shown in Order Summary on checkout page
  // This is the EXACT amount that should be charged to Stripe
  orderTotal: number;
  // Business purchase fields
  isBusinessPurchase?: boolean;
  businessName?: string;
  businessNumber?: string;
  vatNumber?: string;
}

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `ORD-${year}-${random}`;
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

/**
 * Create a Stripe Checkout Session and Order
 */
export async function createCheckoutSession(checkoutData: CheckoutData) {
  return safeAction(async () => {
    const { session } = await requireAuth();
    const userId = session.user.id;

    // Rate limit checkout
    const rateLimitResult = rateLimit(
      getIdentifier(null, userId, "checkout"),
      "ORDER_CREATE"
    );
    if (!rateLimitResult.success) {
      return { error: `Too many checkout attempts. Please try again in ${rateLimitResult.retryAfter} seconds.` };
    }

    // Get user's cart to verify it exists and get items for order creation
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

    if (!cart) {
      return { error: "Your cart is empty. Please add items to your cart first." };
    }

    if (cart.items.length === 0) {
      return { error: "Your cart is empty. Please add items to your cart first." };
    }

    // Verify stock for all items
    // Allow items already in cart to be purchased even if stock goes low (reserve them)
    // But prevent checkout if items are fully sold out (stock = 0)
    for (const cartItem of cart.items) {
      const variant = cartItem.Product.ProductVariant.find((v: any) => v.id === cartItem.variantId);
      if (!variant) {
        return { error: `Variant not found for ${cartItem.Product.name}` };
      }

      const stock = variant.stock !== null && variant.stock !== undefined ? Number(variant.stock) : null;

      // If stock is 0, item is fully sold out - prevent checkout
      if (stock === 0) {
        return {
          error: `${cartItem.Product.name} (${variant.name}) is currently out of stock and cannot be purchased. Please remove it from your cart.`,
        };
      }

      // If stock is null/undefined, allow checkout (stock tracking may not be enabled)
      if (stock === null) {
        continue;
      }

      // If stock > 0 but less than quantity, allow checkout (item was in cart when available, reserve it)
      // This handles the case where stock goes low after item was added to cart
      // Note: We don't check if stock < quantity anymore - we allow it because item was already in cart
    }

    // Use the orderTotal from frontend (Order Summary total)
    // This is the EXACT amount shown to the user
    const orderTotalFromFrontend = Number(checkoutData.orderTotal);
    if (!orderTotalFromFrontend || orderTotalFromFrontend <= 0) {
      return { error: "Invalid order total. Please refresh and try again." };
    }

    console.log('[CHECKOUT] Using order total from frontend (Order Summary): €' + orderTotalFromFrontend.toFixed(2));

    // Build order items from database cart (for order record)
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

    // NOTE: We only use prescription data from cartItem.prescriptionData
    // Do NOT fetch from UserPrescription table - that was causing wrong prescription data
    // to be applied to non-prescription items

    let subtotal = 0;
    for (const cartItem of cart.items) {
      const variant = cartItem.Product.ProductVariant.find((v: any) => v.id === cartItem.variantId);
      if (!variant) continue;

      // IMPORTANT: Only use prescription data directly from the cart item
      // This was stored when the user added the item with prescription to cart
      const prescriptionData = cartItem.prescriptionData ? (cartItem.prescriptionData as any) : null;

      let price: number;
      // Only use prescription pricing if the item has valid prescription data with totalNet
      if (prescriptionData?.rxPriceBreakdown?.totalNet) {
        price = Number(prescriptionData.rxPriceBreakdown.totalNet);
        console.log(`[CHECKOUT] Item ${cartItem.Product.name}: Using prescription price €${price}`);
      } else {
        // No prescription or no totalNet - use regular frame price
        const basePrice = variant.price
          ? Number(variant.price)
          : Number(cartItem.Product.basePrice);
        const discountPct = cartItem.Product.discountPct || 0;
        price = basePrice * (1 - discountPct / 100);
        console.log(`[CHECKOUT] Item ${cartItem.Product.name}: Using frame price €${price} (base: €${basePrice}, discount: ${discountPct}%)`);
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
        prescriptionData, // Only include actual prescription data from cart item
      });

      console.log(`[CHECKOUT] Added order item: ${cartItem.Product.name} - ${variant.name}, qty: ${cartItem.quantity}, price: €${price}, total: €${itemTotal}, hasPrescription: ${!!prescriptionData}`);
    }

    // Create a SINGLE Stripe line item with the total from Order Summary
    // This ensures Stripe amount ALWAYS matches what user sees
    const stripeLineItems = [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: `Order - ${cart.items.length} item(s)`,
          description: `Order from FocusRobin`,
        },
        unit_amount: Math.round(orderTotalFromFrontend * 100), // Convert to cents
      },
      quantity: 1,
    }];

    console.log('[CHECKOUT] Stripe will charge: €' + orderTotalFromFrontend.toFixed(2) + ' (from Order Summary)');

    const shipping = 0; // Free shipping

    // Use the orderTotal from frontend (Order Summary total)
    // This already includes all discounts, wallet deductions, etc.
    const total = orderTotalFromFrontend;

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

    // Calculate promo discount and wallet amount for order record
    // (These are already factored into orderTotalFromFrontend)
    const orderTotalBeforePromo = subtotal + shipping;

    // Validate and apply promo code if provided (for order record)
    let promoDiscount = 0;
    let promoCashback = 0;
    let promoCodeId: string | null = null;

    if (checkoutData.promoCodeId) {
      const promoCode = await prisma.promoCode.findUnique({
        where: { id: checkoutData.promoCodeId },
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

    // Calculate order total after promo discount (for validation)
    const orderTotalAfterPromo = Math.max(0, orderTotalBeforePromo - promoDiscount);

    const walletAmount = checkoutData.walletAmount || 0;

    // Validate wallet amount if provided
    if (walletAmount > 0) {
      // Get or create user's wallet
      let wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: { userId, balance: 0 },
        });
      }

      const walletBalance = Number(wallet.balance);

      // Verify user has enough wallet balance
      if (walletAmount > walletBalance) {
        return { error: `Insufficient wallet balance. Available: €${walletBalance.toFixed(2)}, Requested: €${walletAmount.toFixed(2)}` };
      }

      // Verify wallet amount doesn't exceed order total (after promo discount)
      if (walletAmount > orderTotalAfterPromo) {
        return { error: "Wallet amount cannot exceed order total" };
      }
    }

    // Validate total is greater than 0
    if (total <= 0) {
      return { error: "Order total must be greater than 0. Please reduce wallet amount or add more items." };
    }

    // Determine shipping provider
    const shippingProvider = getShippingProvider(checkoutData.shippingAddress.country);

    // Deduct wallet amount if used (before creating order to ensure atomicity)
    let walletTransactionId: string | null = null;
    if (walletAmount > 0) {
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        return { error: "Wallet not found" };
      }

      // Deduct from wallet
      await prisma.wallet.update({
        where: { userId },
        data: {
          balance: {
            decrement: walletAmount,
          },
        },
      });

      // Create wallet transaction record
      const walletTransaction = await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: walletAmount,
          type: 'DEBIT',
          description: `Order payment - Pending`,
        },
      });
      walletTransactionId = walletTransaction.id;
    }

    // Create order in database (PENDING status)
    const order = await prisma.order.create({
      data: {
        userId,
        orderNumber: generateOrderNumber(),
        status: "PENDING",
        paymentMethod: "card",
        paymentStatus: "PENDING",
        isPaid: false,
        subtotal,
        shipping,
        total,
        walletAmountUsed: walletAmount,
        promoCodeId: promoCodeId,
        promoDiscount: promoDiscount,
        promoCashback: promoCashback,
        currency: "EUR",
        shippingProvider,
        shippingName: checkoutData.shippingAddress.name,
        shippingPhone: checkoutData.shippingAddress.phone,
        shippingAddressLine1: checkoutData.shippingAddress.addressLine1,
        shippingAddressLine2: checkoutData.shippingAddress.addressLine2 || null,
        shippingCity: checkoutData.shippingAddress.city,
        shippingState: checkoutData.shippingAddress.state || null,
        shippingPostalCode: checkoutData.shippingAddress.postalCode,
        shippingCountry: checkoutData.shippingAddress.country,
        billingName: checkoutData.billingAddress?.name || checkoutData.shippingAddress.name,
        billingPhone: checkoutData.billingAddress?.phone || checkoutData.shippingAddress.phone,
        billingAddressLine1: checkoutData.billingAddress?.addressLine1 || checkoutData.shippingAddress.addressLine1,
        billingAddressLine2: checkoutData.billingAddress?.addressLine2 || checkoutData.shippingAddress.addressLine2 || null,
        billingCity: checkoutData.billingAddress?.city || checkoutData.shippingAddress.city,
        billingState: checkoutData.billingAddress?.state || checkoutData.shippingAddress.state || null,
        billingPostalCode: checkoutData.billingAddress?.postalCode || checkoutData.shippingAddress.postalCode,
        billingCountry: checkoutData.billingAddress?.country || checkoutData.shippingAddress.country,
        // Business purchase fields
        isBusinessPurchase: checkoutData.isBusinessPurchase || false,
        businessName: checkoutData.businessName || null,
        businessNumber: checkoutData.businessNumber || null,
        vatNumber: checkoutData.vatNumber || null,
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
            prescriptionData: item.prescriptionData, // Include prescription data if available
          })),
        },
      },
    });

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

    // Calculate the exact total that should be charged to Stripe
    // This is: subtotal + shipping - promoDiscount - walletAmount
    // The 'total' variable above is already rounded to 2 decimal places
    // This MUST match the Order Summary total shown on the checkout page
    const exactStripeTotal = total; // This MUST match the Order Summary total on checkout page
    const exactStripeTotalCents = Math.round(exactStripeTotal * 100);

    console.log(`[Checkout] Order Summary Total: €${exactStripeTotal.toFixed(2)} (${exactStripeTotalCents} cents)`);
    console.log(`[Checkout] Breakdown: Subtotal: €${subtotal.toFixed(2)}, Shipping: €${shipping.toFixed(2)}, Promo: -€${promoDiscount.toFixed(2)}, Wallet: -€${walletAmount.toFixed(2)}`);

    // Stripe line item is already set to the exact total from Order Summary
    // No adjustment needed - it's a single line item with the exact amount
    console.log(`[Checkout] Stripe will charge: €${exactStripeTotal.toFixed(2)} (from Order Summary)`);

    // Create Stripe Checkout Session
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:9002';

    if (!stripeLineItems || stripeLineItems.length === 0) {
      return { error: "No items to checkout" };
    }

    // Validate base URL
    let validBaseUrl: string;
    try {
      const testUrl = new URL(baseUrl);
      if (testUrl.protocol !== 'http:' && testUrl.protocol !== 'https:') {
        throw new Error(`Invalid protocol: ${testUrl.protocol}`);
      }
      validBaseUrl = baseUrl;
      console.log("Using base URL:", validBaseUrl);
    } catch (urlError) {
      console.error("Invalid NEXT_PUBLIC_URL:", baseUrl, urlError);
      return { error: "Invalid server configuration. Please contact support." };
    }

    // Construct and validate success and cancel URLs
    // URL encode the order ID to handle any special characters
    const encodedOrderId = encodeURIComponent(order.id);
    const successUrl = `${validBaseUrl}/checkout/success?orderId=${encodedOrderId}`;
    const cancelUrl = `${validBaseUrl}/checkout?cancelled=true&orderId=${encodedOrderId}`;

    try {
      const successUrlObj = new URL(successUrl);
      const cancelUrlObj = new URL(cancelUrl);
      console.log("Success URL:", successUrl);
      console.log("Cancel URL:", cancelUrl);
      console.log("Order ID:", order.id);
      console.log("Encoded Order ID:", encodedOrderId);

      if (successUrlObj.protocol !== 'http:' && successUrlObj.protocol !== 'https:') {
        throw new Error(`Invalid success URL protocol: ${successUrlObj.protocol}`);
      }
      if (cancelUrlObj.protocol !== 'http:' && cancelUrlObj.protocol !== 'https:') {
        throw new Error(`Invalid cancel URL protocol: ${cancelUrlObj.protocol}`);
      }

      // Double-check the URLs are valid strings
      if (typeof successUrl !== 'string' || successUrl.length === 0) {
        throw new Error('Success URL is not a valid string');
      }
      if (typeof cancelUrl !== 'string' || cancelUrl.length === 0) {
        throw new Error('Cancel URL is not a valid string');
      }
    } catch (urlError: any) {
      console.error("Invalid success/cancel URLs:", { successUrl, cancelUrl, orderId: order.id }, urlError);
      return { error: `Invalid checkout URLs: ${urlError.message || 'Unknown error'}` };
    }

    // Validate all line items have valid amounts (minimum 1 cent)
    for (let i = 0; i < stripeLineItems.length; i++) {
      const item = stripeLineItems[i];
      if (!item.price_data.unit_amount || item.price_data.unit_amount < 1) {
        console.error(`[Checkout] Invalid line item ${i}: unit_amount is ${item.price_data.unit_amount}`);
        return { error: `Invalid item price. Please refresh and try again.` };
      }
      if (!item.quantity || item.quantity < 1) {
        console.error(`[Checkout] Invalid line item ${i}: quantity is ${item.quantity}`);
        return { error: `Invalid item quantity. Please refresh and try again.` };
      }
    }

    // Final verification: Calculate total from line items
    const finalStripeTotalCents = stripeLineItems.reduce((sum, item) => sum + (item.price_data.unit_amount * item.quantity), 0);
    const finalStripeTotalEur = finalStripeTotalCents / 100;

    console.log("========================================");
    console.log("[Checkout] FINAL VERIFICATION:");
    console.log(`[Checkout] Order Summary Total: €${exactStripeTotal.toFixed(2)}`);
    console.log(`[Checkout] Stripe Session Total: €${finalStripeTotalEur.toFixed(2)} (${finalStripeTotalCents} cents)`);
    console.log(`[Checkout] Match: ${Math.abs(finalStripeTotalEur - exactStripeTotal) < 0.01 ? '✓ EXACT MATCH' : '✗ MISMATCH'}`);
    console.log(`[Checkout] Line Items Count: ${stripeLineItems.length}`);
    console.log("========================================");

    if (Math.abs(finalStripeTotalEur - exactStripeTotal) >= 0.01) {
      console.error(`[Checkout] CRITICAL: Stripe total (€${finalStripeTotalEur.toFixed(2)}) does not match Order Summary (€${exactStripeTotal.toFixed(2)})!`);
      return { error: `Payment amount mismatch. Please refresh and try again.` };
    }

    // Ensure total is greater than 0
    if (finalStripeTotalCents <= 0) {
      console.error(`[Checkout] CRITICAL: Stripe total is zero or negative: ${finalStripeTotalCents} cents`);
      return { error: `Invalid payment amount. Please refresh and try again.` };
    }

    // Log line items for debugging (without sensitive data)
    console.log("Creating Stripe session with:", {
      lineItemsCount: stripeLineItems.length,
      lineItems: stripeLineItems.map(item => ({
        name: item.price_data.product_data.name,
        amount: item.price_data.unit_amount,
        quantity: item.quantity,
        itemTotal: (item.price_data.unit_amount * item.quantity) / 100,
        hasImage: !!item.price_data.product_data.images,
      })),
      totalAmount: finalStripeTotalEur,
      expectedAmount: exactStripeTotal,
      successUrl,
      cancelUrl,
    });

    // Log final line items before sending to Stripe
    console.log("[Checkout] Final line items being sent to Stripe:", stripeLineItems.map((item, idx) => ({
      index: idx,
      name: item.price_data.product_data.name,
      unit_amount: item.price_data.unit_amount,
      quantity: item.quantity,
      item_total_cents: item.price_data.unit_amount * item.quantity,
      currency: item.price_data.currency,
    })));

    try {
      // Verify all line items have valid currency and amounts
      for (let i = 0; i < stripeLineItems.length; i++) {
        const item = stripeLineItems[i];
        if (!item.price_data.currency || item.price_data.currency.toLowerCase() !== 'eur') {
          console.warn(`[Checkout] Line item ${i} has invalid currency: ${item.price_data.currency}, forcing to 'eur'`);
          item.price_data.currency = 'eur'; // Force EUR
        }
        if (!item.price_data.unit_amount || item.price_data.unit_amount < 1) {
          console.error(`[Checkout] Line item ${i} has invalid unit_amount: ${item.price_data.unit_amount}`);
          return { error: `Invalid item price. Please refresh and try again.` };
        }
        if (!item.quantity || item.quantity < 1) {
          console.error(`[Checkout] Line item ${i} has invalid quantity: ${item.quantity}`);
          return { error: `Invalid item quantity. Please refresh and try again.` };
        }
      }

      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: session.user.email || undefined,
        line_items: stripeLineItems,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId: userId,
          walletAmountUsed: walletAmount.toString(),
          walletTransactionId: walletTransactionId || '',
          expectedTotal: exactStripeTotal.toFixed(2),
          lineItemsCount: stripeLineItems.length.toString(),
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        shipping_address_collection: {
          allowed_countries: ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'CH', 'NO', 'IS'],
        },
      });

      // Log the created session details to verify amount
      console.log("========================================");
      console.log("[Checkout] Stripe session created successfully:");
      console.log(`[Checkout] Session ID: ${stripeSession.id}`);
      console.log(`[Checkout] Amount Total: ${stripeSession.amount_total} cents (€${((stripeSession.amount_total || 0) / 100).toFixed(2)})`);
      console.log(`[Checkout] Currency: ${stripeSession.currency}`);
      console.log(`[Checkout] Expected Total: €${exactStripeTotal.toFixed(2)} (${exactStripeTotalCents} cents)`);
      console.log(`[Checkout] Match: ${stripeSession.amount_total === exactStripeTotalCents ? '✓ EXACT MATCH' : '✗ MISMATCH'}`);
      console.log("========================================");

      if (stripeSession.amount_total !== exactStripeTotalCents) {
        console.error(`[Checkout] WARNING: Stripe session amount (${stripeSession.amount_total} cents) does not match expected (${exactStripeTotalCents} cents)!`);
      }

      // Validate that we got a URL
      let checkoutUrl = stripeSession.url;

      if (!checkoutUrl) {
        console.error("Stripe session created but no URL returned. Attempting to retrieve session...", {
          sessionId: stripeSession.id,
          status: stripeSession.status,
          url: stripeSession.url,
          paymentStatus: stripeSession.payment_status,
        });

        // Try to retrieve the session to get the URL
        try {
          const retrievedSession = await stripe.checkout.sessions.retrieve(stripeSession.id);
          checkoutUrl = retrievedSession.url;

          if (!checkoutUrl) {
            return { error: "Failed to create checkout session. No URL returned from Stripe." };
          }
        } catch (retrieveError: any) {
          console.error("Failed to retrieve Stripe session:", retrieveError);
          return { error: "Failed to create checkout session. Please try again." };
        }
      }

      // Validate URL format
      if (!checkoutUrl || typeof checkoutUrl !== 'string') {
        console.error("Invalid URL type from Stripe:", typeof checkoutUrl, checkoutUrl);
        return { error: "Invalid checkout URL format. Please try again." };
      }

      try {
        const url = new URL(checkoutUrl);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') {
          throw new Error('Invalid URL protocol: ' + url.protocol);
        }
      } catch (urlError) {
        console.error("Invalid URL format from Stripe:", checkoutUrl, urlError);
        return { error: "Invalid checkout URL format. Please try again." };
      }

      // Update order with Stripe session ID
      await prisma.order.update({
        where: { id: order.id },
        data: {
          stripeSessionId: stripeSession.id,
        },
      });

      console.log("Stripe checkout session created successfully:", {
        sessionId: stripeSession.id,
        url: checkoutUrl,
        orderId: order.id,
      });

      return {
        success: true,
        url: checkoutUrl,
        orderId: order.id,
        orderNumber: order.orderNumber,
      };
    } catch (stripeError: any) {
      console.error("=== STRIPE ERROR DETAILS ===");
      console.error("Error type:", stripeError.type);
      console.error("Error code:", stripeError.code);
      console.error("Error message:", stripeError.message);
      console.error("Error param:", stripeError.param);
      console.error("Full error:", JSON.stringify(stripeError, null, 2));
      console.error("Line items sent:", JSON.stringify(stripeLineItems.map(item => ({
        name: item.price_data.product_data.name,
        amount: item.price_data.unit_amount,
        quantity: item.quantity,
        hasImages: !!item.price_data.product_data.images,
        imageCount: item.price_data.product_data.images?.length || 0,
      })), null, 2));
      console.error("Success URL:", successUrl);
      console.error("Cancel URL:", cancelUrl);
      console.error("===========================");

      // Provide more specific error messages
      if (stripeError.message && stripeError.message.includes('URL')) {
        // Check which URL might be the problem
        let urlHint = '';
        if (stripeError.param) {
          urlHint = ` (Parameter: ${stripeError.param})`;
        }
        return {
          error: `Invalid URL in checkout configuration: ${stripeError.message}${urlHint}. Check server logs for details.`
        };
      }

      if (stripeError.type === 'StripeInvalidRequestError') {
        return {
          error: `Invalid request to Stripe: ${stripeError.message || 'Please check your configuration.'}. Check server logs for details.`
        };
      }

      return {
        error: stripeError.message || "Failed to create checkout session. Please try again. Check server logs for details."
      };
    }
  });
}

/**
 * DEPRECATED: Sync order status with Stripe (fallback if webhook hasn't fired)
 * 
 * ⚠️ WARNING: This function bypasses proper webhook verification and should NOT be used.
 * Orders should ONLY be marked as paid via the Stripe webhook to ensure payment integrity.
 * 
 * This function is kept for reference but should not be called in production.
 */
export async function syncOrderStatusWithStripe(orderId: string) {
  // This function is deprecated and should not be used
  // Orders must be verified through webhooks only
  return safeAction(async () => {
    return {
      success: false,
      error: "This function is deprecated. Payment verification must happen through webhooks only."
    };
  });
}

/*
// ORIGINAL IMPLEMENTATION - REMOVED FOR SECURITY
export async function syncOrderStatusWithStripe(orderId: string) {
  return safeAction(async () => {
    const { session: userSession } = await requireAuth();

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        stripeSessionId: true,
        paymentStatus: true,
        status: true,
        isPaid: true,
      },
    });

    if (!order) {
      return { error: "Order not found" };
    }

    // Verify the order belongs to the user
    if (order.userId !== userSession.user.id) {
      return { error: "Unauthorized" };
    }

    // If already paid, no need to sync
    if (order.isPaid && order.paymentStatus === 'COMPLETED') {
      return { success: true, alreadySynced: true };
    }

    // If no Stripe session ID, can't sync
    if (!order.stripeSessionId) {
      return { success: false, error: "No Stripe session found" };
    }

    try {
      // Retrieve the Stripe session
      const stripeSession = await stripe.checkout.sessions.retrieve(order.stripeSessionId);

      // If payment is successful, update the order
      if (stripeSession.payment_status === 'paid' && !order.isPaid) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            isPaid: true,
            paymentStatus: 'COMPLETED',
            status: 'CONFIRMED',
            stripePaymentIntentId: typeof stripeSession.payment_intent === 'string' 
              ? stripeSession.payment_intent 
              : stripeSession.payment_intent?.id || null,
          },
        });

        return { success: true, updated: true };
      }

      return { success: true, updated: false, paymentStatus: stripeSession.payment_status };
    } catch (error: any) {
      console.error('[Sync Order] Error checking Stripe session:', error);
      return { success: false, error: error.message };
    }
  });
}
*/

/**
 * Verify a Stripe Checkout Session and get order details
 */
export async function verifyCheckoutSession(sessionId: string) {
  return safeAction(async () => {
    const { session: userSession } = await requireAuth();

    if (!sessionId) {
      return { error: "Session ID is required" };
    }

    // Retrieve the Stripe session
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (!stripeSession) {
      return { error: "Invalid session" };
    }

    // Get the order from metadata
    const orderId = stripeSession.metadata?.orderId;

    if (!orderId) {
      return { error: "Order not found in session" };
    }

    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return { error: "Order not found" };
    }

    // Verify the order belongs to the user
    if (order.userId !== userSession.user.id) {
      return { error: "Unauthorized" };
    }

    return {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: Number(order.total),
        currency: order.currency,
        items: order.items.map((item) => ({
          productName: item.productName,
          variantName: item.variantName,
          quantity: item.quantity,
          price: Number(item.price),
          total: Number(item.total),
        })),
        shippingAddress: {
          name: order.shippingName,
          addressLine1: order.shippingAddressLine1,
          addressLine2: order.shippingAddressLine2,
          city: order.shippingCity,
          state: order.shippingState,
          postalCode: order.shippingPostalCode,
          country: order.shippingCountry,
        },
      },
      paymentStatus: stripeSession.payment_status,
    };
  });
}

/**
 * Refund wallet amount for a cancelled or failed order
 * This is called when payment fails or user cancels checkout
 */
export async function refundWalletForOrder(orderId: string) {
  return safeAction(async () => {
    const { session } = await requireAuth();

    console.log(`[RefundWallet] Processing refund for order: ${orderId}`);

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        User: {
          select: { id: true },
        },
      },
    });

    if (!order) {
      console.error(`[RefundWallet] Order not found: ${orderId}`);
      return { error: "Order not found" };
    }

    // IDOR Protection: Only allow user to refund their own orders
    if (order.userId !== session.user.id) {
      console.error(`[RefundWallet] User ${session.user.id} attempted to refund order ${orderId} owned by ${order.userId}`);
      return { error: "Unauthorized" };
    }

    // Check if order is already paid or refunded
    if (order.isPaid || order.paymentStatus === 'COMPLETED') {
      console.log(`[RefundWallet] Order ${orderId} is already paid, cannot refund`);
      return { error: "Order is already paid" };
    }

    const walletAmountUsed = Number(order.walletAmountUsed || 0);

    // If no wallet amount was used, nothing to refund
    if (walletAmountUsed <= 0) {
      console.log(`[RefundWallet] No wallet amount used for order ${orderId}`);
      return { success: true, refunded: 0 };
    }

    // Check if wallet was already refunded (by checking for existing refund transaction)
    // Check for both generic and PayPal-specific refund descriptions
    const wallet = await prisma.wallet.findUnique({
      where: { userId: order.User.id },
      include: {
        transactions: {
          where: {
            OR: [
              { description: { contains: `Refund for cancelled order ${order.orderNumber}` } },
              { description: { contains: `Refund for cancelled PayPal order ${order.orderNumber}` } },
              { description: { contains: `Refund for failed PayPal payment - Order ${order.orderNumber}` } },
              { description: { contains: `Refund for denied PayPal payment - Order ${order.orderNumber}` } },
            ],
            type: 'CREDIT',
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!wallet) {
      console.error(`[RefundWallet] Wallet not found for user: ${order.User.id}`);
      return { error: "Wallet not found" };
    }

    // Check if already refunded
    if (wallet.transactions.length > 0) {
      console.log(`[RefundWallet] Wallet already refunded for order ${orderId}`);
      return { success: true, refunded: walletAmountUsed, alreadyRefunded: true };
    }

    // Refund the wallet amount
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          increment: walletAmountUsed,
        },
      },
    });

    // Create refund transaction record
    // Use PayPal-specific description if it's a PayPal order
    const refundDescription = order.paymentMethod === 'paypal'
      ? `Refund for cancelled PayPal order ${order.orderNumber}`
      : `Refund for cancelled order ${order.orderNumber}`;

    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: walletAmountUsed,
        type: 'CREDIT',
        description: refundDescription,
      },
    });

    // Update order status if not already updated
    if (order.status !== 'CANCELLED' || order.paymentStatus !== 'FAILED') {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
        },
      });
    }

    console.log(`[RefundWallet] Successfully refunded ${walletAmountUsed} EUR to wallet for order ${orderId}`);

    return { success: true, refunded: walletAmountUsed };
  });
}

/**
 * Get pending orders with wallet deductions that should be refunded
 * This is called when checkout page loads to clean up abandoned orders
 */
export async function getPendingOrdersWithWallet() {
  return safeAction(async () => {
    const { session } = await requireAuth();
    const userId = session.user.id;

    // Find orders that are:
    // 1. PENDING status
    // 2. Not paid (isPaid = false)
    // 3. Have wallet amount used > 0
    // 4. Created more than 5 minutes ago (to avoid refunding orders that are still being processed)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Find orders that are:
    // 1. PENDING status
    // 2. Not paid (isPaid = false)
    // 3. Payment status is PENDING or PROCESSING
    // 4. Have wallet amount used > 0
    // 5. Created more than 5 minutes ago (to avoid refunding orders that are still being processed)
    // 6. Either no Stripe session (user navigated away before completing) OR session is older than 30 minutes (expired)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const pendingOrders = await prisma.order.findMany({
      where: {
        userId,
        status: 'PENDING',
        isPaid: false,
        paymentStatus: {
          in: ['PENDING', 'PROCESSING'],
        },
        walletAmountUsed: {
          gt: 0,
        },
        createdAt: {
          lt: fiveMinutesAgo,
        },
        AND: [
          {
            OR: [
              // No payment session (user navigated away before payment)
              {
                AND: [
                  { stripeSessionId: null },
                  { paypalOrderId: null },
                ],
              },
              // Or Stripe session exists but order is older than 30 minutes (likely expired/abandoned)
              {
                stripeSessionId: { not: null },
                createdAt: {
                  lt: thirtyMinutesAgo,
                },
              },
              // Or PayPal order exists but order is older than 30 minutes (likely expired/abandoned)
              {
                paypalOrderId: { not: null },
                createdAt: {
                  lt: thirtyMinutesAgo,
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        orderNumber: true,
        walletAmountUsed: true,
        createdAt: true,
        stripeSessionId: true,
        paypalOrderId: true,
        paymentMethod: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      orders: pendingOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        walletAmountUsed: Number(order.walletAmountUsed),
        createdAt: order.createdAt,
      })),
    };
  });
}

/**
 * Refund wallet for all pending orders
 * This is a batch operation to clean up abandoned checkout sessions
 */
export async function refundPendingOrders() {
  return safeAction(async () => {
    const { session } = await requireAuth();
    const userId = session.user.id;

    console.log(`[RefundPendingOrders] Checking for pending orders with wallet deductions for user: ${userId}`);

    const result = await getPendingOrdersWithWallet();

    if (!result.success || !result.orders || result.orders.length === 0) {
      console.log(`[RefundPendingOrders] No pending orders found`);
      return { success: true, refunded: 0, ordersProcessed: 0 };
    }

    console.log(`[RefundPendingOrders] Found ${result.orders.length} pending orders to process`);

    let totalRefunded = 0;
    let ordersProcessed = 0;

    for (const order of result.orders) {
      try {
        const refundResult = await refundWalletForOrder(order.id);
        if (refundResult.success && refundResult.refunded) {
          totalRefunded += refundResult.refunded;
          ordersProcessed++;
          console.log(`[RefundPendingOrders] Refunded ${refundResult.refunded} EUR for order ${order.orderNumber}`);
        }
      } catch (error) {
        console.error(`[RefundPendingOrders] Error refunding order ${order.id}:`, error);
      }
    }

    console.log(`[RefundPendingOrders] Processed ${ordersProcessed} orders, total refunded: ${totalRefunded} EUR`);

    return {
      success: true,
      refunded: totalRefunded,
      ordersProcessed,
    };
  });
}

