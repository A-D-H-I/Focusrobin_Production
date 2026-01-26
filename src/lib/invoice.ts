"use server";

import { prisma } from '@/lib/prisma';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

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
 * Generate PDF Invoice matching the new template design
 * Single page invoice with dark blue/yellow theme, no discounts shown
 */
export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.create();
    
    // Embed fonts
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Colors matching the template
    const darkBlue = rgb(0.1, 0.2, 0.4);
    const yellow = rgb(1.0, 0.84, 0.0);
    const blackColor = rgb(0, 0, 0);
    const whiteColor = rgb(1.0, 1.0, 1.0);
    const lightGray = rgb(0.9, 0.9, 0.9);
    
    // Create page
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    
    // Logo area - load and embed actual FocusRobin logo (no background)
    const logoX = 30;
    const logoY = height - 50;
    
    try {
      // Load the SVG logo and convert to PNG (keep original colors)
      const logoPath = join(process.cwd(), 'public', 'logo', 'Horizontal Primary dark (Color).svg');
      const svgBuffer = readFileSync(logoPath);
      
      // Convert SVG to PNG (keep original colors, no greyscale or tint)
      const pngBuffer = await sharp(svgBuffer)
        .resize(280, null, { fit: 'contain' }) // Larger size for bigger logo
        .png()
        .toBuffer();
      
      // Embed the logo image in the PDF
      const logoImage = await pdfDoc.embedPng(pngBuffer);
      const logoDims = logoImage.scale(0.75); // Larger scale for bigger logo
      
      // Draw the logo (original colors, no background)
      page.drawImage(logoImage, {
        x: logoX,
        y: logoY - 20,
        width: logoDims.width,
        height: logoDims.height,
      });
    } catch (error) {
      console.warn('[Invoice] Could not load logo, using text fallback:', error);
      // Fallback to text if logo loading fails
      page.drawText('FOCUSROBIN', {
        x: logoX + 10,
        y: logoY - 5,
        size: 18,
        font: helveticaBold,
        color: blackColor,
      });
    }
    
    // INVOICE text on top right
    page.drawText('INVOICE', {
      x: 400,
      y: height - 50,
      size: 36,
      font: helveticaBold,
      color: blackColor,
    });
    
    // Invoice Details Section (left side)
    let yPos = height - 150;
    const invoiceDateStr = invoiceData.orderDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    page.drawText('INVOICE #', {
      x: 50,
      y: yPos,
      size: 11,
      font: helveticaBold,
      color: blackColor,
    });
    page.drawText(invoiceData.orderNumber, {
      x: 150,
      y: yPos,
      size: 11,
      font: helvetica,
      color: blackColor,
    });
    
    yPos -= 20;
    page.drawText('INVOICE DATE :', {
      x: 50,
      y: yPos,
      size: 11,
      font: helvetica,
      color: blackColor,
    });
    page.drawText(invoiceDateStr, {
      x: 180,
      y: yPos,
      size: 11,
      font: helvetica,
      color: blackColor,
    });
    
    // BILL TO section (right side)
    let billToY = height - 150;
    page.drawText('BILL TO', {
      x: 400,
      y: billToY,
      size: 12,
      font: helveticaBold,
      color: blackColor,
    });
    
    billToY -= 20;
    const billingAddress = [
      invoiceData.customerName,
      invoiceData.shippingAddress.addressLine1,
      invoiceData.shippingAddress.addressLine2,
      `${invoiceData.shippingAddress.city}, ${invoiceData.shippingAddress.postalCode}`,
      invoiceData.shippingAddress.state,
      invoiceData.shippingAddress.country,
    ].filter(Boolean);
    
    billingAddress.forEach((line) => {
      page.drawText(line, {
        x: 400,
        y: billToY,
        size: 10,
        font: helvetica,
        color: blackColor,
      });
      billToY -= 15;
    });
    
    // Table Header: Yellow bar
    yPos = height - 320;
    const tableHeaderY = yPos;
    const tableHeaderHeight = 30;
    
    page.drawRectangle({
      x: 50,
      y: tableHeaderY - tableHeaderHeight,
      width: width - 100,
      height: tableHeaderHeight,
      color: yellow,
    });
    
    // Table column headers
    const headerTextY = tableHeaderY - 20;
    page.drawText('NO', {
      x: 60,
      y: headerTextY,
      size: 11,
      font: helveticaBold,
      color: blackColor,
    });
    page.drawText('DESCRIPTION', {
      x: 120,
      y: headerTextY,
      size: 11,
      font: helveticaBold,
      color: blackColor,
    });
    page.drawText('PRICE', {
      x: 350,
      y: headerTextY,
      size: 11,
      font: helveticaBold,
      color: blackColor,
    });
    page.drawText('QTY', {
      x: 420,
      y: headerTextY,
      size: 11,
      font: helveticaBold,
      color: blackColor,
    });
    page.drawText('TOTAL', {
      x: 480,
      y: headerTextY,
      size: 11,
      font: helveticaBold,
      color: blackColor,
    });
    
    // Items rows with alternating colors
    yPos = tableHeaderY - tableHeaderHeight - 25;
    invoiceData.items.forEach((item, index) => {
      const isEven = index % 2 === 0;
      const rowColor = isEven ? lightGray : whiteColor;
      const rowHeight = 25;
      
      // Draw row background
      page.drawRectangle({
        x: 50,
        y: yPos - rowHeight,
        width: width - 100,
        height: rowHeight,
        color: rowColor,
      });
      
      // Item number
      page.drawText((index + 1).toString(), {
        x: 60,
        y: yPos - 18,
        size: 10,
        font: helvetica,
        color: blackColor,
      });
      
      // Description with color and SKU (truncate if too long)
      const colorText = item.variant ? ` - ${item.variant}` : '';
      const skuText = item.sku ? ` (${item.sku})` : '';
      const fullDescription = `${item.name}${colorText}${skuText}`;
      const description = fullDescription.length > 40 ? fullDescription.substring(0, 40) + '...' : fullDescription;
      page.drawText(description, {
        x: 120,
        y: yPos - 18,
        size: 10,
        font: helvetica,
        color: blackColor,
      });
      
      // Price
      page.drawText(`${invoiceData.currency} ${item.price.toFixed(2)}`, {
        x: 350,
        y: yPos - 18,
        size: 10,
        font: helvetica,
        color: blackColor,
      });
      
      // Quantity
      page.drawText(item.quantity.toString(), {
        x: 420,
        y: yPos - 18,
        size: 10,
        font: helvetica,
        color: blackColor,
      });
      
      // Total
      page.drawText(`${invoiceData.currency} ${item.total.toFixed(2)}`, {
        x: 480,
        y: yPos - 18,
        size: 10,
        font: helvetica,
        color: blackColor,
      });
      
      yPos -= rowHeight;
    });
    
    // Totals Section
    yPos -= 30;
    
    // Calculate original subtotal (before discounts)
    const originalSubtotal = invoiceData.subtotal + invoiceData.shipping;
    const totalDiscount = invoiceData.discount + invoiceData.walletAmount;
    const finalTotal = invoiceData.total;
    
    // SUB-TOTAL - Always show the original subtotal
    page.drawText('SUB-TOTAL', {
      x: 400,
      y: yPos,
      size: 11,
      font: helvetica,
      color: blackColor,
    });
    page.drawText(`${invoiceData.currency} ${originalSubtotal.toFixed(2)}`, {
      x: 480,
      y: yPos,
      size: 11,
      font: helvetica,
      color: blackColor,
    });
    
    // DISCOUNT - Show discount amount if there's any discount
    if (totalDiscount > 0) {
      yPos -= 25; // Add spacing between subtotal and discount
      page.drawText('DISCOUNT', {
        x: 400,
        y: yPos,
        size: 11,
        font: helvetica,
        color: blackColor,
      });
      page.drawText(`-${invoiceData.currency} ${totalDiscount.toFixed(2)}`, {
        x: 480,
        y: yPos,
        size: 11,
        font: helvetica,
        color: blackColor,
      });
    }
    
    // Total bar (yellow)
    yPos -= 30;
    const totalBarHeight = 35;
    page.drawRectangle({
      x: 400,
      y: yPos - totalBarHeight,
      width: 145,
      height: totalBarHeight,
      color: yellow,
    });
    
    page.drawText('Total', {
      x: 410,
      y: yPos - 22,
      size: 12,
      font: helveticaBold,
      color: blackColor,
    });
    page.drawText(`${invoiceData.currency} ${finalTotal.toFixed(2)}`, {
      x: 480,
      y: yPos - 22,
      size: 12,
      font: helveticaBold,
      color: blackColor,
    });
    
    // Payment Method Section (left side, below items)
    yPos = yPos - totalBarHeight - 40;
    page.drawText('PAYMENT METHOD', {
      x: 50,
      y: yPos,
      size: 11,
      font: helveticaBold,
      color: blackColor,
    });
    
    yPos -= 20;
    page.drawText(invoiceData.paymentMethod || 'Online Payment', {
      x: 50,
      y: yPos,
      size: 10,
      font: helvetica,
      color: blackColor,
    });
    
    // Footer: THANK YOU FOR YOUR PURCHASE
    page.drawText('THANK YOU FOR YOUR PURCHASE', {
      x: width / 2 - 120,
      y: 50,
      size: 14,
      font: helveticaBold,
      color: blackColor,
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

