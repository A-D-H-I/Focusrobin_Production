import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePrescriptionPDF, extractPrescriptionFromOrderItem, hasValidPrescriptionValues } from '@/lib/prescription-pdf';
import { requireAuth } from '@/lib/security';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; itemId: string }> }
) {
  try {
    const { session } = await requireAuth();
    const { orderId, itemId } = await params;

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          where: { id: itemId },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify the order belongs to the user
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Find the item
    const item = order.items.find(i => i.id === itemId);
    if (!item) {
      return NextResponse.json({ error: 'Order item not found' }, { status: 404 });
    }

    // Check if item has valid prescription data (not just the field exists)
    if (!item.prescriptionData || !hasValidPrescriptionValues(item.prescriptionData)) {
      return NextResponse.json({ error: 'This item does not have valid prescription data' }, { status: 400 });
    }

    // Extract prescription data with variant info for better tracking
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

    if (!prescriptionPdfData) {
      return NextResponse.json({ error: 'Failed to extract prescription data' }, { status: 500 });
    }

    // Generate PDF (shipping address removed - not needed in prescription PDF)
    const pdfBuffer = await generatePrescriptionPDF(prescriptionPdfData);

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="prescription-${order.orderNumber}-${item.productName.replace(/\s+/g, '-')}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('[Prescription PDF] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate prescription PDF' },
      { status: 500 }
    );
  }
}

