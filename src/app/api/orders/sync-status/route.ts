import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { syncOrderStatusWithStripe } from '@/app/actions/checkout';

/**
 * POST /api/orders/sync-status
 * Sync order status with Stripe (fallback if webhook hasn't fired)
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const result = await syncOrderStatusWithStripe(orderId);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to sync order status' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Sync Status API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync order status' },
      { status: 500 }
    );
  }
}


