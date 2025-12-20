import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { getInvoiceDataFromOrder } from '@/lib/invoice';
import { uploadInvoiceToDrive, getOrCreateInvoicesFolder } from '@/lib/google-drive';
import { sendOrderConfirmationWithDocuments } from '@/lib/invoice-email';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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
  page2.drawText('FocusRobin', { x: 50, y: height - 50, size: 24, font: helveticaBold, color: brandColor });
  page2.drawText('Invoice', { x: 50, y: height - 70, size: 10, font: helvetica, color: grayColor });
  page2.drawText(`Invoice Number: ${invoiceData.orderNumber}`, { x: 400, y: height - 50, size: 12, font: helvetica, color: blackColor });
  page2.drawText(`Date: ${dateStr}`, { x: 400, y: height - 70, size: 12, font: helvetica, color: blackColor });
  page2.drawText(`Order ID: ${invoiceData.orderId.substring(0, 20)}...`, { x: 400, y: height - 90, size: 10, font: helvetica, color: grayColor });
  
  yPos = height - 130;
  page2.drawText('Bill To:', { x: 50, y: yPos, size: 14, font: helveticaBold, color: brandColor });
  yPos -= 25;
  page2.drawText(invoiceData.customerName, { x: 50, y: yPos, size: 11, font: helvetica, color: blackColor });
  yPos -= 15;
  page2.drawText(invoiceData.customerEmail, { x: 50, y: yPos, size: 11, font: helvetica, color: blackColor });
  yPos -= 15;
  page2.drawText(invoiceData.shippingAddress.addressLine1, { x: 50, y: yPos, size: 11, font: helvetica, color: blackColor });
  if (invoiceData.shippingAddress.addressLine2) {
    yPos -= 15;
    page2.drawText(invoiceData.shippingAddress.addressLine2, { x: 50, y: yPos, size: 11, font: helvetica, color: blackColor });
  }
  yPos -= 15;
  page2.drawText(`${invoiceData.shippingAddress.city}, ${invoiceData.shippingAddress.postalCode}`, { x: 50, y: yPos, size: 11, font: helvetica, color: blackColor });
  yPos -= 15;
  page2.drawText(invoiceData.shippingAddress.country, { x: 50, y: yPos, size: 11, font: helvetica, color: blackColor });
  
  yPos -= 40;
  page2.drawRectangle({ x: 50, y: yPos - 5, width: 500, height: 20, color: rgb(0.95, 0.95, 0.95) });
  page2.drawText('Item', { x: 55, y: yPos, size: 10, font: helveticaBold, color: brandColor });
  page2.drawText('Qty', { x: 300, y: yPos, size: 10, font: helveticaBold, color: brandColor });
  page2.drawText('Price', { x: 370, y: yPos, size: 10, font: helveticaBold, color: brandColor });
  page2.drawText('Total', { x: 470, y: yPos, size: 10, font: helveticaBold, color: brandColor });
  
  yPos -= 20;
  page2.drawLine({ start: { x: 50, y: yPos + 5 }, end: { x: 550, y: yPos + 5 }, thickness: 1, color: brandColor });
  
  yPos -= 10;
  invoiceData.items.forEach((item: any) => {
    const itemName = item.name.length > 35 ? item.name.substring(0, 35) + '...' : item.name;
    const variantName = item.variant.length > 35 ? item.variant.substring(0, 35) + '...' : item.variant;
    page2.drawText(itemName, { x: 55, y: yPos, size: 10, font: helvetica, color: blackColor });
    yPos -= 12;
    page2.drawText(variantName, { x: 55, y: yPos, size: 9, font: helvetica, color: grayColor });
    page2.drawText(item.quantity.toString(), { x: 300, y: yPos + 6, size: 10, font: helvetica, color: blackColor });
    page2.drawText(`${invoiceData.currency} ${item.price.toFixed(2)}`, { x: 370, y: yPos + 6, size: 10, font: helvetica, color: blackColor });
    page2.drawText(`${invoiceData.currency} ${item.total.toFixed(2)}`, { x: 470, y: yPos + 6, size: 10, font: helvetica, color: blackColor });
    yPos -= 25;
  });
  
  yPos -= 20;
  page2.drawLine({ start: { x: 350, y: yPos + 15 }, end: { x: 550, y: yPos + 15 }, thickness: 0.5, color: grayColor });
  page2.drawText('Subtotal:', { x: 370, y: yPos, size: 10, font: helvetica, color: blackColor });
  page2.drawText(`${invoiceData.currency} ${invoiceData.subtotal.toFixed(2)}`, { x: 470, y: yPos, size: 10, font: helvetica, color: blackColor });
  yPos -= 20;
  page2.drawText('Shipping:', { x: 370, y: yPos, size: 10, font: helvetica, color: blackColor });
  page2.drawText(`${invoiceData.currency} ${invoiceData.shipping.toFixed(2)}`, { x: 470, y: yPos, size: 10, font: helvetica, color: blackColor });
  yPos -= 25;
  page2.drawText('Total:', { x: 370, y: yPos, size: 12, font: helveticaBold, color: brandColor });
  page2.drawText(`${invoiceData.currency} ${invoiceData.total.toFixed(2)}`, { x: 470, y: yPos, size: 12, font: helveticaBold, color: brandColor });
  
  page2.drawText('Thank you for your purchase!', { x: 50, y: 50, size: 8, font: helvetica, color: grayColor });
  page2.drawText('This is an automated invoice generated by FocusRobin.', { x: 50, y: 38, size: 8, font: helvetica, color: grayColor });
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Process invoice generation, email sending, and Google Drive upload
 * This runs asynchronously to not block the webhook response
 */
async function processInvoice(orderId: string, orderNumber: string) {
  console.log(`[Invoice] Starting invoice processing for order ${orderNumber}...`);
  
  try {
    // Get invoice data
    console.log(`[Invoice] Fetching invoice data for order ${orderId}...`);
    const invoiceData = await getInvoiceDataFromOrder(orderId);
    if (!invoiceData) {
      console.error(`[Invoice] Could not get invoice data for order ${orderId}`);
      return;
    }
    console.log(`[Invoice] Invoice data retrieved for customer: ${invoiceData.customerEmail}`);

    // Generate combined PDF (Payment Receipt + Invoice)
    console.log(`[Invoice] Generating combined PDF (Payment Receipt + Invoice)...`);
    const pdfBuffer = await generateCombinedPDF(invoiceData);
    console.log(`[Invoice] Combined PDF generated successfully (${pdfBuffer.length} bytes)`);
    
    // Upload to Google Drive
    console.log(`[Invoice] Attempting Google Drive upload...`);
    let driveResult = null;
    try {
      const folderId = await getOrCreateInvoicesFolder();
      const fileName = `FocusRobin-Order-${invoiceData.orderNumber}-Documents-${new Date().toISOString().split('T')[0]}.pdf`;
      driveResult = await uploadInvoiceToDrive(pdfBuffer, fileName, folderId || undefined);
      
      if (driveResult) {
        console.log(`[Invoice] ✓ Uploaded to Google Drive: ${driveResult.webViewLink}`);
      } else {
        console.warn(`[Invoice] ✗ Google Drive upload returned null (may not be configured)`);
      }
    } catch (driveError: any) {
      console.error(`[Invoice] ✗ Google Drive upload error:`, driveError.message);
    }

    // Send single email with both documents
    console.log(`[Invoice] Sending order confirmation email with documents...`);
    try {
      const emailResult = await sendOrderConfirmationWithDocuments(invoiceData);
      if (emailResult.success) {
        console.log(`[Invoice] ✓ Order confirmation email sent successfully`);
      } else {
        console.error(`[Invoice] ✗ Order confirmation email failed:`, emailResult.error);
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
      console.log(`[Stripe Webhook] Metadata:`, session.metadata);

      const orderId = session.metadata?.orderId;
      const userId = session.metadata?.userId;
      const walletAmountUsed = parseFloat(session.metadata?.walletAmountUsed || '0');
      const walletTransactionId = session.metadata?.walletTransactionId;

      if (!orderId) {
        console.error('[Stripe Webhook] No orderId in session metadata');
        return NextResponse.json({ error: 'No orderId in metadata' }, { status: 400 });
      }

      try {
        // Update the order
        // When payment is successful:
        // - paymentStatus = 'COMPLETED' (payment is done)
        // - status = 'CONFIRMED' or 'PROCESSING' (order is being processed)
        const order = await prisma.order.update({
          where: { id: orderId },
          data: {
            isPaid: session.payment_status === 'paid',
            paymentStatus: session.payment_status === 'paid' ? 'COMPLETED' : 'PROCESSING',
            status: session.payment_status === 'paid' ? 'CONFIRMED' : 'PENDING',
            stripePaymentIntentId: typeof session.payment_intent === 'string' 
              ? session.payment_intent 
              : session.payment_intent?.id || null,
          },
        });

        console.log(`[Stripe Webhook] Order ${order.orderNumber} updated to ${order.status}`);

        // Update wallet transaction description if wallet was used and payment succeeded
        if (session.payment_status === 'paid' && walletAmountUsed > 0 && walletTransactionId) {
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
        if (session.payment_status === 'paid' && userId) {
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

          // Send order confirmation email (async, don't block webhook response)
          console.log(`[Stripe Webhook] Triggering order confirmation email for order ${orderId}...`);
          try {
            const { sendOrderConfirmationEmail } = await import("@/lib/order-email");
            // Await the email to see the result in logs
            const emailResult = await sendOrderConfirmationEmail(orderId);
            if (emailResult.success) {
              console.log(`[Stripe Webhook] ✓ Order confirmation email sent successfully`);
            } else {
              console.error(`[Stripe Webhook] ✗ Order confirmation email failed:`, emailResult.error);
            }
          } catch (emailError: any) {
            console.error('[Stripe Webhook] ✗ Error with order email module:', emailError.message);
          }

          // Generate and send invoices asynchronously (don't block webhook response)
          // This runs in the background so the webhook can respond quickly
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
              });

              if (wallet) {
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
              });

              if (wallet) {
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

