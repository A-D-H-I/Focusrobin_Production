import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPayPalWebhook, getPayPalOrderDetails, capturePayPalOrder } from '@/lib/paypal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PayPal Webhook Handler
 * 
 * Handles PayPal webhook events for order updates
 * 
 * Supported events:
 * - CHECKOUT.ORDER.APPROVED: Customer approved the payment
 * - PAYMENT.CAPTURE.COMPLETED: Payment was captured successfully
 * - PAYMENT.CAPTURE.DENIED: Payment capture was denied
 * - PAYMENT.CAPTURE.REFUNDED: Payment was refunded
 */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headers: Record<string, string> = {};
    
    // Extract PayPal verification headers
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    // Verify webhook signature if webhook ID is configured
    if (webhookId) {
      const isValid = await verifyPayPalWebhook(headers, body, webhookId);
      if (!isValid) {
        console.error('[PayPal Webhook] Signature verification failed');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      console.log('[PayPal Webhook] Signature verified successfully');
    } else {
      console.warn('[PayPal Webhook] PAYPAL_WEBHOOK_ID not set - skipping signature verification');
    }

    const event = JSON.parse(body);
    const eventType = event.event_type;
    const resource = event.resource;

    console.log(`[PayPal Webhook] Received event: ${eventType}`);
    console.log(`[PayPal Webhook] Resource:`, JSON.stringify(resource, null, 2));

    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED': {
        // Customer approved the order, capture the payment
        const paypalOrderId = resource.id;
        
        console.log(`[PayPal Webhook] Order approved: ${paypalOrderId}`);

        // Find the order in our database
        const order = await prisma.order.findFirst({
          where: { paypalOrderId },
        });

        if (!order) {
          console.error(`[PayPal Webhook] Order not found for PayPal order: ${paypalOrderId}`);
          return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // If not already paid, capture the payment
        if (!order.isPaid) {
          try {
            const captureResult = await capturePayPalOrder(paypalOrderId);
            
            if (captureResult.status === 'COMPLETED') {
              await prisma.order.update({
                where: { id: order.id },
                data: {
                  isPaid: true,
                  paymentStatus: 'COMPLETED',
                  status: 'CONFIRMED',
                  paypalCaptureId: captureResult.purchase_units[0]?.payments?.captures[0]?.id,
                },
              });
              console.log(`[PayPal Webhook] Order ${order.orderNumber} captured and marked as paid`);
            }
          } catch (captureError: any) {
            console.error('[PayPal Webhook] Failed to capture order:', captureError);
          }
        }

        return NextResponse.json({ received: true });
      }

      case 'PAYMENT.CAPTURE.COMPLETED': {
        // Payment was captured successfully
        const captureId = resource.id;
        const paypalOrderId = resource.supplementary_data?.related_ids?.order_id;

        console.log(`[PayPal Webhook] Payment captured: ${captureId}`);

        // Find the order
        const order = await prisma.order.findFirst({
          where: paypalOrderId ? { paypalOrderId } : { paypalCaptureId: captureId },
        });

        if (order && !order.isPaid) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              isPaid: true,
              paymentStatus: 'COMPLETED',
              status: 'CONFIRMED',
              paypalCaptureId: captureId,
            },
          });

          console.log(`[PayPal Webhook] Order ${order.orderNumber} marked as paid via capture webhook`);

          // Update stock and clear cart
          const orderItems = await prisma.orderItem.findMany({
            where: { orderId: order.id },
          });

          for (const item of orderItems) {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: { decrement: item.quantity },
              },
            });
          }

          await prisma.cartItem.deleteMany({
            where: {
              Cart: { userId: order.userId },
            },
          });
        }

        return NextResponse.json({ received: true });
      }

      case 'PAYMENT.CAPTURE.DENIED': {
        // Payment was denied
        const captureId = resource.id;

        console.log(`[PayPal Webhook] Payment denied: ${captureId}`);

        const order = await prisma.order.findFirst({
          where: { paypalCaptureId: captureId },
        });

        if (order) {
          // Refund wallet if used
          if (order.walletAmountUsed && Number(order.walletAmountUsed) > 0) {
            const wallet = await prisma.wallet.findUnique({
              where: { userId: order.userId },
            });

            if (wallet) {
              await prisma.wallet.update({
                where: { userId: order.userId },
                data: {
                  balance: { increment: Number(order.walletAmountUsed) },
                },
              });

              await prisma.walletTransaction.create({
                data: {
                  walletId: wallet.id,
                  amount: Number(order.walletAmountUsed),
                  type: 'CREDIT',
                  description: `Refund for denied PayPal payment - Order ${order.orderNumber}`,
                },
              });
            }
          }

          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'FAILED',
              status: 'CANCELLED',
            },
          });

          console.log(`[PayPal Webhook] Order ${order.orderNumber} marked as failed`);
        }

        return NextResponse.json({ received: true });
      }

      case 'PAYMENT.CAPTURE.REFUNDED': {
        // Payment was refunded
        const captureId = resource.id;
        const refundAmount = parseFloat(resource.amount?.value || '0');

        console.log(`[PayPal Webhook] Payment refunded: ${captureId}, amount: ${refundAmount}`);

        const order = await prisma.order.findFirst({
          where: { paypalCaptureId: captureId },
        });

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'REFUNDED',
              status: 'REFUNDED',
            },
          });

          console.log(`[PayPal Webhook] Order ${order.orderNumber} marked as refunded`);
        }

        return NextResponse.json({ received: true });
      }

      case 'CHECKOUT.ORDER.CANCELLED':
      case 'CHECKOUT.ORDER.VOIDED': {
        // Order was cancelled or voided by user or PayPal
        const paypalOrderId = resource.id;

        console.log(`[PayPal Webhook] Order cancelled/voided: ${paypalOrderId}`);

        const order = await prisma.order.findFirst({
          where: { paypalOrderId },
          include: {
            User: {
              select: { id: true },
            },
          },
        });

        if (order && !order.isPaid) {
          // Refund wallet if used
          if (order.walletAmountUsed && Number(order.walletAmountUsed) > 0) {
            const wallet = await prisma.wallet.findUnique({
              where: { userId: order.User.id },
              include: {
                transactions: {
                  where: {
                    description: {
                      contains: `Refund for cancelled order ${order.orderNumber}`,
                    },
                    type: 'CREDIT',
                  },
                  take: 1,
                },
              },
            });

            if (wallet) {
              // Check if already refunded
              if (wallet.transactions.length === 0) {
                await prisma.wallet.update({
                  where: { userId: order.User.id },
                  data: {
                    balance: { increment: Number(order.walletAmountUsed) },
                  },
                });

                await prisma.walletTransaction.create({
                  data: {
                    walletId: wallet.id,
                    amount: Number(order.walletAmountUsed),
                    type: 'CREDIT',
                    description: `Refund for cancelled PayPal order ${order.orderNumber}`,
                  },
                });

                console.log(`[PayPal Webhook] Refunded ${order.walletAmountUsed} EUR to wallet for cancelled order`);
              } else {
                console.log(`[PayPal Webhook] Wallet already refunded for order ${order.orderNumber}`);
              }
            }
          }

          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'FAILED',
              status: 'CANCELLED',
            },
          });

          console.log(`[PayPal Webhook] Order ${order.orderNumber} marked as cancelled`);
        }

        return NextResponse.json({ received: true });
      }

      default:
        console.log(`[PayPal Webhook] Unhandled event type: ${eventType}`);
        return NextResponse.json({ received: true });
    }
  } catch (error: any) {
    console.error('[PayPal Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', message: error.message },
      { status: 500 }
    );
  }
}

