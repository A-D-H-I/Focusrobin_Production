"use server";

import { prisma } from '@/lib/prisma';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface InvoiceData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderDate: Date;
  items: Array<{
    id: string; // Unique item ID for tracking
    name: string;
    variant: string;
    sku: string; // SKU for item identification
    quantity: number;
    price: number; // Final price after product discount
    originalPrice?: number; // Original price before product discount
    discountPct?: number; // Product discount percentage
    total: number;
    hasPrescription?: boolean; // Whether this item has prescription
  }>;
  subtotal: number;
  shipping: number;
  discount: number; // Promo code discount
  walletAmount: number; // Wallet amount used
  tax: number; // Tax amount (if applicable)
  total: number;
  currency: string;
  shippingAddress: {
    name: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state?: string | null;
    postalCode: string;
    country: string;
  };
  // Company contact information
  companyName?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  // Payment information
  paymentMethod?: string;
  dueDate?: Date;
}

/**
 * Generate PDF Invoice with orange background and white text (brand colors)
 */
export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.create();
    
    // Embed fonts
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Colors - Orange background with white text (brand colors)
    const orangeBackground = rgb(1.0, 0.647, 0.0); // Vibrant orange #FFA500
    const whiteColor = rgb(1.0, 1.0, 1.0);
    const blackColor = rgb(0, 0, 0);
    
    // Create page
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    
    // Fill entire page with orange background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: height,
      color: orangeBackground,
    });
    
    // Header Section - Company Name and Contact Info
    let yPos = height - 50;
    
    // Company Name (large, white, bold)
    page.drawText(invoiceData.companyName || 'FocusRobin', {
      x: 50,
      y: yPos,
      size: 32,
      font: helveticaBold,
      color: whiteColor,
    });
    
    // Contact Information (right side, top)
    const contactInfo = [
      invoiceData.companyPhone || '+123-456-7890',
      invoiceData.companyEmail || 'hello@focusrobin.com',
      invoiceData.companyAddress || '123 Anywhere St., Any City',
    ];
    
    let contactY = height - 50;
    contactInfo.forEach((info) => {
      page.drawText(info, {
        x: 400,
        y: contactY,
        size: 10,
        font: helvetica,
        color: whiteColor,
      });
      contactY -= 15;
    });
    
    // Invoice Title
    yPos -= 50;
    page.drawText('Invoice', {
      x: 50,
      y: yPos,
      size: 28,
      font: helveticaBold,
      color: whiteColor,
    });
    
    // Invoice Details (left side)
    yPos -= 40;
    page.drawText(`Invoice Number: [${invoiceData.orderNumber}]`, {
      x: 50,
      y: yPos,
      size: 12,
      font: helvetica,
      color: whiteColor,
    });
    
    yPos -= 20;
    page.drawText(`Billed To: ${invoiceData.customerName}`, {
      x: 50,
      y: yPos,
      size: 12,
      font: helvetica,
      color: whiteColor,
    });
    
    // Date and Due Date (right side)
    const dateStr = invoiceData.orderDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const dueDateStr = invoiceData.dueDate?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }) || '';
    
    let dateY = height - 130;
    page.drawText(`Date: [${dateStr}]`, {
      x: 400,
      y: dateY,
      size: 12,
      font: helvetica,
      color: whiteColor,
    });
    
    dateY -= 20;
    page.drawText(`Due Date: [${dueDateStr}]`, {
      x: 400,
      y: dateY,
      size: 12,
      font: helvetica,
      color: whiteColor,
    });
    
    // Draw horizontal line separator
    yPos = height - 220;
    page.drawLine({
      start: { x: 50, y: yPos },
      end: { x: 545, y: yPos },
      thickness: 1,
      color: whiteColor,
    });
    
    // Items Section
    yPos -= 30;
    
    // Items Table Header
    page.drawText('Item', {
      x: 50,
      y: yPos,
      size: 11,
      font: helveticaBold,
      color: whiteColor,
    });
    page.drawText('Quantity', {
      x: 250,
      y: yPos,
      size: 11,
      font: helveticaBold,
      color: whiteColor,
    });
    page.drawText('Unit Price', {
      x: 350,
      y: yPos,
      size: 11,
      font: helveticaBold,
      color: whiteColor,
    });
    page.drawText('Total Price', {
      x: 450,
      y: yPos,
      size: 11,
      font: helveticaBold,
      color: whiteColor,
    });
    
    // Items List
    yPos -= 25;
    invoiceData.items.forEach((item) => {
      // Truncate long names if needed
      const itemName = item.name.length > 40 ? item.name.substring(0, 40) + '...' : item.name;
      
      page.drawText(itemName, {
        x: 50,
        y: yPos,
        size: 10,
        font: helvetica,
        color: whiteColor,
      });
      
      // Show discount info if applicable
      if (item.originalPrice && item.discountPct) {
        page.drawText(`(${item.discountPct}% off)`, {
          x: 50,
          y: yPos - 12,
          size: 8,
          font: helvetica,
          color: whiteColor,
        });
      }
      
      page.drawText(item.quantity.toString(), {
        x: 250,
        y: yPos,
        size: 10,
        font: helvetica,
        color: whiteColor,
      });
      
      // Show original price with strikethrough if discounted
      if (item.originalPrice && item.discountPct) {
        page.drawText(`${invoiceData.currency} ${item.originalPrice.toFixed(2)}`, {
          x: 350,
          y: yPos + 10,
          size: 8,
          font: helvetica,
          color: rgb(0.8, 0.8, 0.8),
        });
        // Draw line through original price
        page.drawLine({
          start: { x: 350, y: yPos + 12 },
          end: { x: 410, y: yPos + 12 },
          thickness: 0.5,
          color: rgb(0.8, 0.8, 0.8),
        });
      }
      
      page.drawText(`${invoiceData.currency} ${item.price.toFixed(2)}`, {
        x: 350,
        y: yPos,
        size: 10,
        font: helvetica,
        color: whiteColor,
      });
      page.drawText(`${invoiceData.currency} ${item.total.toFixed(2)}`, {
        x: 450,
        y: yPos,
        size: 10,
        font: helvetica,
        color: whiteColor,
      });
      yPos -= item.originalPrice ? 30 : 20;
    });
    
    // Summary Section
    yPos -= 20;
    // Draw horizontal line separator
    page.drawLine({
      start: { x: 50, y: yPos + 10 },
      end: { x: 545, y: yPos + 10 },
      thickness: 1,
      color: whiteColor,
    });
    
    yPos -= 20;
    
    // Subtotal
    page.drawText('SUBTOTAL:', {
      x: 370,
      y: yPos,
      size: 11,
      font: helveticaBold,
      color: whiteColor,
    });
    page.drawText(`${invoiceData.currency} ${(invoiceData.subtotal + invoiceData.shipping).toFixed(2)}`, {
      x: 470,
      y: yPos,
      size: 11,
      font: helvetica,
      color: whiteColor,
    });
    
    // Discount
    yPos -= 20;
    page.drawText('DISCOUNT:', {
      x: 370,
      y: yPos,
      size: 11,
      font: helveticaBold,
      color: whiteColor,
    });
    page.drawText(`${invoiceData.currency} ${invoiceData.discount.toFixed(2)}`, {
      x: 470,
      y: yPos,
      size: 11,
      font: helvetica,
      color: whiteColor,
    });
    
    // Wallet Amount
    if (invoiceData.walletAmount > 0) {
      yPos -= 20;
      page.drawText('WALLET AMOUNT:', {
        x: 370,
        y: yPos,
        size: 11,
        font: helveticaBold,
        color: whiteColor,
      });
      page.drawText(`-${invoiceData.currency} ${invoiceData.walletAmount.toFixed(2)}`, {
        x: 470,
        y: yPos,
        size: 11,
        font: helvetica,
        color: whiteColor,
      });
    }
    
    // Total
    yPos -= 25;
    page.drawText('TOTAL:', {
      x: 370,
      y: yPos,
      size: 14,
      font: helveticaBold,
      color: whiteColor,
    });
    page.drawText(`${invoiceData.currency} ${invoiceData.total.toFixed(2)}`, {
      x: 470,
      y: yPos,
      size: 14,
      font: helveticaBold,
      color: whiteColor,
    });
    
    // Draw horizontal line separator
    yPos -= 30;
    page.drawLine({
      start: { x: 50, y: yPos + 10 },
      end: { x: 545, y: yPos + 10 },
      thickness: 1,
      color: whiteColor,
    });
    
    // Payment Section
    yPos -= 30;
    page.drawText('Payment', {
      x: 50,
      y: yPos,
      size: 24,
      font: helveticaBold,
      color: whiteColor,
    });
    
    yPos -= 30;
    page.drawText(`Payment Method: ${invoiceData.paymentMethod || 'Online Payment'}`, {
      x: 50,
      y: yPos,
      size: 12,
      font: helvetica,
      color: whiteColor,
    });
    
    // Thank You Message (right side)
    page.drawText('THANK YOU!', {
      x: 400,
      y: yPos,
      size: 24,
      font: helveticaBold,
      color: whiteColor,
    });
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw error;
  }
}

/**
 * Get invoice data from order
 * Includes unique item IDs and SKUs for proper item tracking
 */
export async function getInvoiceDataFromOrder(orderId: string): Promise<InvoiceData | null> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            Product: {
              select: {
                discountPct: true,
                basePrice: true,
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
      console.error(`[Invoice] Order not found: ${orderId}`);
      return null;
    }

    // Get discount and wallet amount
    const discount = Number(order.promoDiscount || 0);
    const walletAmount = Number(order.walletAmountUsed || 0);
    
    console.log(`[Invoice] Processing order ${order.orderNumber} with ${order.items.length} items:`);
    
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.User?.name || order.shippingName || 'Customer',
      customerEmail: order.User?.email || 'customer@example.com',
      orderDate: order.createdAt,
      items: order.items.map((item, index) => {
        const finalPrice = Number(item.price);
        const discountPct = item.Product?.discountPct || 0;
        const originalPrice = discountPct > 0 ? finalPrice / (1 - discountPct / 100) : finalPrice;
        const hasPrescription = !!(item.prescriptionData);
        
        console.log(`[Invoice]   Item ${index + 1}: ${item.productName} (${item.variantName}) - SKU: ${item.sku}, ID: ${item.id}, HasPrescription: ${hasPrescription}, Price: €${finalPrice}, Qty: ${item.quantity}, Total: €${Number(item.total)}`);
        
        return {
          id: item.id,
          name: item.productName,
          variant: item.variantName,
          sku: item.sku,
          quantity: item.quantity,
          price: finalPrice,
          originalPrice: discountPct > 0 ? originalPrice : undefined,
          discountPct: discountPct > 0 ? discountPct : undefined,
          total: Number(item.total),
          hasPrescription,
        };
      }),
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      discount: discount,
      walletAmount: walletAmount,
      tax: 0,
      total: Number(order.total),
      currency: order.currency,
      shippingAddress: {
        name: order.shippingName,
        addressLine1: order.shippingAddressLine1,
        addressLine2: order.shippingAddressLine2,
        city: order.shippingCity,
        state: order.shippingState,
        postalCode: order.shippingPostalCode,
        country: order.shippingCountry,
      },
      companyName: 'FocusRobin',
      companyPhone: '+123-456-7890',
      companyEmail: 'hello@focusrobin.com',
      companyAddress: '123 Anywhere St., Any City',
      paymentMethod: order.paymentMethod || 'Online Payment',
      dueDate: new Date(order.createdAt.getTime() + 9 * 24 * 60 * 60 * 1000), // 9 days from order date
    };
  } catch (error) {
    console.error('[Invoice] Error getting invoice data:', error);
    return null;
  }
}

