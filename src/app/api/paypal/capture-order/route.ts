import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { capturePayPalOrder } from '@/lib/paypal';
import { getInvoiceDataFromOrder } from '@/lib/invoice';
import { uploadInvoiceToDropbox, getOrCreateInvoicesFolder } from '@/lib/dropbox';
import { sendOrderConfirmationWithDocuments } from '@/lib/invoice-email';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generatePrescriptionPDF, extractPrescriptionFromOrderItem, hasValidPrescriptionValues, PrescriptionPDFData } from '@/lib/prescription-pdf';

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
  
  const brandColor = rgb(0.16, 0.62, 0.60);
  const greenColor = rgb(0.30, 0.69, 0.31);
  const grayColor = rgb(0.4, 0.4, 0.4);
  const blackColor = rgb(0, 0, 0);
  const orangeBackground = rgb(1.0, 0.647, 0.0);
  const whiteColor = rgb(1.0, 1.0, 1.0);
  
  // Page 1: Payment Receipt
  const page1 = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page1.getSize();
  
  page1.drawText('FocusRobin', { x: 50, y: height - 50, size: 24, font: helveticaBold, color: brandColor });
  page1.drawText('Payment Receipt', { x: 50, y: height - 70, size: 10, font: helvetica, color: grayColor });
  page1.drawText(`Order Number: ${invoiceData.orderNumber}`, { x: 400, y: height - 50, size: 12, font: helvetica, color: blackColor });
  
  const dateStr = invoiceData.orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  page1.drawText(`Date: ${dateStr}`, { x: 400, y: height - 70, size: 12, font: helvetica, color: blackColor });
  
  let yPos = height - 150;
  page1.drawText('Payment Successful!', { x: 50, y: yPos, size: 18, font: helveticaBold, color: greenColor });
  yPos -= 40;
  page1.drawText(`Dear ${invoiceData.customerName || 'Customer'},`, { x: 50, y: yPos, size: 12, font: helvetica, color: blackColor });
  yPos -= 25;
  page1.drawText('Thank you for your purchase! Your payment has been successfully processed.', { x: 50, y: yPos, size: 12, font: helvetica, color: blackColor });
  
  yPos -= 50;
  page1.drawText('Payment Summary', { x: 50, y: yPos, size: 14, font: helveticaBold, color: brandColor });
  yPos -= 30;
  page1.drawText('Total Amount Paid:', { x: 50, y: yPos, size: 11, font: helvetica, color: blackColor });
  page1.drawText(`${invoiceData.currency} ${invoiceData.total.toFixed(2)}`, { x: 400, y: yPos, size: 11, font: helveticaBold, color: blackColor });
  yPos -= 25;
  page1.drawText('Payment Method: PayPal', { x: 50, y: yPos, size: 11, font: helvetica, color: blackColor });
  yPos -= 20;
  page1.drawText('Payment Status: Completed', { x: 50, y: yPos, size: 11, font: helvetica, color: greenColor });
  
  yPos -= 50;
  page1.drawText('Shipping Address', { x: 50, y: yPos, size: 14, font: helveticaBold, color: brandColor });
  yPos -= 25;
  page1.drawText(invoiceData.shippingAddress.name, { x: 50, y: yPos, size: 11, font: helvetica, color: blackColor });
  yPos -= 15;
  page1.drawText(invoiceData.shippingAddress.addressLine1, { x: 50, y: yPos, size: 11, font: helvetica, color: blackColor });
  if (invoiceData.shippingAddress.addressLine2) {
    yPos -= 15;
    page1.drawText(invoiceData.shippingAddress.addressLine2, { x: 50, y: yPos, size: 11, font: helvetica, color: blackColor });
  }
  yPos -= 15;
  page1.drawText(`${invoiceData.shippingAddress.city}, ${invoiceData.shippingAddress.postalCode}`, { x: 50, y: yPos, size: 11, font: helvetica, color: blackColor });
  if (invoiceData.shippingAddress.state) {
    yPos -= 15;
    page1.drawText(invoiceData.shippingAddress.state, { x: 50, y: yPos, size: 11, font: helvetica, color: blackColor });
  }
  yPos -= 15;
  page1.drawText(invoiceData.shippingAddress.country, { x: 50, y: yPos, size: 11, font: helvetica, color: blackColor });
  
  page1.drawText('This is a payment receipt document.', { x: 50, y: 50, size: 8, font: helvetica, color: grayColor });
  page1.drawText('Thank you for your purchase!', { x: 50, y: 38, size: 8, font: helvetica, color: grayColor });
  
  // Page 2: Invoice
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  
  page2.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: height,
    color: orangeBackground,
  });
  
  let yPos2 = height - 50;
  page2.drawText(invoiceData.companyName || 'FocusRobin', { x: 50, y: yPos2, size: 32, font: helveticaBold, color: whiteColor });
  
  const contactInfo = [
    invoiceData.companyPhone || '+123-456-7890',
    invoiceData.companyEmail || 'hello@focusrobin.com',
    invoiceData.companyAddress || '123 Anywhere St., Any City',
  ];
  let contactY = height - 50;
  contactInfo.forEach((info) => {
    page2.drawText(info, { x: 400, y: contactY, size: 10, font: helvetica, color: whiteColor });
    contactY -= 15;
  });
  
  yPos2 -= 50;
  page2.drawText('Invoice', { x: 50, y: yPos2, size: 28, font: helveticaBold, color: whiteColor });
  
  yPos2 -= 40;
  page2.drawText(`Invoice Number: [${invoiceData.orderNumber}]`, { x: 50, y: yPos2, size: 12, font: helvetica, color: whiteColor });
  yPos2 -= 20;
  page2.drawText(`Billed To: ${invoiceData.customerName}`, { x: 50, y: yPos2, size: 12, font: helvetica, color: whiteColor });
  
  const dueDateStr = invoiceData.dueDate?.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) || '';
  let dateY = height - 130;
  page2.drawText(`Date: [${dateStr}]`, { x: 400, y: dateY, size: 12, font: helvetica, color: whiteColor });
  dateY -= 20;
  page2.drawText(`Due Date: [${dueDateStr}]`, { x: 400, y: dateY, size: 12, font: helvetica, color: whiteColor });
  
  yPos2 = height - 220;
  page2.drawLine({ start: { x: 50, y: yPos2 }, end: { x: 545, y: yPos2 }, thickness: 1, color: whiteColor });
  
  yPos2 -= 30;
  page2.drawText('Item', { x: 50, y: yPos2, size: 11, font: helveticaBold, color: whiteColor });
  page2.drawText('Quantity', { x: 250, y: yPos2, size: 11, font: helveticaBold, color: whiteColor });
  page2.drawText('Unit Price', { x: 350, y: yPos2, size: 11, font: helveticaBold, color: whiteColor });
  page2.drawText('Total Price', { x: 450, y: yPos2, size: 11, font: helveticaBold, color: whiteColor });
  
  yPos2 -= 25;
  invoiceData.items.forEach((item: any) => {
    const itemName = item.name.length > 40 ? item.name.substring(0, 40) + '...' : item.name;
    page2.drawText(itemName, { x: 50, y: yPos2, size: 10, font: helvetica, color: whiteColor });
    
    if (item.originalPrice && item.discountPct) {
      page2.drawText(`(${item.discountPct}% off)`, { x: 50, y: yPos2 - 12, size: 8, font: helvetica, color: whiteColor });
    }
    
    page2.drawText(item.quantity.toString(), { x: 250, y: yPos2, size: 10, font: helvetica, color: whiteColor });
    
    if (item.originalPrice && item.discountPct) {
      page2.drawText(`${invoiceData.currency} ${item.originalPrice.toFixed(2)}`, { x: 350, y: yPos2 + 10, size: 8, font: helvetica, color: rgb(0.8, 0.8, 0.8) });
      page2.drawLine({ start: { x: 350, y: yPos2 + 12 }, end: { x: 410, y: yPos2 + 12 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    }
    
    page2.drawText(`${invoiceData.currency} ${item.price.toFixed(2)}`, { x: 350, y: yPos2, size: 10, font: helvetica, color: whiteColor });
    page2.drawText(`${invoiceData.currency} ${item.total.toFixed(2)}`, { x: 450, y: yPos2, size: 10, font: helvetica, color: whiteColor });
    yPos2 -= item.originalPrice ? 30 : 20;
  });
  
  yPos2 -= 20;
  page2.drawLine({ start: { x: 50, y: yPos2 + 10 }, end: { x: 545, y: yPos2 + 10 }, thickness: 1, color: whiteColor });
  yPos2 -= 20;
  
  page2.drawText('SUBTOTAL:', { x: 370, y: yPos2, size: 11, font: helveticaBold, color: whiteColor });
  page2.drawText(`${invoiceData.currency} ${((invoiceData.subtotal || 0) + (invoiceData.shipping || 0)).toFixed(2)}`, { x: 470, y: yPos2, size: 11, font: helvetica, color: whiteColor });
  yPos2 -= 20;
  page2.drawText('DISCOUNT:', { x: 370, y: yPos2, size: 11, font: helveticaBold, color: whiteColor });
  page2.drawText(`${invoiceData.currency} ${(invoiceData.discount || 0).toFixed(2)}`, { x: 470, y: yPos2, size: 11, font: helvetica, color: whiteColor });
  if (invoiceData.walletAmount && invoiceData.walletAmount > 0) {
    yPos2 -= 20;
    page2.drawText('WALLET AMOUNT:', { x: 370, y: yPos2, size: 11, font: helveticaBold, color: whiteColor });
    page2.drawText(`-${invoiceData.currency} ${invoiceData.walletAmount.toFixed(2)}`, { x: 470, y: yPos2, size: 11, font: helvetica, color: whiteColor });
  }
  yPos2 -= 25;
  page2.drawText('TOTAL:', { x: 370, y: yPos2, size: 14, font: helveticaBold, color: whiteColor });
  page2.drawText(`${invoiceData.currency} ${invoiceData.total.toFixed(2)}`, { x: 470, y: yPos2, size: 14, font: helveticaBold, color: whiteColor });
  
  yPos2 -= 30;
  page2.drawLine({ start: { x: 50, y: yPos2 + 10 }, end: { x: 545, y: yPos2 + 10 }, thickness: 1, color: whiteColor });
  yPos2 -= 30;
  page2.drawText('Payment', { x: 50, y: yPos2, size: 24, font: helveticaBold, color: whiteColor });
  yPos2 -= 30;
  page2.drawText(`Payment Method: PayPal`, { x: 50, y: yPos2, size: 12, font: helvetica, color: whiteColor });
  page2.drawText('THANK YOU!', { x: 400, y: yPos2, size: 24, font: helveticaBold, color: whiteColor });
  
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

