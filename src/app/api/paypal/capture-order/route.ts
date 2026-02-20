import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { capturePayPalOrder } from '@/lib/paypal';
import { finalizeOrder } from '@/lib/order-fulfillment';

interface CaptureOrderRequest {
  paypalOrderId: string;
  orderId: string;
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

    // Check if order is already paid
    if (order.isPaid) {
      console.log('[PayPal] Order already paid:', order.orderNumber);
      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        captureId: order.paypalCaptureId,
        message: 'Order already paid'
      });
    }

    // Capture the PayPal order
    const captureResult = await capturePayPalOrder(paypalOrderId);

    if (captureResult.status !== 'COMPLETED') {
      console.error('[PayPal] Capture failed with status:', captureResult.status);

      console.error('[PayPal] Capture failed with status:', captureResult.status);

      // NOTE: Wallet refund logic removed because we now deduct wallet balance ONLY after successful payment.
      // So if capture fails, no deduction has occurred yet.

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

    // Run centralized fulfillment logic (stock, cart, cashback, invoice)
    try {
      await finalizeOrder(orderId);
      console.log('[PayPal] Order fulfillment completed');
    } catch (error) {
      console.error('[PayPal] Order fulfillment failed (after payment):', error);
      // We don't fail the request here because payment was successful
    }

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
