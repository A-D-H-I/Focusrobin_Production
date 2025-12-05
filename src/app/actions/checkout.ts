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
}

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `ORD-${year}-${random}`;
}

// Helper function to normalize image URLs
function normalizeImageUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('/')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
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

    // Get user's cart with items
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
      return { error: "Your cart is empty" };
    }

    // Calculate totals and build order items
    let subtotal = 0;
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
    }[] = [];

    const stripeLineItems: {
      price_data: {
        currency: string;
        product_data: {
          name: string;
          description?: string;
          images?: string[];
        };
        unit_amount: number;
      };
      quantity: number;
    }[] = [];

    for (const cartItem of cart.items) {
      const variant = cartItem.Product.ProductVariant.find(
        (v) => v.id === cartItem.variantId
      );

      if (!variant) {
        return { error: `Variant not found for ${cartItem.Product.name}` };
      }

      // Check stock
      if (variant.stock < cartItem.quantity) {
        return {
          error: `Not enough stock for ${cartItem.Product.name} (${variant.name}). Available: ${variant.stock}`,
        };
      }

      const price = variant.price
        ? Number(variant.price)
        : Number(cartItem.Product.basePrice);
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

      // Build Stripe line item
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:9002';
      let productImage: string | undefined = undefined;
      
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
        const trimmedUrl = imageUrl.trim();
        
        // Ensure we have a valid absolute URL for Stripe
        if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
          // Already an absolute URL - validate it
          try {
            const testUrl = new URL(trimmedUrl);
            if (testUrl.protocol !== 'http:' && testUrl.protocol !== 'https:') {
              throw new Error(`Invalid protocol: ${testUrl.protocol}`);
            }
            // Ensure it's a valid URL format
            if (!testUrl.hostname) {
              throw new Error('Missing hostname');
            }
            productImage = trimmedUrl;
            console.log(`Valid absolute image URL for ${cartItem.Product.name}: ${trimmedUrl}`);
          } catch (urlError) {
            console.warn(`Invalid absolute image URL for product ${cartItem.Product.name}: ${trimmedUrl}`, urlError);
            productImage = undefined;
          }
        } else {
          // Construct absolute URL from relative path
          // Clean the path - remove any problematic characters
          let cleanImageUrl = trimmedUrl;
          if (!cleanImageUrl.startsWith('/')) {
            cleanImageUrl = `/${cleanImageUrl}`;
          }
          // Remove any double slashes (except after protocol)
          cleanImageUrl = cleanImageUrl.replace(/([^:]\/)\/+/g, '$1');
          
          const fullImageUrl = `${baseUrl}${cleanImageUrl}`;
          
          // Validate the URL before adding
          try {
            const testUrl = new URL(fullImageUrl);
            // Ensure it's a valid HTTP/HTTPS URL
            if (testUrl.protocol !== 'http:' && testUrl.protocol !== 'https:') {
              throw new Error(`Invalid protocol: ${testUrl.protocol}`);
            }
            if (!testUrl.hostname) {
              throw new Error('Missing hostname');
            }
            productImage = fullImageUrl;
            console.log(`Valid constructed image URL for ${cartItem.Product.name}: ${fullImageUrl}`);
          } catch (urlError) {
            console.warn(`Invalid image URL for product ${cartItem.Product.name}. Original: ${imageUrl}, Constructed: ${fullImageUrl}`, urlError);
            // Skip image if URL is invalid - Stripe will work without images
            productImage = undefined;
          }
        }
      } else {
        console.log(`No image URL for product ${cartItem.Product.name} (imageUrl: ${imageUrl})`);
      }

      const lineItem: any = {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${cartItem.Product.name} - ${variant.name}`,
            description: `SKU: ${variant.sku}`,
          },
          unit_amount: Math.round(price * 100), // Stripe uses cents
        },
        quantity: cartItem.quantity,
      };

      // Only add images if we have a valid, verified URL
      // Temporarily disable images to test if they're causing the issue
      // TODO: Re-enable images once URL validation is confirmed working
      if (productImage && false) { // Temporarily disabled
        // Double-verify the URL before adding
        try {
          const finalUrl = new URL(productImage!);
          if (finalUrl.protocol === 'http:' || finalUrl.protocol === 'https:') {
            lineItem.price_data.product_data.images = [productImage];
            console.log(`Added image URL for ${cartItem.Product.name}: ${productImage}`);
          }
        } catch (finalCheck) {
          console.warn(`Final URL check failed for ${cartItem.Product.name}: ${productImage}`, finalCheck);
        }
      }

      stripeLineItems.push(lineItem);
    }

    const shipping = 0; // Free shipping
    const walletAmount = checkoutData.walletAmount || 0;
    const total = Math.max(0, subtotal + shipping - walletAmount);

    // Validate total is greater than 0
    if (total <= 0) {
      return { error: "Order total must be greater than 0" };
    }

    // Determine shipping provider
    const shippingProvider = getShippingProvider(checkoutData.shippingAddress.country);

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
          })),
        },
      },
    });

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
    const cancelUrl = `${validBaseUrl}/checkout?cancelled=true`;
    
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

    // Log line items for debugging (without sensitive data)
    console.log("Creating Stripe session with:", {
      lineItemsCount: stripeLineItems.length,
      lineItems: stripeLineItems.map(item => ({
        name: item.price_data.product_data.name,
        amount: item.price_data.unit_amount,
        quantity: item.quantity,
        hasImage: !!item.price_data.product_data.images,
        imageUrl: item.price_data.product_data.images?.[0]?.substring(0, 50) + '...',
      })),
      successUrl,
      cancelUrl,
    });

    try {
      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: session.user.email || undefined,
        line_items: stripeLineItems,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId: userId,
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        shipping_address_collection: {
          allowed_countries: ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'CH', 'NO', 'IS'],
        },
      });

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
 * Sync order status with Stripe (fallback if webhook hasn't fired)
 */
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

