import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
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
        // Payment is confirmed, but order might not be updated yet (webhook might be delayed)
        // Return pending status - the webhook will update it
        return NextResponse.json({
          success: true,
          paymentStatus: 'PENDING', // Payment is paid but order not updated yet
          stripePaymentStatus: paymentStatus,
          stripeSessionStatus: sessionStatus,
          orderStatus: order.status,
          isPaid: false, // Order not marked as paid yet
          message: 'Payment confirmed. Processing order...',
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

