import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { getInvoiceDataFromOrder } from '@/lib/invoice';
import { uploadInvoiceToDropbox, getOrCreateInvoicesFolder } from '@/lib/dropbox';
import { sendOrderConfirmationWithDocuments } from '@/lib/invoice-email';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generatePrescriptionPDF, extractPrescriptionFromOrderItem, hasValidPrescriptionValues, PrescriptionPDFData } from '@/lib/prescription-pdf';

// Disable body parsing, Stripe needs raw body
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Generate combined PDF with Payment Receipt + Invoice using pdf-lib
 * Same as the one used in admin panel
 */
async function generateCombinedPDF(invoiceData: any): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const brandColor = rgb(0.16, 0.62, 0.60);
  const greenColor = rgb(0.30, 0.69, 0.31);
  const grayColor = rgb(0.4, 0.4, 0.4);
  const blackColor = rgb(0, 0, 0);
  const orangeBackground = rgb(1.0, 0.647, 0.0); // Vibrant orange #FFA500
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
  page1.drawText('Payment Method: Stripe', { x: 50, y: yPos, size: 11, font: helvetica, color: blackColor });
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
  
  // Fill entire page with orange background
  page2.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: height,
    color: orangeBackground,
  });
  
  // Header Section
  let yPos2 = height - 50;
  page2.drawText(invoiceData.companyName || 'FocusRobin', { x: 50, y: yPos2, size: 32, font: helveticaBold, color: whiteColor });
  
  // Contact Information (right side)
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
  
  // Invoice Title
  yPos2 -= 50;
  page2.drawText('Invoice', { x: 50, y: yPos2, size: 28, font: helveticaBold, color: whiteColor });
  
  // Invoice Details
  yPos2 -= 40;
  page2.drawText(`Invoice Number: [${invoiceData.orderNumber}]`, { x: 50, y: yPos2, size: 12, font: helvetica, color: whiteColor });
  yPos2 -= 20;
  page2.drawText(`Billed To: ${invoiceData.customerName}`, { x: 50, y: yPos2, size: 12, font: helvetica, color: whiteColor });
  
  // Date and Due Date (right side)
  const dueDateStr = invoiceData.dueDate?.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) || '';
  let dateY = height - 130;
  page2.drawText(`Date: [${dateStr}]`, { x: 400, y: dateY, size: 12, font: helvetica, color: whiteColor });
  dateY -= 20;
  page2.drawText(`Due Date: [${dueDateStr}]`, { x: 400, y: dateY, size: 12, font: helvetica, color: whiteColor });
  
  // Draw horizontal line separator
  yPos2 = height - 220;
  page2.drawLine({ start: { x: 50, y: yPos2 }, end: { x: 545, y: yPos2 }, thickness: 1, color: whiteColor });
  
  // Items Section
  yPos2 -= 30;
  page2.drawText('Item', { x: 50, y: yPos2, size: 11, font: helveticaBold, color: whiteColor });
  page2.drawText('Quantity', { x: 250, y: yPos2, size: 11, font: helveticaBold, color: whiteColor });
  page2.drawText('Unit Price', { x: 350, y: yPos2, size: 11, font: helveticaBold, color: whiteColor });
  page2.drawText('Total Price', { x: 450, y: yPos2, size: 11, font: helveticaBold, color: whiteColor });
  
  yPos2 -= 25;
  invoiceData.items.forEach((item: any) => {
    const itemName = item.name.length > 40 ? item.name.substring(0, 40) + '...' : item.name;
    page2.drawText(itemName, { x: 50, y: yPos2, size: 10, font: helvetica, color: whiteColor });
    
    // Show discount info if applicable
    if (item.originalPrice && item.discountPct) {
      page2.drawText(`(${item.discountPct}% off)`, { x: 50, y: yPos2 - 12, size: 8, font: helvetica, color: whiteColor });
    }
    
    page2.drawText(item.quantity.toString(), { x: 250, y: yPos2, size: 10, font: helvetica, color: whiteColor });
    
    // Show original price with strikethrough if discounted
    if (item.originalPrice && item.discountPct) {
      page2.drawText(`${invoiceData.currency} ${item.originalPrice.toFixed(2)}`, { x: 350, y: yPos2 + 10, size: 8, font: helvetica, color: rgb(0.8, 0.8, 0.8) });
      page2.drawLine({ start: { x: 350, y: yPos2 + 12 }, end: { x: 410, y: yPos2 + 12 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    }
    
    page2.drawText(`${invoiceData.currency} ${item.price.toFixed(2)}`, { x: 350, y: yPos2, size: 10, font: helvetica, color: whiteColor });
    page2.drawText(`${invoiceData.currency} ${item.total.toFixed(2)}`, { x: 450, y: yPos2, size: 10, font: helvetica, color: whiteColor });
    yPos2 -= item.originalPrice ? 30 : 20;
  });
  
  // Summary Section
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
  
  // Payment Section
  yPos2 -= 30;
  page2.drawLine({ start: { x: 50, y: yPos2 + 10 }, end: { x: 545, y: yPos2 + 10 }, thickness: 1, color: whiteColor });
  yPos2 -= 30;
  page2.drawText('Payment', { x: 50, y: yPos2, size: 24, font: helveticaBold, color: whiteColor });
  yPos2 -= 30;
  page2.drawText(`Payment Method: ${invoiceData.paymentMethod || 'Online Payment'}`, { x: 50, y: yPos2, size: 12, font: helvetica, color: whiteColor });
  page2.drawText('THANK YOU!', { x: 400, y: yPos2, size: 24, font: helveticaBold, color: whiteColor });
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Process invoice generation, email sending, and Dropbox upload
 * This runs asynchronously to not block the webhook response
 */
async function processInvoice(orderId: string, orderNumber: string) {
  console.log(`[Invoice] Starting invoice processing for order ${orderNumber}...`);
  
  try {
    // Get order with items (including prescription data)
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
    
    // Get invoice data
    console.log(`[Invoice] Fetching invoice data for order ${orderId}...`);
    const invoiceData = await getInvoiceDataFromOrder(orderId);
    if (!invoiceData) {
      console.error(`[Invoice] Could not get invoice data for order ${orderId}`);
      return;
    }
    console.log(`[Invoice] Invoice data retrieved for customer: ${invoiceData.customerEmail}`);
    
    // Extract prescription data from order items
    // IMPORTANT: Only generate prescription PDF for items with ACTUAL prescription values
    // Not just items that have prescriptionData field (which might be empty or just have pricing)
    const prescriptionDataList: PrescriptionPDFData[] = [];
    for (const item of order.items) {
      // Use the validation helper to check if this item has actual prescription values
      console.log(`[Invoice] Checking item "${item.productName}" (SKU: ${item.sku}, ID: ${item.id}):`, {
        hasPrescriptionData: !!item.prescriptionData,
        prescriptionDataKeys: item.prescriptionData ? Object.keys(item.prescriptionData) : [],
      });
      
      if (item.prescriptionData && hasValidPrescriptionValues(item.prescriptionData)) {
        console.log(`[Invoice] Item "${item.productName}" (SKU: ${item.sku}) has valid prescription data, generating PDF...`);
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
          console.log(`[Invoice] Successfully extracted prescription data for: ${item.productName} (SKU: ${item.sku})`);
        }
      } else if (item.prescriptionData) {
        console.log(`[Invoice] Item "${item.productName}" (SKU: ${item.sku}) has prescriptionData but NO valid prescription values - skipping PDF`);
        console.log(`[Invoice] Prescription data structure:`, JSON.stringify(item.prescriptionData, null, 2));
      } else {
        console.log(`[Invoice] Item "${item.productName}" (SKU: ${item.sku}) is a non-prescription item`);
      }
    }
    
    console.log(`[Invoice] Total prescription items found: ${prescriptionDataList.length}`);

    // Generate combined PDF (Payment Receipt + Invoice)
    console.log(`[Invoice] Generating combined PDF (Payment Receipt + Invoice)...`);
    let pdfBuffer = await generateCombinedPDF(invoiceData);
    console.log(`[Invoice] Combined PDF generated successfully (${pdfBuffer.length} bytes)`);
    
    // If there are prescription items, generate and append prescription PDFs
    if (prescriptionDataList.length > 0) {
      console.log(`[Invoice] Appending ${prescriptionDataList.length} prescription PDF(s) to combined document...`);
      
      // Load the combined PDF
      const mergedPdf = await PDFDocument.load(pdfBuffer);
      
      // Generate and append prescription PDFs
      for (const prescriptionData of prescriptionDataList) {
        console.log(`[Invoice] Generating prescription PDF for: ${prescriptionData.productName}`);
        const prescriptionPdfBuffer = await generatePrescriptionPDF(prescriptionData);
        const prescriptionPdf = await PDFDocument.load(prescriptionPdfBuffer);
        const pages = await mergedPdf.copyPages(prescriptionPdf, prescriptionPdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }
      
      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      pdfBuffer = Buffer.from(mergedPdfBytes);
      console.log(`[Invoice] Merged PDF with prescriptions generated (${pdfBuffer.length} bytes)`);
    }
    
    // Upload to Dropbox
    console.log(`[Invoice] Attempting Dropbox upload...`);
    let dropboxResult = null;
    let dropboxError: any = null;
    try {
      // Check if Dropbox is configured
      if (!process.env.DROPBOX_ACCESS_TOKEN) {
        console.warn(`[Invoice] ⚠️ DROPBOX_ACCESS_TOKEN not set - skipping Dropbox upload`);
        console.warn(`[Invoice] To enable Dropbox upload, set DROPBOX_ACCESS_TOKEN in your environment variables`);
        console.warn(`[Invoice] See DROPBOX_SETUP.md for instructions`);
        dropboxError = new Error('DROPBOX_ACCESS_TOKEN not configured');
      } else {
        console.log(`[Invoice] Dropbox token found, proceeding with upload...`);
        const folderPath = await getOrCreateInvoicesFolder();
        if (!folderPath) {
          console.error(`[Invoice] ✗ Failed to get or create Dropbox folder`);
          dropboxError = new Error('Failed to get or create Dropbox folder');
        } else {
          const fileName = `FocusRobin-Order-${invoiceData.orderNumber}-Documents-${new Date().toISOString().split('T')[0]}.pdf`;
          dropboxResult = await uploadInvoiceToDropbox(pdfBuffer, fileName, folderPath);
          
          if (dropboxResult) {
            console.log(`[Invoice] ✓ Uploaded to Dropbox: ${dropboxResult.sharedLink}`);
            console.log(`[Invoice] ✓ File ID: ${dropboxResult.fileId}`);
          } else {
            console.error(`[Invoice] ✗ Dropbox upload returned null - upload may have failed`);
            dropboxError = new Error('Dropbox upload returned null');
          }
        }
      }
    } catch (err: any) {
      dropboxError = err;
      console.error(`[Invoice] ✗ Dropbox upload error:`, err.message);
      console.error(`[Invoice] ✗ Dropbox error stack:`, err.stack);
      if (err.status) {
        console.error(`[Invoice] ✗ Dropbox error status: ${err.status}`);
      }
      if (err.error) {
        console.error(`[Invoice] ✗ Dropbox error details:`, JSON.stringify(err.error, null, 2));
      }
      // Log helpful troubleshooting information
      if (err.message?.includes('DROPBOX_ACCESS_TOKEN')) {
        console.error(`[Invoice] 💡 Troubleshooting: Check your .env.local file and ensure DROPBOX_ACCESS_TOKEN is set`);
        console.error(`[Invoice] 💡 Run: node scripts/test-dropbox.js to test your Dropbox configuration`);
      }
    }

    // Send email with documents (including prescription PDFs if any)
    console.log(`[Invoice] Sending order confirmation email with documents...`);
    try {
      const emailResult = await sendOrderConfirmationWithDocuments(invoiceData, prescriptionDataList.length > 0 ? prescriptionDataList : undefined);
      if (emailResult.success) {
        console.log(`[Invoice] ✓ Order confirmation email sent successfully`);
        if (prescriptionDataList.length > 0) {
          console.log(`[Invoice] ✓ Email includes ${prescriptionDataList.length} prescription PDF(s)`);
        }
      } else {
        console.error(`[Invoice] ✗ Order confirmation email failed:`, emailResult.error);
      }
    } catch (emailError: any) {
      console.error(`[Invoice] ✗ Order confirmation email error:`, emailError.message);
    }

    // Log final status
    if (dropboxError) {
      console.error(`[Invoice] ⚠️ Invoice processing completed for order ${orderNumber}, but Dropbox upload failed`);
      console.error(`[Invoice] ⚠️ Error: ${dropboxError.message}`);
    } else if (dropboxResult) {
      console.log(`[Invoice] ✓ Invoice processing completed successfully for order ${orderNumber}`);
      console.log(`[Invoice] ✓ PDF uploaded to Dropbox at: ${dropboxResult.sharedLink}`);
    } else {
      console.warn(`[Invoice] ⚠️ Invoice processing completed for order ${orderNumber}, but Dropbox upload was skipped`);
    }
  } catch (error: any) {
    console.error(`[Invoice] ✗ Invoice processing failed for order ${orderNumber}:`, error.message);
    console.error(`[Invoice] ✗ Error stack:`, error.stack);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('[Stripe Webhook] No signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Stripe Webhook] Webhook secret not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    // Handle the event
    switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log(`[Stripe Webhook] Checkout session completed: ${session.id}`);
      console.log(`[Stripe Webhook] Payment status: ${session.payment_status}`);
      console.log(`[Stripe Webhook] Session mode: ${session.mode}`);
      console.log(`[Stripe Webhook] Metadata:`, session.metadata);

      const orderId = session.metadata?.orderId;
      const userId = session.metadata?.userId;
      const walletAmountUsed = parseFloat(session.metadata?.walletAmountUsed || '0');
      const walletTransactionId = session.metadata?.walletTransactionId;

      if (!orderId) {
        console.error('[Stripe Webhook] No orderId in session metadata');
        return NextResponse.json({ error: 'No orderId in metadata' }, { status: 400 });
      }

      // Only process if payment is actually paid
      // checkout.session.completed can fire even when payment_status is 'unpaid'
      if (session.payment_status !== 'paid') {
        console.warn(`[Stripe Webhook] Checkout session completed but payment_status is '${session.payment_status}', not 'paid'. Skipping order update.`);
        console.warn(`[Stripe Webhook] This usually means payment was not completed or was cancelled.`);
        return NextResponse.json({ 
          received: true, 
          message: `Payment status is '${session.payment_status}', not 'paid'. Order not updated.` 
        });
      }

      try {
        // Update the order
        // When payment is successful:
        // - paymentStatus = 'COMPLETED' (payment is done)
        // - status = 'CONFIRMED' or 'PROCESSING' (order is being processed)
        const order = await prisma.order.update({
          where: { id: orderId },
          data: {
            isPaid: true,
            paymentStatus: 'COMPLETED',
            status: 'CONFIRMED',
            stripePaymentIntentId: typeof session.payment_intent === 'string' 
              ? session.payment_intent 
              : session.payment_intent?.id || null,
          },
        });

        console.log(`[Stripe Webhook] ✓ Order ${order.orderNumber} updated to CONFIRMED with payment COMPLETED`);

        // Update wallet transaction description if wallet was used and payment succeeded
        if (walletAmountUsed > 0 && walletTransactionId) {
          try {
            await prisma.walletTransaction.update({
              where: { id: walletTransactionId },
              data: {
                description: `Order ${order.orderNumber} - Completed`,
              },
            });
            console.log(`[Stripe Webhook] Updated wallet transaction ${walletTransactionId} to completed`);
          } catch (walletError) {
            console.error('[Stripe Webhook] Error updating wallet transaction:', walletError);
            // Don't fail the webhook if wallet transaction update fails
          }
        }

        // If payment is complete, clear the user's cart and update stock
        if (userId) {
          // Get order items to update stock
          const orderItems = await prisma.orderItem.findMany({
            where: { orderId },
          });

          // Update stock for each item
          for (const item of orderItems) {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });
          }

          // Clear the user's cart
          await prisma.cartItem.deleteMany({
            where: {
              Cart: {
                userId,
              },
            },
          });

          console.log(`[Stripe Webhook] Cart cleared and stock updated for user ${userId}`);

          // Add cashback to user's wallet if applicable
          const orderWithItems = await prisma.order.findUnique({
            where: { id: orderId },
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

          if (orderWithItems) {
            let totalCashback = 0;
            // Add product cashback
            for (const item of orderWithItems.items) {
              if (item.Product?.cashbackAmount) {
                totalCashback += Number(item.Product.cashbackAmount) * item.quantity;
              }
            }
            // Add promo code cashback
            if (orderWithItems.promoCashback) {
              totalCashback += Number(orderWithItems.promoCashback);
            }

            if (totalCashback > 0) {
              // Get or create wallet
              let wallet = await prisma.wallet.findUnique({
                where: { userId },
              });

              if (!wallet) {
                wallet = await prisma.wallet.create({
                  data: {
                    userId,
                    balance: 0,
                  },
                });
              }

              // Add cashback
              await prisma.wallet.update({
                where: { userId },
                data: {
                  balance: {
                    increment: totalCashback,
                  },
                },
              });

              // Create transaction record
              await prisma.walletTransaction.create({
                data: {
                  walletId: wallet.id,
                  amount: totalCashback,
                  type: 'CREDIT',
                  description: `Cashback from order ${order.orderNumber}`,
                },
              });

              console.log(`[Stripe Webhook] Added ${totalCashback} EUR cashback to wallet`);
            }
          }

          // NOTE: Only send the invoice email with PDF attachment
          // The processInvoice function will send the email with PDF
          // No need to send a separate confirmation email without PDF
          
          // Generate and send invoices asynchronously (don't block webhook response)
          // This runs in the background so the webhook can respond quickly
          // This function will also send the order confirmation email WITH PDF attached
          console.log(`[Stripe Webhook] Starting invoice processing for order ${order.orderNumber}...`);
          
          // Run this immediately but don't await it
          processInvoice(orderId, order.orderNumber).catch((err) => {
            console.error(`[Stripe Webhook] Invoice processing failed:`, err);
          });
        }

        return NextResponse.json({ received: true, orderId: order.id });
      } catch (error) {
        console.error('[Stripe Webhook] Error updating order:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
      }
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      const userId = session.metadata?.userId;
      const walletAmountUsed = parseFloat(session.metadata?.walletAmountUsed || '0');

      if (orderId) {
        try {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              isPaid: false,
              paymentStatus: 'FAILED',
              status: 'CANCELLED',
            },
          });
          console.log(`[Stripe Webhook] Order ${orderId} marked as expired/cancelled`);

          // Refund wallet amount if it was used
          if (walletAmountUsed > 0 && userId) {
            try {
              const wallet = await prisma.wallet.findUnique({
                where: { userId },
                include: {
                  transactions: {
                    where: {
                      description: {
                        contains: `Refund for cancelled order ${session.metadata?.orderNumber || orderId}`,
                      },
                      type: 'CREDIT',
                    },
                    take: 1,
                  },
                },
              });

              if (wallet) {
                // Check if already refunded
                if (wallet.transactions.length > 0) {
                  console.log(`[Stripe Webhook] Wallet already refunded for order ${orderId}`);
                } else {
                  // Refund the wallet amount
                  await prisma.wallet.update({
                    where: { userId },
                    data: {
                      balance: {
                        increment: walletAmountUsed,
                      },
                    },
                  });

                  // Create refund transaction
                  await prisma.walletTransaction.create({
                    data: {
                      walletId: wallet.id,
                      amount: walletAmountUsed,
                      type: 'CREDIT',
                      description: `Refund for cancelled order ${session.metadata?.orderNumber || orderId}`,
                    },
                  });

                  console.log(`[Stripe Webhook] Refunded ${walletAmountUsed} EUR to wallet for cancelled order`);
                }
              }
            } catch (walletError) {
              console.error('[Stripe Webhook] Error refunding wallet:', walletError);
              // Don't fail the webhook if wallet refund fails
            }
          }
        } catch (error) {
          console.error('[Stripe Webhook] Error marking order as expired:', error);
        }
      }

      return NextResponse.json({ received: true });
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log(`[Stripe Webhook] Payment intent succeeded: ${paymentIntent.id}`);
      console.log(`[Stripe Webhook] Payment intent status: ${paymentIntent.status}`);
      console.log(`[Stripe Webhook] Amount: ${paymentIntent.amount} ${paymentIntent.currency}`);
      
      // Find order by payment intent ID and ensure it's marked as paid
      try {
        const order = await prisma.order.findFirst({
          where: { stripePaymentIntentId: paymentIntent.id },
        });

        if (order && (!order.isPaid || order.paymentStatus !== 'COMPLETED')) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              isPaid: true,
              paymentStatus: 'COMPLETED',
              status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
            },
          });
          console.log(`[Stripe Webhook] ✓ Order ${order.orderNumber} confirmed via payment_intent.succeeded`);
        } else if (order) {
          console.log(`[Stripe Webhook] Order ${order.orderNumber} already marked as paid`);
        } else {
          console.log(`[Stripe Webhook] No order found for payment intent ${paymentIntent.id}`);
        }
      } catch (error) {
        console.error('[Stripe Webhook] Error updating order from payment_intent.succeeded:', error);
      }

      return NextResponse.json({ received: true });
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`);
      
      // Find order by payment intent ID and mark as failed
      try {
        const order = await prisma.order.findFirst({
          where: { stripePaymentIntentId: paymentIntent.id },
          include: {
            User: {
              select: { id: true },
            },
          },
        });

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              isPaid: false,
              paymentStatus: 'FAILED',
            },
          });
          console.log(`[Stripe Webhook] Order ${order.orderNumber} marked as payment failed`);

          // Refund wallet amount if it was used
          const walletAmountUsed = Number(order.walletAmountUsed || 0);
          if (walletAmountUsed > 0) {
            try {
              const wallet = await prisma.wallet.findUnique({
                where: { userId: order.User.id },
                include: {
                  transactions: {
                    where: {
                      description: {
                        contains: `Refund for failed payment - Order ${order.orderNumber}`,
                      },
                      type: 'CREDIT',
                    },
                    take: 1,
                  },
                },
              });

              if (wallet) {
                // Check if already refunded
                if (wallet.transactions.length > 0) {
                  console.log(`[Stripe Webhook] Wallet already refunded for failed payment order ${order.orderNumber}`);
                } else {
                  // Refund the wallet amount
                  await prisma.wallet.update({
                    where: { userId: order.User.id },
                    data: {
                      balance: {
                        increment: walletAmountUsed,
                      },
                    },
                  });

                  // Create refund transaction
                  await prisma.walletTransaction.create({
                    data: {
                      walletId: wallet.id,
                      amount: walletAmountUsed,
                      type: 'CREDIT',
                      description: `Refund for failed payment - Order ${order.orderNumber}`,
                    },
                  });

                  console.log(`[Stripe Webhook] Refunded ${walletAmountUsed} EUR to wallet for failed payment`);
                }
              }
            } catch (walletError) {
              console.error('[Stripe Webhook] Error refunding wallet:', walletError);
              // Don't fail the webhook if wallet refund fails
            }
          }
        }
      } catch (error) {
        console.error('[Stripe Webhook] Error handling payment failure:', error);
      }

      return NextResponse.json({ received: true });
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      
      console.log(`[Stripe Webhook] Charge refunded: ${charge.id}`);
      
      // Find order by payment intent and mark as refunded
      if (charge.payment_intent) {
        try {
          const paymentIntentId = typeof charge.payment_intent === 'string' 
            ? charge.payment_intent 
            : charge.payment_intent.id;

          const order = await prisma.order.findFirst({
            where: { stripePaymentIntentId: paymentIntentId },
          });

          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                isPaid: false,
                paymentStatus: 'REFUNDED',
                status: 'REFUNDED',
              },
            });
            console.log(`[Stripe Webhook] Order ${order.orderNumber} marked as refunded`);
          }
        } catch (error) {
          console.error('[Stripe Webhook] Error handling refund:', error);
        }
      }

      return NextResponse.json({ received: true });
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      return NextResponse.json({ received: true });
  }
  } catch (error: any) {
    console.error('[Stripe Webhook] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', message: error.message },
      { status: 500 }
    );
  }
}

