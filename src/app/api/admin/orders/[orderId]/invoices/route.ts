import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getInvoiceDataFromOrder, InvoiceData, generateInvoicePDF } from '@/lib/invoice';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generatePrescriptionPDF, extractPrescriptionFromOrderItem, hasValidPrescriptionValues } from '@/lib/prescription-pdf';

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
  const orangeBackground = rgb(1.0, 0.647, 0.0); // Vibrant orange #FFA500
  const whiteColor = rgb(1.0, 1.0, 1.0);
  
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
  
  // Fill entire page with orange background
  page2.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: height,
    color: orangeBackground,
  });
  
  // Header Section - Company Name and Contact Info
  let yPos2 = height - 50;
  
  // Company Name (large, white, bold)
  page2.drawText(invoiceData.companyName || 'FocusRobin', {
    x: 50,
    y: yPos2,
    size: 32,
    font: helveticaBold,
    color: whiteColor,
  });
  
  // Contact Information (right side, top)
  const contactInfo = [
    invoiceData.companyPhone || '+123-456-7890',
    invoiceData.companyEmail || 'hello@focusrobin.com',
    invoiceData.companyAddress || '123 Anywhere St., Any City',
  ];
  
  let contactY = height - 50;
  contactInfo.forEach((info) => {
    page2.drawText(info, {
      x: 400,
      y: contactY,
      size: 10,
      font: helvetica,
      color: whiteColor,
    });
    contactY -= 15;
  });
  
  // Invoice Title
  yPos2 -= 50;
  page2.drawText('Invoice', {
    x: 50,
    y: yPos2,
    size: 28,
    font: helveticaBold,
    color: whiteColor,
  });
  
  // Invoice Details (left side)
  yPos2 -= 40;
  page2.drawText(`Invoice Number: [${invoiceData.orderNumber}]`, {
    x: 50,
    y: yPos2,
    size: 12,
    font: helvetica,
    color: whiteColor,
  });
  
  yPos2 -= 20;
  page2.drawText(`Billed To: ${invoiceData.customerName}`, {
    x: 50,
    y: yPos2,
    size: 12,
    font: helvetica,
    color: whiteColor,
  });
  
  // Date and Due Date (right side)
  const dueDateStr = invoiceData.dueDate?.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }) || '';
  
  let dateY = height - 130;
  page2.drawText(`Date: [${dateStr}]`, {
    x: 400,
    y: dateY,
    size: 12,
    font: helvetica,
    color: whiteColor,
  });
  
  dateY -= 20;
  page2.drawText(`Due Date: [${dueDateStr}]`, {
    x: 400,
    y: dateY,
    size: 12,
    font: helvetica,
    color: whiteColor,
  });
  
  // Draw horizontal line separator
  yPos2 = height - 220;
  page2.drawLine({
    start: { x: 50, y: yPos2 },
    end: { x: 545, y: yPos2 },
    thickness: 1,
    color: whiteColor,
  });
  
  // Items Section
  yPos2 -= 30;
  
  // Items Table Header
  page2.drawText('Item', {
    x: 50,
    y: yPos2,
    size: 11,
    font: helveticaBold,
    color: whiteColor,
  });
  page2.drawText('Quantity', {
    x: 250,
    y: yPos2,
    size: 11,
    font: helveticaBold,
    color: whiteColor,
  });
  page2.drawText('Unit Price', {
    x: 350,
    y: yPos2,
    size: 11,
    font: helveticaBold,
    color: whiteColor,
  });
  page2.drawText('Total Price', {
    x: 450,
    y: yPos2,
    size: 11,
    font: helveticaBold,
    color: whiteColor,
  });
  
  // Items List
  yPos2 -= 25;
  invoiceData.items.forEach((item) => {
    // Truncate long names if needed
    const itemName = item.name.length > 40 ? item.name.substring(0, 40) + '...' : item.name;
    
    page2.drawText(itemName, {
      x: 50,
      y: yPos2,
      size: 10,
      font: helvetica,
      color: whiteColor,
    });
    
    // Show discount info if applicable
    if (item.originalPrice && item.discountPct) {
      page2.drawText(`(${item.discountPct}% off)`, {
        x: 50,
        y: yPos2 - 12,
        size: 8,
        font: helvetica,
        color: whiteColor,
      });
    }
    
    page2.drawText(item.quantity.toString(), {
      x: 250,
      y: yPos2,
      size: 10,
      font: helvetica,
      color: whiteColor,
    });
    
    // Show original price with strikethrough if discounted
    if (item.originalPrice && item.discountPct) {
      page2.drawText(`${invoiceData.currency} ${item.originalPrice.toFixed(2)}`, {
        x: 350,
        y: yPos2 + 10,
        size: 8,
        font: helvetica,
        color: rgb(0.8, 0.8, 0.8),
      });
      // Draw line through original price
      page2.drawLine({
        start: { x: 350, y: yPos2 + 12 },
        end: { x: 410, y: yPos2 + 12 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
    }
    
    page2.drawText(`${invoiceData.currency} ${item.price.toFixed(2)}`, {
      x: 350,
      y: yPos2,
      size: 10,
      font: helvetica,
      color: whiteColor,
    });
    page2.drawText(`${invoiceData.currency} ${item.total.toFixed(2)}`, {
      x: 450,
      y: yPos2,
      size: 10,
      font: helvetica,
      color: whiteColor,
    });
    yPos2 -= item.originalPrice ? 30 : 20;
  });
  
  // Summary Section
  yPos2 -= 20;
  // Draw horizontal line separator
  page2.drawLine({
    start: { x: 50, y: yPos2 + 10 },
    end: { x: 545, y: yPos2 + 10 },
    thickness: 1,
    color: whiteColor,
  });
  
  yPos2 -= 20;
  
  // Subtotal
  page2.drawText('SUBTOTAL:', {
    x: 370,
    y: yPos2,
    size: 11,
    font: helveticaBold,
    color: whiteColor,
  });
  page2.drawText(`${invoiceData.currency} ${(invoiceData.subtotal + invoiceData.shipping).toFixed(2)}`, {
    x: 470,
    y: yPos2,
    size: 11,
    font: helvetica,
    color: whiteColor,
  });
  
  // Discount
  yPos2 -= 20;
  page2.drawText('DISCOUNT:', {
    x: 370,
    y: yPos2,
    size: 11,
    font: helveticaBold,
    color: whiteColor,
  });
  page2.drawText(`${invoiceData.currency} ${(invoiceData.discount || 0).toFixed(2)}`, {
    x: 470,
    y: yPos2,
    size: 11,
    font: helvetica,
    color: whiteColor,
  });
  
  // Wallet Amount
  if (invoiceData.walletAmount && invoiceData.walletAmount > 0) {
    yPos2 -= 20;
    page2.drawText('WALLET AMOUNT:', {
      x: 370,
      y: yPos2,
      size: 11,
      font: helveticaBold,
      color: whiteColor,
    });
    page2.drawText(`-${invoiceData.currency} ${invoiceData.walletAmount.toFixed(2)}`, {
      x: 470,
      y: yPos2,
      size: 11,
      font: helvetica,
      color: whiteColor,
    });
  }
  
  // Total
  yPos2 -= 25;
  page2.drawText('TOTAL:', {
    x: 370,
    y: yPos2,
    size: 14,
    font: helveticaBold,
    color: whiteColor,
  });
  page2.drawText(`${invoiceData.currency} ${invoiceData.total.toFixed(2)}`, {
    x: 470,
    y: yPos2,
    size: 14,
    font: helveticaBold,
    color: whiteColor,
  });
  
  // Draw horizontal line separator
  yPos2 -= 30;
  page2.drawLine({
    start: { x: 50, y: yPos2 + 10 },
    end: { x: 545, y: yPos2 + 10 },
    thickness: 1,
    color: whiteColor,
  });
  
  // Payment Section
  yPos2 -= 30;
  page2.drawText('Payment', {
    x: 50,
    y: yPos2,
    size: 24,
    font: helveticaBold,
    color: whiteColor,
  });
  
  yPos2 -= 30;
  page2.drawText(`Payment Method: ${invoiceData.paymentMethod || 'Online Payment'}`, {
    x: 50,
    y: yPos2,
    size: 12,
    font: helvetica,
    color: whiteColor,
  });
  
  // Thank You Message (right side)
  page2.drawText('THANK YOU!', {
    x: 400,
    y: yPos2,
    size: 24,
    font: helveticaBold,
    color: whiteColor,
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
      console.error(`[Invoice API] Order not found: ${orderId}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get invoice data
    const invoiceData = await getInvoiceDataFromOrder(orderId);
    
    if (!invoiceData) {
      console.error(`[Invoice API] Invoice data not found: ${orderId}`);
      return NextResponse.json({ error: 'Invoice data not found' }, { status: 404 });
    }

    console.log(`[Invoice API] Generating invoices for order: ${invoiceData.orderNumber}`);

    try {
      // Generate invoice PDF using the new design
      const invoicePdfBuffer = await generateInvoicePDF(invoiceData);
      const invoicePdfBytes = new Uint8Array(invoicePdfBuffer);
      console.log(`[Invoice API] Invoice PDF generated successfully, size: ${invoicePdfBytes.length} bytes`);

      // Check if any order items have VALID prescription data (not just the field exists)
      const prescriptionItems = order.items.filter(item => 
        item.prescriptionData && hasValidPrescriptionValues(item.prescriptionData)
      );
      
      if (prescriptionItems.length === 0) {
        // No valid prescription data, return just the invoice PDF
        console.log(`[Invoice API] No items with valid prescription values found`);
        return new NextResponse(invoicePdfBytes, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Invoices-${invoiceData.orderNumber}.pdf"`,
          },
        });
      }

      // Generate prescription PDFs and merge them
      console.log(`[Invoice API] Found ${prescriptionItems.length} items with valid prescription data`);
      
      // Load the invoice PDF
      const mergedPdf = await PDFDocument.load(invoicePdfBytes);
      
      // Generate and append prescription PDFs for each item with valid prescription values
      for (const item of prescriptionItems) {
        console.log(`[Invoice API] Processing prescription for: ${item.productName}`);
        const prescriptionPdfData = await extractPrescriptionFromOrderItem(
          {
            productName: item.productName,
            prescriptionData: item.prescriptionData,
          },
          order.orderNumber,
          order.createdAt,
          order.User?.name || order.shippingName,
          order.User?.email || 'customer@example.com'
        );
        
        if (prescriptionPdfData) {
          console.log(`[Invoice API] Generating prescription PDF for: ${item.productName}`);
          const prescriptionPdfBuffer = await generatePrescriptionPDF(prescriptionPdfData);
          const prescriptionPdf = await PDFDocument.load(prescriptionPdfBuffer);
          const pages = await mergedPdf.copyPages(prescriptionPdf, prescriptionPdf.getPageIndices());
          pages.forEach(page => mergedPdf.addPage(page));
        }
      }
      
      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      console.log(`[Invoice API] Merged PDF generated successfully, size: ${mergedPdfBytes.length} bytes`);

      // Return the merged PDF as response
      return new NextResponse(mergedPdfBytes, {
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
