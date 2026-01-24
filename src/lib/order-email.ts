"use server";

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { getDeliveryTime } from "@/lib/delivery-time";

// Initialize Resend client - create fresh instance each time to avoid stale state
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[Order Email] ❌ RESEND_API_KEY is not configured");
    console.error("[Order Email] Add RESEND_API_KEY=re_xxxxx to your .env file");
    return null;
  }
  console.log(`[Order Email] ✓ Resend client initialized (key: ${apiKey.substring(0, 8)}...)`);
  return new Resend(apiKey);
}

// Get the recipient email address
function getRecipientEmail(customerEmail: string): string {
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  
  console.log(`[Order Email] From email: ${fromEmail}`);
  console.log(`[Order Email] Customer email: ${customerEmail}`);
  
  // When using the Resend test domain, emails can only be sent to verified addresses
  // In production with a custom domain, send to the actual customer
  if (fromEmail === "onboarding@resend.dev") {
    const verifiedEmail = process.env.RESEND_VERIFIED_EMAIL;
    if (verifiedEmail) {
      console.log(`[Order Email] ⚠️ Test mode - redirecting to verified email: ${verifiedEmail}`);
      return verifiedEmail;
    }
    console.error(`[Order Email] ❌ Using onboarding@resend.dev but RESEND_VERIFIED_EMAIL is not set!`);
    console.error(`[Order Email] Set RESEND_FROM_EMAIL to your verified domain email (e.g., orders@yourdomain.com)`);
  } else {
    console.log(`[Order Email] ✓ Using verified domain - sending to actual customer: ${customerEmail}`);
  }
  
  return customerEmail;
}

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderDate: Date;
  items: Array<{
    id: string;
    name: string;
    variant: string;
    sku: string;
    quantity: number;
    price: number;
    imageUrl?: string;
    hasPrescription?: boolean;
    productSlug?: string | null;
    prescriptionData?: any;
  }>;
  subtotal: number;
  shipping: number;
  discount?: number;
  walletUsed?: number;
  total: number;
  currency: string;
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
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  deliveryTime?: string;
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmail(orderId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[Order Email] ========================================`);
  console.log(`[Order Email] Starting email send for order: ${orderId}`);
  
  try {
    const resendClient = getResendClient();
    if (!resendClient) {
      return { success: false, error: "Email service not configured - RESEND_API_KEY missing" };
    }

    // Fetch order with all related data
    console.log(`[Order Email] Fetching order details...`);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      console.error(`[Order Email] ❌ Order ${orderId} not found in database`);
      return { success: false, error: "Order not found" };
    }

    console.log(`[Order Email] ✓ Found order: ${order.orderNumber}`);

    if (!order.User?.email) {
      console.error(`[Order Email] ❌ No user email found for order ${orderId}`);
      return { success: false, error: "Customer email not found" };
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const recipientEmail = getRecipientEmail(order.User.email);
    
    console.log(`[Order Email] Email configuration:`);
    console.log(`[Order Email]   From: FocusRobin <${fromEmail}>`);
    console.log(`[Order Email]   To: ${recipientEmail}`);
    console.log(`[Order Email]   Subject: Order Confirmation - ${order.orderNumber}`);

    // Format order items with unique identifiers for tracking
    const items = order.items.map((item) => ({
      id: item.id,
      name: item.productName,
      variant: item.variantName,
      sku: item.sku,
      quantity: item.quantity,
      price: Number(item.price),
      imageUrl: item.imageUrl || undefined,
      hasPrescription: !!(item.prescriptionData),
      productSlug: item.Product?.slug || null,
      prescriptionData: item.prescriptionData || null,
    }));
    
    console.log(`[Order Email] Processing ${items.length} items:`, items.map(i => ({
      id: i.id,
      name: i.name,
      sku: i.sku,
      hasPrescription: i.hasPrescription,
    })));

    // Calculate delivery time
    const deliveryTime = getDeliveryTime(
      items.map((item) => ({
        prescriptionData: item.prescriptionData,
        productSlug: item.productSlug,
      })),
      order.shippingCountry
    );

    const emailData: OrderEmailData = {
      orderNumber: order.orderNumber,
      customerName: order.User.name || order.shippingName,
      customerEmail: order.User.email,
      orderDate: order.createdAt,
      items,
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      discount: Number(order.promoDiscount) > 0 ? Number(order.promoDiscount) : undefined,
      walletUsed: Number(order.walletAmountUsed) > 0 ? Number(order.walletAmountUsed) : undefined,
      total: Number(order.total),
      currency: order.currency,
      shippingAddress: {
        name: order.shippingName,
        phone: order.shippingPhone,
        addressLine1: order.shippingAddressLine1,
        addressLine2: order.shippingAddressLine2 || undefined,
        city: order.shippingCity,
        state: order.shippingState || undefined,
        postalCode: order.shippingPostalCode,
        country: order.shippingCountry,
      },
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      deliveryTime,
    };

    // Generate HTML email
    console.log(`[Order Email] Generating HTML email content...`);
    const htmlContent = generateOrderConfirmationHTML(emailData);
    console.log(`[Order Email] ✓ HTML content generated (${htmlContent.length} chars)`);

    // Send email
    console.log(`[Order Email] Sending email via Resend...`);
    const { data, error } = await resendClient.emails.send({
      from: `FocusRobin <${fromEmail}>`,
      to: recipientEmail,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: htmlContent,
    });

    if (error) {
      console.error(`[Order Email] ❌ Failed to send email:`, error);
      console.error(`[Order Email] Error details:`, JSON.stringify(error, null, 2));
      return { success: false, error: error.message || "Failed to send email" };
    }

    console.log(`[Order Email] ========================================`);
    console.log(`[Order Email] ✅ SUCCESS! Email sent for order ${order.orderNumber}`);
    console.log(`[Order Email]    Recipient: ${recipientEmail}`);
    console.log(`[Order Email]    Email ID: ${data?.id || 'N/A'}`);
    console.log(`[Order Email] ========================================`);
    return { success: true };
  } catch (error: any) {
    console.error(`[Order Email] ❌ Exception sending order confirmation:`, error);
    console.error(`[Order Email] Stack trace:`, error.stack);
    return { success: false, error: error.message || "Unknown error" };
  }
}

/**
 * Generate HTML email template for order confirmation
 */
function generateOrderConfirmationHTML(data: OrderEmailData): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.currency,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const statusColors: Record<string, string> = {
    PENDING: '#FFA500',
    CONFIRMED: '#4CAF50',
    PROCESSING: '#2196F3',
    SHIPPED: '#9C27B0',
    DELIVERED: '#4CAF50',
    CANCELLED: '#F44336',
  };

  const statusColor = statusColors[data.orderStatus] || '#666';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - ${data.orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2A9D9A 0%, #1E7A78 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">FocusRobin</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Order Confirmation</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi ${data.customerName},
              </p>
              <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Thank you for your order! We've received your order and are preparing it for shipment.
              </p>
              
              <!-- Order Summary -->
              <div style="background-color: #f9f9f9; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 20px; font-weight: bold;">Order Summary</h2>
                
                <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Order Number:</td>
                    <td style="padding: 8px 0; text-align: right; color: #333333; font-size: 14px; font-weight: bold;">${data.orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Order Date:</td>
                    <td style="padding: 8px 0; text-align: right; color: #333333; font-size: 14px;">${formatDate(data.orderDate)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Status:</td>
                    <td style="padding: 8px 0; text-align: right;">
                      <span style="display: inline-block; padding: 4px 12px; background-color: ${statusColor}; color: #ffffff; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                        ${data.orderStatus}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Payment Method:</td>
                    <td style="padding: 8px 0; text-align: right; color: #333333; font-size: 14px; text-transform: capitalize;">${data.paymentMethod.replace('-', ' ')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Payment Status:</td>
                    <td style="padding: 8px 0; text-align: right; color: #333333; font-size: 14px; text-transform: capitalize;">${data.paymentStatus}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Order Items -->
              <div style="margin-bottom: 30px;">
                <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 20px; font-weight: bold;">Order Items</h2>
                ${data.items.map((item) => `
                  <div style="display: flex; padding: 20px 0; border-bottom: 1px solid #e0e0e0;">
                    ${item.imageUrl ? `
                      <div style="flex-shrink: 0; width: 80px; height: 80px; margin-right: 15px; border-radius: 4px; overflow: hidden; background-color: #f0f0f0;">
                        <img src="${item.imageUrl}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;" />
                      </div>
                    ` : ''}
                    <div style="flex: 1;">
                      <h3 style="margin: 0 0 5px 0; color: #333333; font-size: 16px; font-weight: bold;">${item.name}</h3>
                      <p style="margin: 0 0 5px 0; color: #666666; font-size: 14px;">${item.variant} • SKU: ${item.sku}</p>
                      ${item.hasPrescription ? '<p style="margin: 0 0 5px 0; color: #2A9D9A; font-size: 12px; font-weight: bold;">📋 Includes Prescription Lenses</p>' : ''}
                      <p style="margin: 0; color: #666666; font-size: 14px;">Quantity: ${item.quantity} × ${formatCurrency(item.price)} = ${formatCurrency(item.price * item.quantity)}</p>
                    </div>
                    <div style="text-align: right;">
                      <p style="margin: 0; color: #333333; font-size: 16px; font-weight: bold;">${formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
              
              <!-- Totals -->
              <div style="background-color: #f9f9f9; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Subtotal:</td>
                    <td style="padding: 8px 0; text-align: right; color: #333333; font-size: 14px;">${formatCurrency(data.subtotal)}</td>
                  </tr>
                  ${data.discount ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Discount:</td>
                    <td style="padding: 8px 0; text-align: right; color: #4CAF50; font-size: 14px;">-${formatCurrency(data.discount)}</td>
                  </tr>
                  ` : ''}
                  ${data.walletUsed ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Wallet Used:</td>
                    <td style="padding: 8px 0; text-align: right; color: #4CAF50; font-size: 14px;">-${formatCurrency(data.walletUsed)}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Shipping:</td>
                    <td style="padding: 8px 0; text-align: right; color: #333333; font-size: 14px;">${formatCurrency(data.shipping)}</td>
                  </tr>
                  <tr style="border-top: 2px solid #e0e0e0; margin-top: 10px;">
                    <td style="padding: 12px 0 0 0; color: #333333; font-size: 18px; font-weight: bold;">Total:</td>
                    <td style="padding: 12px 0 0 0; text-align: right; color: #2A9D9A; font-size: 20px; font-weight: bold;">${formatCurrency(data.total)}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Shipping Address -->
              <div style="background-color: #f9f9f9; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px 0; color: #333333; font-size: 18px; font-weight: bold;">Shipping Address</h2>
                <p style="margin: 0 0 5px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                  ${data.shippingAddress.name}<br>
                  ${data.shippingAddress.addressLine1}<br>
                  ${data.shippingAddress.addressLine2 ? `${data.shippingAddress.addressLine2}<br>` : ''}
                  ${data.shippingAddress.city}${data.shippingAddress.state ? `, ${data.shippingAddress.state}` : ''} ${data.shippingAddress.postalCode}<br>
                  ${data.shippingAddress.country}<br>
                  Phone: ${data.shippingAddress.phone}
                </p>
                ${data.deliveryTime ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
                  <p style="margin: 0; color: #333333; font-size: 14px; font-weight: bold;">
                    📦 Expected Delivery: ${data.deliveryTime}
                  </p>
                </div>
                ` : ''}
              </div>
              
              <!-- Footer -->
              <p style="margin: 30px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                We'll send you another email when your order ships with your tracking ID. If you have any questions, please don't hesitate to contact us.
              </p>
              <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Thank you for shopping with FocusRobin!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 12px;">
                © ${new Date().getFullYear()} FocusRobin. All rights reserved.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                This is an automated email. Please do not reply to this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
