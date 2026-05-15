"use server";

import { prisma } from '@/lib/prisma';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { getFriendlyLensDescription } from '@/lib/lensPricing';

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
    prescriptionData?: any; // Full data for display
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
  // Business customer information
  isBusinessPurchase?: boolean;
  businessName?: string;
  businessNumber?: string;
  vatNumber?: string;
}

/**
 * Helper to sanitize text for PDF-Lib standard fonts (WinAnsi encoding)
 * Removes diacritics/accents from characters (e.g., 'č' -> 'c')
 */
const sanitizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  // Convert characters with diacritics to base characters and remove the combining marks
  // Additionally, replace unsupported characters with their closest ASCII equivalent or strip them
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace smart quotes and other common unsupported characters
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2026]/g, '...')
    // Remove any remaining non-ASCII characters that aren't common punctuation
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
};

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
    page.drawText(sanitizeText(invoiceData.orderNumber), {
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

    // Build billing address with business info if applicable
    const billingLines: string[] = [];

    // Add business info first if it's a business purchase
    if (invoiceData.isBusinessPurchase && invoiceData.businessName) {
      billingLines.push(sanitizeText(invoiceData.businessName));
      if (invoiceData.businessNumber) {
        billingLines.push(`Reg. No: ${sanitizeText(invoiceData.businessNumber)}`);
      }
      if (invoiceData.vatNumber) {
        billingLines.push(`VAT: ${sanitizeText(invoiceData.vatNumber)}`);
      }
    }

    // Add customer name and address
    billingLines.push(sanitizeText(invoiceData.customerName));
    billingLines.push(sanitizeText(invoiceData.shippingAddress.addressLine1));
    if (invoiceData.shippingAddress.addressLine2) {
      billingLines.push(sanitizeText(invoiceData.shippingAddress.addressLine2));
    }
    billingLines.push(`${sanitizeText(invoiceData.shippingAddress.city)}, ${sanitizeText(invoiceData.shippingAddress.postalCode)}`);
    if (invoiceData.shippingAddress.state) {
      billingLines.push(sanitizeText(invoiceData.shippingAddress.state));
    }
    billingLines.push(sanitizeText(invoiceData.shippingAddress.country));

    billingLines.forEach((line) => {
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
      const hasRx = item.hasPrescription && item.prescriptionData?.rxConfig?.lensBundle;
      const rowHeight = hasRx ? 45 : 35;
      const centerY = yPos - (rowHeight / 2) - 3; // Approx vertical center for text

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
        y: centerY,
        size: 10,
        font: helvetica,
        color: blackColor,
      });

      // Description with color and SKU (split into two lines if needed)
      const colorText = item.variant ? ` - ${item.variant}` : '';
      const skuText = item.sku ? ` (${item.sku})` : '';

      // Line 1: Product Name + Variant + SKU
      const mainDescription = sanitizeText(`${item.name}${colorText}${skuText}`);
      const displayMain = mainDescription.length > 45 ? mainDescription.substring(0, 45) + '...' : mainDescription;

      page.drawText(displayMain, {
        x: 120,
        y: yPos - 14,
        size: 10,
        font: helveticaBold, // Bold for main item
        color: blackColor,
      });

      // Line 2 & 3: Lens Info (if applicable)
      if (hasRx) {
        const lensDesc = getFriendlyLensDescription(item.prescriptionData.rxConfig);
        if (lensDesc) {
          const parts = lensDesc.split(' - ');
          const topPart = `Rx: ${parts[0]}`;
          const bottomPart = parts.slice(1).join(' - ');

          page.drawText(topPart.length > 70 ? topPart.substring(0, 70) + '...' : topPart, {
            x: 120,
            y: yPos - 26,
            size: 9, // Smaller font for detail
            font: helvetica,
            color: rgb(0.3, 0.3, 0.3), // Dark gray
          });

          if (bottomPart) {
            const displayBottom = bottomPart.length > 80 ? bottomPart.substring(0, 80) + '...' : bottomPart;
            page.drawText(displayBottom, {
              x: 120,
              y: yPos - 36,
              size: 8, // Even smaller for description
              font: helvetica,
              color: rgb(0.4, 0.4, 0.4),
            });
          }
        }
      }

      // Price
      page.drawText(`${invoiceData.currency} ${item.price.toFixed(2)}`, {
        x: 350,
        y: centerY,
        size: 10,
        font: helvetica,
        color: blackColor,
      });

      // Quantity
      page.drawText(item.quantity.toString(), {
        x: 420,
        y: centerY,
        size: 10,
        font: helvetica,
        color: blackColor,
      });

      // Total
      page.drawText(`${invoiceData.currency} ${item.total.toFixed(2)}`, {
        x: 480,
        y: centerY,
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
    page.drawText(sanitizeText(invoiceData.paymentMethod) || 'Online Payment', {
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

        let prescriptionDescription = "";
        const itemPrescriptionData = item.prescriptionData as any;

        // Extract friendly lens description if available
        if (itemPrescriptionData && itemPrescriptionData.rxConfig && itemPrescriptionData.rxConfig.lensBundle) {
          // Import this dynamically or assume we can access the helper
          // For now, let's hardcode the logic or use the helper if available in scope
          // Since we can't easily import inside this function without top-level import, 
          // let's rely on the top-level import which we will add next.
          // Note: We need to update imports first.
        }

        const hasPrescription = !!(item.prescriptionData);

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
          prescriptionData: item.prescriptionData, // Pass full data to use in PDF generation
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
      // Business customer information
      isBusinessPurchase: order.isBusinessPurchase || false,
      businessName: order.businessName || undefined,
      businessNumber: order.businessNumber || undefined,
      vatNumber: order.vatNumber || undefined,
    };
  } catch (error) {
    console.error('[Invoice] Error getting invoice data:', error);
    return null;
  }
}

