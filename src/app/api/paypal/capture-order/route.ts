import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { capturePayPalOrder } from '@/lib/paypal';
import { getInvoiceDataFromOrder } from '@/lib/invoice';
import { uploadInvoiceToDropbox, getOrCreateInvoicesFolder } from '@/lib/dropbox';
import { sendOrderConfirmationWithDocuments } from '@/lib/invoice-email';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generatePrescriptionPDF, extractPrescriptionFromOrderItem, hasValidPrescriptionValues, PrescriptionPDFData } from '@/lib/prescription-pdf';
import { readFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

interface CaptureOrderRequest {
  paypalOrderId: string;
  orderId: string;
}

/**
 * Generate combined PDF with Payment Receipt + Invoice using pdf-lib
 */
async function generateCombinedPDF(invoiceData: any): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Colors matching the template
  const darkBlue = rgb(0.1, 0.2, 0.4);
  const yellow = rgb(1.0, 0.84, 0.0);
  const blackColor = rgb(0, 0, 0);
  const whiteColor = rgb(1.0, 1.0, 1.0);
  const lightGray = rgb(0.9, 0.9, 0.9);
  
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  
  // Header: Dark blue rounded rectangle
  const headerHeight = 80;
  const headerWidth = 280;
  // Logo area - load and embed actual FocusRobin logo (no background)
  const logoX = 30;
  const logoY = height - 50;
  
  try {
    const logoPath = join(process.cwd(), 'public', 'logo', 'Horizontal Primary dark (Color).svg');
    const svgBuffer = readFileSync(logoPath);
    // Convert SVG to PNG (keep original colors, no greyscale or tint)
    const pngBuffer = await sharp(svgBuffer)
      .resize(280, null, { fit: 'contain' }) // Larger size for bigger logo
      .png()
      .toBuffer();
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
    console.warn('[PayPal Invoice] Could not load logo, using text fallback:', error);
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
  
  // Invoice Details
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
  
  // BILL TO section
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
  
  const headerTextY = tableHeaderY - 20;
  page.drawText('NO', { x: 60, y: headerTextY, size: 11, font: helveticaBold, color: blackColor });
  page.drawText('DESCRIPTION', { x: 120, y: headerTextY, size: 11, font: helveticaBold, color: blackColor });
  page.drawText('PRICE', { x: 350, y: headerTextY, size: 11, font: helveticaBold, color: blackColor });
  page.drawText('QTY', { x: 420, y: headerTextY, size: 11, font: helveticaBold, color: blackColor });
  page.drawText('TOTAL', { x: 480, y: headerTextY, size: 11, font: helveticaBold, color: blackColor });
  
  // Items rows
  yPos = tableHeaderY - tableHeaderHeight - 25;
  invoiceData.items.forEach((item: any, index: number) => {
    const isEven = index % 2 === 0;
    const rowColor = isEven ? lightGray : whiteColor;
    const rowHeight = 25;
    
    page.drawRectangle({
      x: 50,
      y: yPos - rowHeight,
      width: width - 100,
      height: rowHeight,
      color: rowColor,
    });
    
    page.drawText((index + 1).toString(), { x: 60, y: yPos - 18, size: 10, font: helvetica, color: blackColor });
    
    const colorText = item.variant ? ` - ${item.variant}` : '';
    const skuText = item.sku ? ` (${item.sku})` : '';
    const fullDescription = `${item.name}${colorText}${skuText}`;
    const description = fullDescription.length > 40 ? fullDescription.substring(0, 40) + '...' : fullDescription;
    page.drawText(description, { x: 120, y: yPos - 18, size: 10, font: helvetica, color: blackColor });
    
    page.drawText(`${invoiceData.currency} ${item.price.toFixed(2)}`, { x: 350, y: yPos - 18, size: 10, font: helvetica, color: blackColor });
    page.drawText(item.quantity.toString(), { x: 420, y: yPos - 18, size: 10, font: helvetica, color: blackColor });
    page.drawText(`${invoiceData.currency} ${item.total.toFixed(2)}`, { x: 480, y: yPos - 18, size: 10, font: helvetica, color: blackColor });
    
    yPos -= rowHeight;
  });
  
  // Totals Section
  yPos -= 30;
  const originalSubtotal = (invoiceData.subtotal || 0) + (invoiceData.shipping || 0);
  const totalDiscount = (invoiceData.discount || 0) + (invoiceData.walletAmount || 0);
  const finalTotal = invoiceData.total;
  
  page.drawText('SUB-TOTAL', { x: 400, y: yPos, size: 11, font: helvetica, color: blackColor });
  page.drawText(`${invoiceData.currency} ${originalSubtotal.toFixed(2)}`, { x: 480, y: yPos, size: 11, font: helvetica, color: blackColor });
  
  // DISCOUNT - Show discount amount if there's any discount
  if (totalDiscount > 0) {
    yPos -= 25; // Add spacing between subtotal and discount
    page.drawText('DISCOUNT', { x: 400, y: yPos, size: 11, font: helvetica, color: blackColor });
    page.drawText(`-${invoiceData.currency} ${totalDiscount.toFixed(2)}`, { x: 480, y: yPos, size: 11, font: helvetica, color: blackColor });
  }
  
  // Total Due bar
  yPos -= 30;
  const totalBarHeight = 35;
  page.drawRectangle({
    x: 400,
    y: yPos - totalBarHeight,
    width: 145,
    height: totalBarHeight,
    color: yellow,
  });
  
  page.drawText('Total', { x: 410, y: yPos - 22, size: 12, font: helveticaBold, color: blackColor });
  page.drawText(`${invoiceData.currency} ${finalTotal.toFixed(2)}`, { x: 480, y: yPos - 22, size: 12, font: helveticaBold, color: blackColor });
  
  // Payment Method
  yPos = yPos - totalBarHeight - 40;
  page.drawText('PAYMENT METHOD', { x: 50, y: yPos, size: 11, font: helveticaBold, color: blackColor });
  yPos -= 20;
  page.drawText('PayPal', { x: 50, y: yPos, size: 10, font: helvetica, color: blackColor });
  
  // Footer
  page.drawText('THANK YOU FOR YOUR PURCHASE', {
    x: width / 2 - 120,
    y: 50,
    size: 14,
    font: helveticaBold,
    color: blackColor,
  });
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Process invoice generation, email sending, and Dropbox upload
 */
async function processInvoice(orderId: string, orderNumber: string) {
  console.log(`[Invoice] Starting invoice processing for PayPal order ${orderNumber}...`);
  
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
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
      return;
    }
    
    console.log(`[Invoice] Fetching invoice data for order ${orderId}...`);
    const invoiceData = await getInvoiceDataFromOrder(orderId);
    if (!invoiceData) {
      console.error(`[Invoice] Could not get invoice data for order ${orderId}`);
      return;
    }
    console.log(`[Invoice] Invoice data retrieved for customer: ${invoiceData.customerEmail}`);
    
    // Extract prescription data
    const prescriptionDataList: PrescriptionPDFData[] = [];
    for (const item of order.items) {
      if (item.prescriptionData && hasValidPrescriptionValues(item.prescriptionData)) {
        console.log(`[Invoice] Item "${item.productName}" has valid prescription data, generating PDF...`);
        const prescriptionPdfData = await extractPrescriptionFromOrderItem(
          {
            productName: item.productName,
            variantName: item.variantName,
            sku: item.sku,
            prescriptionData: item.prescriptionData,
          },
          order.orderNumber,
          order.createdAt,
          order.User?.name || order.shippingName,
          order.User?.email || 'customer@example.com'
        );
        
        if (prescriptionPdfData) {
          prescriptionDataList.push(prescriptionPdfData);
        }
      }
    }

    // Generate combined PDF
    console.log(`[Invoice] Generating combined PDF...`);
    let pdfBuffer = await generateCombinedPDF(invoiceData);
    
    // Append prescription PDFs if any
    if (prescriptionDataList.length > 0) {
      const mergedPdf = await PDFDocument.load(pdfBuffer);
      
      for (const prescriptionData of prescriptionDataList) {
        const prescriptionPdfBuffer = await generatePrescriptionPDF(prescriptionData);
        const prescriptionPdf = await PDFDocument.load(prescriptionPdfBuffer);
        const pages = await mergedPdf.copyPages(prescriptionPdf, prescriptionPdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }
      
      const mergedPdfBytes = await mergedPdf.save();
      pdfBuffer = Buffer.from(mergedPdfBytes);
    }
    
    // Upload to Dropbox
    if (process.env.DROPBOX_ACCESS_TOKEN) {
      try {
        const folderPath = await getOrCreateInvoicesFolder();
        if (folderPath) {
          const fileName = `FocusRobin-Order-${invoiceData.orderNumber}-Documents-${new Date().toISOString().split('T')[0]}.pdf`;
          await uploadInvoiceToDropbox(pdfBuffer, fileName, folderPath);
          console.log(`[Invoice] ✓ Uploaded to Dropbox`);
        }
      } catch (err: any) {
        console.error(`[Invoice] ✗ Dropbox upload error:`, err.message);
      }
    }

    // Send email
    try {
      const emailResult = await sendOrderConfirmationWithDocuments(invoiceData, prescriptionDataList.length > 0 ? prescriptionDataList : undefined);
      if (emailResult.success) {
        console.log(`[Invoice] ✓ Order confirmation email sent successfully`);
      }
    } catch (emailError: any) {
      console.error(`[Invoice] ✗ Order confirmation email error:`, emailError.message);
    }

    console.log(`[Invoice] ✓ Invoice processing completed for order ${orderNumber}`);
  } catch (error: any) {
    console.error(`[Invoice] ✗ Invoice processing failed for order ${orderNumber}:`, error.message);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body: CaptureOrderRequest = await request.json();
    const { paypalOrderId, orderId } = body;

    console.log('[PayPal] Capturing order:', paypalOrderId, 'for orderId:', orderId);

    // Verify the order belongs to the user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        paypalOrderId: paypalOrderId,
      },
      include: {
        items: {
          include: {
            Product: {
              select: {
                cashbackAmount: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or unauthorized' },
        { status: 404 }
      );
    }

    // Capture the PayPal order
    const captureResult = await capturePayPalOrder(paypalOrderId);

    if (captureResult.status !== 'COMPLETED') {
      console.error('[PayPal] Capture failed with status:', captureResult.status);
      
      // Refund wallet if payment failed
      if (order.walletAmountUsed && Number(order.walletAmountUsed) > 0) {
        const wallet = await prisma.wallet.findUnique({ where: { userId } });
        if (wallet) {
          await prisma.wallet.update({
            where: { userId },
            data: { balance: { increment: Number(order.walletAmountUsed) } },
          });
          await prisma.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: Number(order.walletAmountUsed),
              type: 'CREDIT',
              description: `Refund for failed PayPal payment - Order ${order.orderNumber}`,
            },
          });
        }
      }

      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'FAILED',
          status: 'CANCELLED',
        },
      });

      return NextResponse.json(
        { error: 'Payment capture failed', status: captureResult.status },
        { status: 400 }
      );
    }

    // Get capture ID for refunds
    const captureId = captureResult.purchase_units[0]?.payments?.captures[0]?.id;

    // Update order as paid
    await prisma.order.update({
      where: { id: orderId },
      data: {
        isPaid: true,
        paymentStatus: 'COMPLETED',
        status: 'CONFIRMED',
        paypalCaptureId: captureId,
      },
    });

    console.log('[PayPal] Order marked as paid:', order.orderNumber);

    // Update stock for each item
    for (const item of order.items) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Clear user's cart
    await prisma.cartItem.deleteMany({
      where: {
        Cart: {
          userId,
        },
      },
    });

    console.log('[PayPal] Cart cleared and stock updated');

    // Add cashback to wallet
    let totalCashback = 0;
    for (const item of order.items) {
      if (item.Product?.cashbackAmount) {
        totalCashback += Number(item.Product.cashbackAmount) * item.quantity;
      }
    }
    if (order.promoCashback) {
      totalCashback += Number(order.promoCashback);
    }

    if (totalCashback > 0) {
      let wallet = await prisma.wallet.findUnique({ where: { userId } });

      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: { userId, balance: 0 },
        });
      }

      await prisma.wallet.update({
        where: { userId },
        data: {
          balance: {
            increment: totalCashback,
          },
        },
      });

      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: totalCashback,
          type: 'CREDIT',
          description: `Cashback from order ${order.orderNumber}`,
        },
      });

      console.log(`[PayPal] Added ${totalCashback} EUR cashback to wallet`);
    }

    // Update wallet transaction description if used
    if (order.walletAmountUsed && Number(order.walletAmountUsed) > 0) {
      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      if (wallet) {
        // Find and update the pending wallet transaction
        const pendingTransaction = await prisma.walletTransaction.findFirst({
          where: {
            walletId: wallet.id,
            description: { contains: order.orderNumber },
            type: 'DEBIT',
          },
          orderBy: { createdAt: 'desc' },
        });

        if (pendingTransaction) {
          await prisma.walletTransaction.update({
            where: { id: pendingTransaction.id },
            data: {
              description: `Order ${order.orderNumber} - Completed`,
            },
          });
        }
      }
    }

    // Process invoice in background
    processInvoice(orderId, order.orderNumber).catch((err) => {
      console.error('[PayPal] Invoice processing failed:', err);
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      captureId,
    });
  } catch (error: any) {
    console.error('[PayPal] Error capturing order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to capture PayPal order' },
      { status: 500 }
    );
  }
}

