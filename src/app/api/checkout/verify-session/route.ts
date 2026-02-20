import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { finalizeOrder } from '@/lib/order-fulfillment';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

/**
 * Verify Stripe checkout session status for an order
 * This is called from the success page to check if payment was actually completed
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        stripeSessionId: true,
        paymentStatus: true,
        status: true,
        isPaid: true,
        walletAmountUsed: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify the order belongs to the user
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // If already paid, return success
    if (order.isPaid && order.paymentStatus === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        paymentStatus: 'COMPLETED',
        orderStatus: order.status,
        isPaid: true,
        message: 'Payment completed successfully',
      });
    }

    // If no Stripe session ID, can't verify
    if (!order.stripeSessionId) {
      return NextResponse.json({
        success: false,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        isPaid: false,
        message: 'No Stripe session found. Payment may not have been initiated.',
        shouldRefundWallet: order.walletAmountUsed && order.walletAmountUsed > 0 && !order.isPaid,
      });
    }

    try {
      // Retrieve the Stripe session
      const stripeSession = await stripe.checkout.sessions.retrieve(order.stripeSessionId);

      // Check payment status
      const paymentStatus = stripeSession.payment_status; // 'paid', 'unpaid', 'no_payment_required'
      const sessionStatus = stripeSession.status; // 'complete', 'expired', 'open'

      console.log(`[VerifySession] Order ${orderId}: payment_status=${paymentStatus}, status=${sessionStatus}`);

      // Payment completed
      if (paymentStatus === 'paid' && sessionStatus === 'complete') {
        // Check if order was already paid (to prevent double fulfillment)
        const wasAlreadyPaid = order.isPaid && order.paymentStatus === 'COMPLETED';

        if (!wasAlreadyPaid) {
          // Payment is confirmed by Stripe - update the order directly
          // This acts as a safety net in case the webhook is delayed or doesn't fire (e.g., local dev)
          try {
            await prisma.order.update({
              where: { id: orderId },
              data: {
                isPaid: true,
                paymentStatus: 'COMPLETED',
                status: 'CONFIRMED',
              },
            });
            console.log(`[VerifySession] Order ${orderId} marked as paid (Stripe confirmed)`);

            // Run full fulfillment: stock update, cart clear, cashback, invoice, email
            try {
              await finalizeOrder(orderId);
              console.log(`[VerifySession] Order ${orderId} fulfillment completed`);
            } catch (fulfillmentError) {
              console.error(`[VerifySession] Fulfillment error for order ${orderId}:`, fulfillmentError);
              // Don't fail the response - order is already marked as paid
            }
          } catch (updateError) {
            console.error(`[VerifySession] Failed to update order ${orderId}:`, updateError);
            // Don't fail the response - the webhook may still update it
          }
        } else {
          console.log(`[VerifySession] Order ${orderId} was already paid, skipping fulfillment`);
        }

        return NextResponse.json({
          success: true,
          paymentStatus: 'COMPLETED',
          stripePaymentStatus: paymentStatus,
          stripeSessionStatus: sessionStatus,
          orderStatus: 'CONFIRMED',
          isPaid: true,
          message: 'Payment completed successfully',
          shouldRefundWallet: false,
        });
      }

      // Payment not completed - various scenarios
      if (paymentStatus === 'unpaid' || sessionStatus === 'expired' || sessionStatus === 'open') {
        // Payment was not completed
        const shouldRefund = order.walletAmountUsed && order.walletAmountUsed > 0 && !order.isPaid;

        return NextResponse.json({
          success: false,
          paymentStatus: 'FAILED',
          stripePaymentStatus: paymentStatus,
          stripeSessionStatus: sessionStatus,
          orderStatus: order.status,
          isPaid: false,
          message: sessionStatus === 'expired'
            ? 'Payment session expired. Please try again.'
            : paymentStatus === 'unpaid'
              ? 'Payment was not completed. Please try again.'
              : 'Payment is still pending. Please wait or try again.',
          shouldRefundWallet: shouldRefund,
        });
      }

      // Unknown status
      return NextResponse.json({
        success: false,
        paymentStatus: order.paymentStatus,
        stripePaymentStatus: paymentStatus,
        stripeSessionStatus: sessionStatus,
        orderStatus: order.status,
        isPaid: false,
        message: 'Payment status is unclear. Please check your orders page.',
        shouldRefundWallet: order.walletAmountUsed && order.walletAmountUsed > 0 && !order.isPaid,
      });

    } catch (stripeError: any) {
      console.error(`[VerifySession] Error retrieving Stripe session:`, stripeError);
      return NextResponse.json({
        success: false,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        isPaid: false,
        message: 'Could not verify payment status. Please check your orders page.',
        shouldRefundWallet: order.walletAmountUsed && order.walletAmountUsed > 0 && !order.isPaid,
        error: stripeError.message,
      });
    }

  } catch (error: any) {
    console.error('[VerifySession] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

