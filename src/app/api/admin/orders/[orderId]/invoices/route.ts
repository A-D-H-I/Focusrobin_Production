import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getInvoiceDataFromOrder, InvoiceData } from '@/lib/invoice';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Set runtime to nodejs
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Generate combined PDF with Payment Confirmation + Invoice using pdf-lib
 */
async function generateCombinedPDF(invoiceData: InvoiceData): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Embed fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Colors
  const brandColor = rgb(0.16, 0.62, 0.60); // #2A9D9A
  const greenColor = rgb(0.30, 0.69, 0.31); // #4CAF50
  const grayColor = rgb(0.4, 0.4, 0.4);
  const blackColor = rgb(0, 0, 0);
  
  // ==================== PAGE 1: Payment Confirmation ====================
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page1.getSize();
  
  // Header - Logo
  page1.drawText('FocusRobin', {
    x: 50,
    y: height - 50,
    size: 24,
    font: helveticaBold,
    color: brandColor,
  });
  
  page1.drawText('Payment Confirmation', {
    x: 50,
    y: height - 70,
    size: 10,
    font: helvetica,
    color: grayColor,
  });
  
  // Order details (right side)
  page1.drawText(`Order Number: ${invoiceData.orderNumber}`, {
    x: 400,
    y: height - 50,
    size: 12,
    font: helvetica,
    color: blackColor,
  });
  
  const dateStr = invoiceData.orderDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  page1.drawText(`Date: ${dateStr}`, {
    x: 400,
    y: height - 70,
    size: 12,
    font: helvetica,
    color: blackColor,
  });
  
  // Success message
  let yPos = height - 150;
  page1.drawText('Payment Successful!', {
    x: 50,
    y: yPos,
    size: 18,
    font: helveticaBold,
    color: greenColor,
  });
  
  yPos -= 40;
  page1.drawText(`Dear ${invoiceData.customerName || 'Customer'},`, {
    x: 50,
    y: yPos,
    size: 12,
    font: helvetica,
    color: blackColor,
  });
  
  yPos -= 25;
  page1.drawText('Thank you for your purchase! Your payment has been successfully processed.', {
    x: 50,
    y: yPos,
    size: 12,
    font: helvetica,
    color: blackColor,
  });
  
  // Payment Summary
  yPos -= 50;
  page1.drawText('Payment Summary', {
    x: 50,
    y: yPos,
    size: 14,
    font: helveticaBold,
    color: brandColor,
  });
  
  yPos -= 30;
  page1.drawText('Total Amount Paid:', {
    x: 50,
    y: yPos,
    size: 11,
    font: helvetica,
    color: blackColor,
  });
  page1.drawText(`${invoiceData.currency} ${invoiceData.total.toFixed(2)}`, {
    x: 400,
    y: yPos,
    size: 11,
    font: helveticaBold,
    color: blackColor,
  });
  
  yPos -= 25;
  page1.drawText('Payment Method: Stripe', {
    x: 50,
    y: yPos,
    size: 11,
    font: helvetica,
    color: blackColor,
  });
  
  yPos -= 20;
  page1.drawText('Payment Status: Completed', {
    x: 50,
    y: yPos,
    size: 11,
    font: helvetica,
    color: greenColor,
  });
  
  // Shipping Address
  yPos -= 50;
  page1.drawText('Shipping Address', {
    x: 50,
    y: yPos,
    size: 14,
    font: helveticaBold,
    color: brandColor,
  });
  
  yPos -= 25;
  page1.drawText(invoiceData.shippingAddress.name, {
    x: 50,
    y: yPos,
    size: 11,
    font: helvetica,
    color: blackColor,
  });
  
  yPos -= 15;
  page1.drawText(invoiceData.shippingAddress.addressLine1, {
    x: 50,
    y: yPos,
    size: 11,
    font: helvetica,
    color: blackColor,
  });
  
  if (invoiceData.shippingAddress.addressLine2) {
    yPos -= 15;
    page1.drawText(invoiceData.shippingAddress.addressLine2, {
      x: 50,
      y: yPos,
      size: 11,
      font: helvetica,
      color: blackColor,
    });
  }
  
  yPos -= 15;
  page1.drawText(`${invoiceData.shippingAddress.city}, ${invoiceData.shippingAddress.postalCode}`, {
    x: 50,
    y: yPos,
    size: 11,
    font: helvetica,
    color: blackColor,
  });
  
  if (invoiceData.shippingAddress.state) {
    yPos -= 15;
    page1.drawText(invoiceData.shippingAddress.state, {
      x: 50,
      y: yPos,
      size: 11,
      font: helvetica,
      color: blackColor,
    });
  }
  
  yPos -= 15;
  page1.drawText(invoiceData.shippingAddress.country, {
    x: 50,
    y: yPos,
    size: 11,
    font: helvetica,
    color: blackColor,
  });
  
  // Footer
  page1.drawText('This is a payment confirmation document.', {
    x: 50,
    y: 50,
    size: 8,
    font: helvetica,
    color: grayColor,
  });
  page1.drawText('Thank you for your purchase!', {
    x: 50,
    y: 38,
    size: 8,
    font: helvetica,
    color: grayColor,
  });
  
  // ==================== PAGE 2: Invoice ====================
  const page2 = pdfDoc.addPage([595.28, 841.89]); // A4 size
  
  // Header - Logo
  page2.drawText('FocusRobin', {
    x: 50,
    y: height - 50,
    size: 24,
    font: helveticaBold,
    color: brandColor,
  });
  
  page2.drawText('Invoice', {
    x: 50,
    y: height - 70,
    size: 10,
    font: helvetica,
    color: grayColor,
  });
  
  // Invoice details (right side)
  page2.drawText(`Invoice Number: ${invoiceData.orderNumber}`, {
    x: 400,
    y: height - 50,
    size: 12,
    font: helvetica,
    color: blackColor,
  });
  
  page2.drawText(`Date: ${dateStr}`, {
    x: 400,
    y: height - 70,
    size: 12,
    font: helvetica,
    color: blackColor,
  });
  
  page2.drawText(`Order ID: ${invoiceData.orderId.substring(0, 20)}...`, {
    x: 400,
    y: height - 90,
    size: 10,
    font: helvetica,
    color: grayColor,
  });
  
  // Bill To
  yPos = height - 130;
  page2.drawText('Bill To:', {
    x: 50,
    y: yPos,
    size: 14,
    font: helveticaBold,
    color: brandColor,
  });
  
  yPos -= 25;
  page2.drawText(invoiceData.customerName, {
    x: 50,
    y: yPos,
    size: 11,
    font: helvetica,
    color: blackColor,
  });
  
  yPos -= 15;
  page2.drawText(invoiceData.customerEmail, {
    x: 50,
    y: yPos,
    size: 11,
    font: helvetica,
    color: blackColor,
  });
  
  yPos -= 15;
  page2.drawText(invoiceData.shippingAddress.addressLine1, {
    x: 50,
    y: yPos,
    size: 11,
    font: helvetica,
    color: blackColor,
  });
  
  if (invoiceData.shippingAddress.addressLine2) {
    yPos -= 15;
    page2.drawText(invoiceData.shippingAddress.addressLine2, {
      x: 50,
      y: yPos,
      size: 11,
      font: helvetica,
      color: blackColor,
    });
  }
  
  yPos -= 15;
  page2.drawText(`${invoiceData.shippingAddress.city}, ${invoiceData.shippingAddress.postalCode}`, {
    x: 50,
    y: yPos,
    size: 11,
    font: helvetica,
    color: blackColor,
  });
  
  yPos -= 15;
  page2.drawText(invoiceData.shippingAddress.country, {
    x: 50,
    y: yPos,
    size: 11,
    font: helvetica,
    color: blackColor,
  });
  
  // Items Table Header
  yPos -= 40;
  const tableTop = yPos;
  
  // Draw header background
  page2.drawRectangle({
    x: 50,
    y: yPos - 5,
    width: 500,
    height: 20,
    color: rgb(0.95, 0.95, 0.95),
  });
  
  page2.drawText('Item', {
    x: 55,
    y: yPos,
    size: 10,
    font: helveticaBold,
    color: brandColor,
  });
  page2.drawText('Qty', {
    x: 300,
    y: yPos,
    size: 10,
    font: helveticaBold,
    color: brandColor,
  });
  page2.drawText('Price', {
    x: 370,
    y: yPos,
    size: 10,
    font: helveticaBold,
    color: brandColor,
  });
  page2.drawText('Total', {
    x: 470,
    y: yPos,
    size: 10,
    font: helveticaBold,
    color: brandColor,
  });
  
  // Draw line under header
  yPos -= 20;
  page2.drawLine({
    start: { x: 50, y: yPos + 5 },
    end: { x: 550, y: yPos + 5 },
    thickness: 1,
    color: brandColor,
  });
  
  // Items
  yPos -= 10;
  invoiceData.items.forEach((item) => {
    // Truncate long names
    const itemName = item.name.length > 35 ? item.name.substring(0, 35) + '...' : item.name;
    const variantName = item.variant.length > 35 ? item.variant.substring(0, 35) + '...' : item.variant;
    
    page2.drawText(itemName, {
      x: 55,
      y: yPos,
      size: 10,
      font: helvetica,
      color: blackColor,
    });
    
    yPos -= 12;
    page2.drawText(variantName, {
      x: 55,
      y: yPos,
      size: 9,
      font: helvetica,
      color: grayColor,
    });
    
    page2.drawText(item.quantity.toString(), {
      x: 300,
      y: yPos + 6,
      size: 10,
      font: helvetica,
      color: blackColor,
    });
    
    page2.drawText(`${invoiceData.currency} ${item.price.toFixed(2)}`, {
      x: 370,
      y: yPos + 6,
      size: 10,
      font: helvetica,
      color: blackColor,
    });
    
    page2.drawText(`${invoiceData.currency} ${item.total.toFixed(2)}`, {
      x: 470,
      y: yPos + 6,
      size: 10,
      font: helvetica,
      color: blackColor,
    });
    
    yPos -= 25;
  });
  
  // Totals
  yPos -= 20;
  page2.drawLine({
    start: { x: 350, y: yPos + 15 },
    end: { x: 550, y: yPos + 15 },
    thickness: 0.5,
    color: grayColor,
  });
  
  page2.drawText('Subtotal:', {
    x: 370,
    y: yPos,
    size: 10,
    font: helvetica,
    color: blackColor,
  });
  page2.drawText(`${invoiceData.currency} ${invoiceData.subtotal.toFixed(2)}`, {
    x: 470,
    y: yPos,
    size: 10,
    font: helvetica,
    color: blackColor,
  });
  
  yPos -= 20;
  page2.drawText('Shipping:', {
    x: 370,
    y: yPos,
    size: 10,
    font: helvetica,
    color: blackColor,
  });
  page2.drawText(`${invoiceData.currency} ${invoiceData.shipping.toFixed(2)}`, {
    x: 470,
    y: yPos,
    size: 10,
    font: helvetica,
    color: blackColor,
  });
  
  yPos -= 25;
  page2.drawText('Total:', {
    x: 370,
    y: yPos,
    size: 12,
    font: helveticaBold,
    color: brandColor,
  });
  page2.drawText(`${invoiceData.currency} ${invoiceData.total.toFixed(2)}`, {
    x: 470,
    y: yPos,
    size: 12,
    font: helveticaBold,
    color: brandColor,
  });
  
  // Footer
  page2.drawText('Thank you for your purchase!', {
    x: 50,
    y: 50,
    size: 8,
    font: helvetica,
    color: grayColor,
  });
  page2.drawText('This is an automated invoice generated by FocusRobin.', {
    x: 50,
    y: 38,
    size: 8,
    font: helvetica,
    color: grayColor,
  });
  
  // Save the PDF
  return await pdfDoc.save();
}

/**
 * GET /api/admin/orders/[orderId]/invoices
 * Download both invoices (payment confirmation + product invoice) as PDF
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Await params in Next.js 15
    const { orderId } = await params;

    // Get invoice data
    const invoiceData = await getInvoiceDataFromOrder(orderId);
    
    if (!invoiceData) {
      console.error(`[Invoice API] Order not found: ${orderId}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log(`[Invoice API] Generating invoices for order: ${invoiceData.orderNumber}`);

    try {
      // Generate combined PDF using pdf-lib
      const pdfBytes = await generateCombinedPDF(invoiceData);
      console.log(`[Invoice API] PDF generated successfully, size: ${pdfBytes.length} bytes`);

      // Return the PDF as response
      return new NextResponse(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Invoices-${invoiceData.orderNumber}.pdf"`,
        },
      });
    } catch (pdfError: any) {
      console.error('[Invoice API] PDF generation error:', pdfError);
      console.error('[Invoice API] PDF error stack:', pdfError?.stack);
      throw pdfError;
    }
  } catch (error: any) {
    console.error('[Invoice API] Error generating invoices:', error);
    console.error('[Invoice API] Error stack:', error?.stack);
    return NextResponse.json(
      { 
        error: 'Failed to generate invoices',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
