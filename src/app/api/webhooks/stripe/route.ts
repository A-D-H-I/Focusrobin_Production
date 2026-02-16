import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { finalizeOrder } from '@/lib/order-fulfillment';

// Disable body parsing, Stripe needs raw body
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Generate combined PDF with Payment Receipt + Invoice using pdf-lib
 * Same as the one used in admin panel
 */


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

          // Finalize order (Stock, Cart, Cashback, Invoice)
          await finalizeOrder(orderId);

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

