"use server";

import { Resend } from "resend";
import { InvoiceData } from "./invoice";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generatePrescriptionPDF, PrescriptionPDFData } from './prescription-pdf';
import { readFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

// Initialize Resend client
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.error("[Invoice Email] RESEND_API_KEY is not configured");
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// Get the recipient email - always send to actual customer
function getRecipientEmail(customerEmail: string): string {
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  
  // Always send to the actual customer email
  console.log(`[Invoice Email] Sending to customer: ${customerEmail}`);
  return customerEmail;
}

/**
 * Generate invoice PDF matching the new template design
 * Single page invoice with dark blue/yellow theme, no discounts shown
 */
async function generateCombinedPDF(invoiceData: InvoiceData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Colors matching the template
  const darkBlue = rgb(0.1, 0.2, 0.4); // Dark blue for header
  const yellow = rgb(1.0, 0.84, 0.0); // Yellow for table header and total bar
  const blackColor = rgb(0, 0, 0);
  const whiteColor = rgb(1.0, 1.0, 1.0);
  const lightGray = rgb(0.9, 0.9, 0.9); // For alternating rows
  const grayColor = rgb(0.5, 0.5, 0.5);
  
  // Create single page
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();
  
  // Logo area - load and embed actual FocusRobin logo (no background)
  const logoX = 30;
  const logoY = height - 50;
  
  try {
    // Load the SVG logo and convert to PNG (keep original colors)
    const logoPath = join(process.cwd(), 'public', 'logo', 'Horizontal Primary dark (Color).svg');
    const svgBuffer = readFileSync(logoPath);
    
    // Convert SVG to PNG (keep original colors, no greyscale or tint)
    const pngBuffer = await sharp(svgBuffer)
      .resize(280, null, { fit: 'contain' }) // Larger size for bigger logo
      .png()
      .toBuffer();
    
    // Embed the logo image in the PDF
    const logoImage = await pdfDoc.embedPng(pngBuffer);
    const logoDims = logoImage.scale(0.75); // Larger scale for bigger logo
    
    // Draw the logo (original colors, no background)
    page.drawImage(logoImage, {
      x: logoX,
      y: logoY - 20,
      width: logoDims.width,
      height: logoDims.height,
    });
  } catch (error) {
    console.warn('[Invoice Email] Could not load logo, using text fallback:', error);
    // Fallback to text if logo loading fails
    page.drawText('FOCUSROBIN', {
      x: logoX + 10,
      y: logoY - 5,
      size: 18,
      font: helveticaBold,
      color: blackColor,
    });
  }
  
  // INVOICE text on top right
  page.drawText('INVOICE', {
    x: 400,
    y: height - 50,
    size: 36,
    font: helveticaBold,
    color: blackColor,
  });
  
  // Invoice Details Section (left side)
  let yPos = height - 150;
  const invoiceDateStr = invoiceData.orderDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  page.drawText('INVOICE #', {
    x: 50,
    y: yPos,
    size: 11,
    font: helveticaBold,
    color: blackColor,
  });
  page.drawText(invoiceData.orderNumber, {
    x: 150,
    y: yPos,
    size: 11,
    font: helvetica,
    color: blackColor,
  });
  
  yPos -= 20;
  page.drawText('INVOICE DATE :', {
    x: 50,
    y: yPos,
    size: 11,
    font: helvetica,
    color: blackColor,
  });
  page.drawText(invoiceDateStr, {
    x: 180,
    y: yPos,
    size: 11,
    font: helvetica,
    color: blackColor,
  });
  
  // BILL TO section (right side)
  let billToY = height - 150;
  page.drawText('BILL TO', {
    x: 400,
    y: billToY,
    size: 12,
    font: helveticaBold,
    color: blackColor,
  });
  
  billToY -= 20;
  const billingAddress = [
    invoiceData.customerName,
    invoiceData.shippingAddress.addressLine1,
    invoiceData.shippingAddress.addressLine2,
    `${invoiceData.shippingAddress.city}, ${invoiceData.shippingAddress.postalCode}`,
    invoiceData.shippingAddress.state,
    invoiceData.shippingAddress.country,
  ].filter(Boolean);
  
  billingAddress.forEach((line) => {
    page.drawText(line, {
      x: 400,
      y: billToY,
      size: 10,
      font: helvetica,
      color: blackColor,
    });
    billToY -= 15;
  });
  
  // Table Header: Yellow bar
  yPos = height - 320;
  const tableHeaderY = yPos;
  const tableHeaderHeight = 30;
  
  page.drawRectangle({
    x: 50,
    y: tableHeaderY - tableHeaderHeight,
    width: width - 100,
    height: tableHeaderHeight,
    color: yellow,
  });
  
  // Table column headers
  const headerTextY = tableHeaderY - 20;
  page.drawText('NO', {
    x: 60,
    y: headerTextY,
    size: 11,
    font: helveticaBold,
    color: blackColor,
  });
  page.drawText('DESCRIPTION', {
    x: 120,
    y: headerTextY,
    size: 11,
    font: helveticaBold,
    color: blackColor,
  });
  page.drawText('PRICE', {
    x: 350,
    y: headerTextY,
    size: 11,
    font: helveticaBold,
    color: blackColor,
  });
  page.drawText('QTY', {
    x: 420,
    y: headerTextY,
    size: 11,
    font: helveticaBold,
    color: blackColor,
  });
  page.drawText('TOTAL', {
    x: 480,
    y: headerTextY,
    size: 11,
    font: helveticaBold,
    color: blackColor,
  });
  
  // Items rows with alternating colors
  yPos = tableHeaderY - tableHeaderHeight - 25;
  invoiceData.items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    const rowColor = isEven ? lightGray : whiteColor;
    const rowHeight = 25;
    
    // Draw row background
    page.drawRectangle({
      x: 50,
      y: yPos - rowHeight,
      width: width - 100,
      height: rowHeight,
      color: rowColor,
    });
    
    // Item number
    page.drawText((index + 1).toString(), {
      x: 60,
      y: yPos - 18,
      size: 10,
      font: helvetica,
      color: blackColor,
    });
    
    // Description with color and SKU (truncate if too long)
    const colorText = item.variant ? ` - ${item.variant}` : '';
    const skuText = item.sku ? ` (${item.sku})` : '';
    const fullDescription = `${item.name}${colorText}${skuText}`;
    const description = fullDescription.length > 40 ? fullDescription.substring(0, 40) + '...' : fullDescription;
    page.drawText(description, {
      x: 120,
      y: yPos - 18,
      size: 10,
      font: helvetica,
      color: blackColor,
    });
    
    // Price
    page.drawText(`${invoiceData.currency} ${item.price.toFixed(2)}`, {
      x: 350,
      y: yPos - 18,
      size: 10,
      font: helvetica,
      color: blackColor,
    });
    
    // Quantity
    page.drawText(item.quantity.toString(), {
      x: 420,
      y: yPos - 18,
      size: 10,
      font: helvetica,
      color: blackColor,
    });
    
    // Total
    page.drawText(`${invoiceData.currency} ${item.total.toFixed(2)}`, {
      x: 480,
      y: yPos - 18,
      size: 10,
      font: helvetica,
      color: blackColor,
    });
    
    yPos -= rowHeight;
  });
  
  // Totals Section
  yPos -= 30;
  
  // Calculate original subtotal (before discounts)
  const originalSubtotal = invoiceData.subtotal + invoiceData.shipping;
  const totalDiscount = invoiceData.discount + invoiceData.walletAmount;
  const finalTotal = invoiceData.total;
  
  // SUB-TOTAL - Always show the original subtotal
  page.drawText('SUB-TOTAL', {
    x: 400,
    y: yPos,
    size: 11,
    font: helvetica,
    color: blackColor,
  });
  page.drawText(`${invoiceData.currency} ${originalSubtotal.toFixed(2)}`, {
    x: 480,
    y: yPos,
    size: 11,
    font: helvetica,
    color: blackColor,
  });
  
  // DISCOUNT - Show discount amount if there's any discount
  if (totalDiscount > 0) {
    yPos -= 25; // Add spacing between subtotal and discount
    page.drawText('DISCOUNT', {
      x: 400,
      y: yPos,
      size: 11,
      font: helvetica,
      color: blackColor,
    });
    page.drawText(`-${invoiceData.currency} ${totalDiscount.toFixed(2)}`, {
      x: 480,
      y: yPos,
      size: 11,
      font: helvetica,
      color: blackColor,
    });
  }
  
  // Total Due bar (yellow)
  yPos -= 30;
  const totalBarHeight = 35;
  page.drawRectangle({
    x: 400,
    y: yPos - totalBarHeight,
    width: 145,
    height: totalBarHeight,
    color: yellow,
  });
  
  page.drawText('Total', {
    x: 410,
    y: yPos - 22,
    size: 12,
    font: helveticaBold,
    color: blackColor,
  });
  page.drawText(`${invoiceData.currency} ${finalTotal.toFixed(2)}`, {
    x: 480,
    y: yPos - 22,
    size: 12,
    font: helveticaBold,
    color: blackColor,
  });
  
  // Payment Method Section (left side, below items)
  yPos = yPos - totalBarHeight - 40;
  page.drawText('PAYMENT METHOD', {
    x: 50,
    y: yPos,
    size: 11,
    font: helveticaBold,
    color: blackColor,
  });
  
  yPos -= 20;
  page.drawText(invoiceData.paymentMethod || 'Online Payment', {
    x: 50,
    y: yPos,
    size: 10,
    font: helvetica,
    color: blackColor,
  });
  
  // Footer: THANK YOU FOR YOUR PURCHASE
  page.drawText('THANK YOU FOR YOUR PURCHASE', {
    x: width / 2 - 120,
    y: 50,
    size: 14,
    font: helveticaBold,
    color: blackColor,
  });
  
  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Send order confirmation email with Payment Receipt, Invoice, and Prescription PDFs
 * This sends a single email with all documents combined in one PDF
 */
export async function sendOrderConfirmationWithDocuments(
  invoiceData: InvoiceData,
  prescriptionDataList?: PrescriptionPDFData[]
): Promise<{ success: boolean; error?: string }> {
  const resendClient = getResendClient();
  if (!resendClient) {
    console.error("[Invoice Email] Resend API key not configured");
    return { success: false, error: "Email service not configured" };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const recipientEmail = getRecipientEmail(invoiceData.customerEmail);

  console.log(`[Invoice Email] Generating combined PDF (Payment Receipt + Invoice)...`);
  
  try {
    // Generate the combined PDF (Payment Receipt + Invoice)
    let pdfBuffer = await generateCombinedPDF(invoiceData);
    console.log(`[Invoice Email] Combined PDF generated successfully (${pdfBuffer.length} bytes)`);
    
    // If there are prescription items, generate and append prescription PDFs
    if (prescriptionDataList && prescriptionDataList.length > 0) {
      console.log(`[Invoice Email] Found ${prescriptionDataList.length} prescription items, generating prescription PDFs...`);
      
      // Load the combined PDF
      const mergedPdf = await PDFDocument.load(pdfBuffer);
      
      // Generate and append prescription PDFs
      for (const prescriptionData of prescriptionDataList) {
        console.log(`[Invoice Email] Generating prescription PDF for: ${prescriptionData.productName}`);
        const prescriptionPdfBuffer = await generatePrescriptionPDF(prescriptionData);
        const prescriptionPdf = await PDFDocument.load(prescriptionPdfBuffer);
        const pages = await mergedPdf.copyPages(prescriptionPdf, prescriptionPdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }
      
      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      pdfBuffer = Buffer.from(mergedPdfBytes);
      console.log(`[Invoice Email] Merged PDF with prescriptions generated (${pdfBuffer.length} bytes)`);
    }
    
    // Convert buffer to base64 for email attachment
    const pdfBase64 = pdfBuffer.toString('base64');

    console.log(`[Invoice Email] Sending order confirmation with documents to: ${recipientEmail}`);
    console.log(`[Invoice Email] From: ${fromEmail}`);

    const { data, error } = await resendClient.emails.send({
      from: `FocusRobin <${fromEmail}>`,
      to: [recipientEmail],
      subject: `Order Confirmation & Documents - ${invoiceData.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #4DCECA 0%, #2A9D9A 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 8px 8px;
              }
              .success-badge {
                background: #4CAF50;
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                display: inline-block;
                margin: 20px 0;
                font-weight: bold;
              }
              .order-details {
                background: white;
                padding: 20px;
                border-radius: 5px;
                margin: 20px 0;
                border-left: 4px solid #4DCECA;
              }
              .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
              }
              .detail-row:last-child {
                border-bottom: none;
              }
              .detail-label {
                font-weight: bold;
                color: #666;
              }
              .document-notice {
                background: #e3f2fd;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                border-left: 4px solid #2196F3;
              }
              .items-list {
                background: white;
                padding: 20px;
                border-radius: 5px;
                margin: 20px 0;
              }
              .item {
                padding: 10px 0;
                border-bottom: 1px solid #eee;
              }
              .item:last-child {
                border-bottom: none;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                color: #666;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0;">🎉 Order Confirmed!</h1>
            </div>
            <div class="content">
              <p>Dear ${invoiceData.customerName},</p>
              
              <div class="success-badge">✓ Payment Successful</div>
              
              <p>Thank you for your purchase! Your payment has been successfully processed and your order is confirmed.</p>
              
              <div class="order-details">
                <h3 style="margin-top: 0; color: #2A9D9A;">Order Summary</h3>
                <div class="detail-row">
                  <span class="detail-label">Order Number:</span>
                  <span><strong>${invoiceData.orderNumber}</strong></span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Order Date:</span>
                  <span>${invoiceData.orderDate.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Total Amount Paid:</span>
                  <span style="font-weight: bold; color: #2A9D9A; font-size: 18px;">${invoiceData.currency} ${invoiceData.total.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Payment Method:</span>
                  <span>Stripe</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Payment Status:</span>
                  <span style="color: #4CAF50; font-weight: bold;">✓ Completed</span>
                </div>
              </div>
              
              <div class="document-notice">
                <strong>📄 Important Documents Attached:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li><strong>Payment Receipt</strong> - Confirmation of your payment</li>
                  <li><strong>Invoice</strong> - Detailed breakdown of your order</li>
                </ul>
                <p style="margin: 10px 0 0 0; font-size: 14px;">Both documents are included in the attached PDF file.</p>
              </div>
              
              <div class="items-list">
                <h3 style="margin-top: 0; color: #2A9D9A;">Order Items</h3>
                ${invoiceData.items.map(item => `
                  <div class="item">
                    <div style="font-weight: bold;">${item.name}</div>
                    <div style="font-size: 14px; color: #666;">${item.variant} • SKU: ${item.sku}</div>
                    ${item.hasPrescription ? '<div style="font-size: 12px; color: #2A9D9A; font-weight: bold;">📋 Includes Prescription Lenses</div>' : ''}
                    <div style="font-size: 14px; margin-top: 5px;">
                      Quantity: ${item.quantity} × ${invoiceData.currency} ${item.price.toFixed(2)} = 
                      <strong>${invoiceData.currency} ${item.total.toFixed(2)}</strong>
                    </div>
                  </div>
                `).join('')}
                <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #2A9D9A;">
                  <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                    <span>Subtotal:</span>
                    <span>${invoiceData.currency} ${invoiceData.subtotal.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                    <span>Shipping:</span>
                    <span>${invoiceData.currency} ${invoiceData.shipping.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin: 10px 0 0 0; font-size: 18px; font-weight: bold; color: #2A9D9A;">
                    <span>Total:</span>
                    <span>${invoiceData.currency} ${invoiceData.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div class="order-details">
                <h3 style="margin-top: 0; color: #2A9D9A;">📦 Shipping Address</h3>
                <p style="margin: 0; line-height: 1.8;">
                  <strong>${invoiceData.shippingAddress.name}</strong><br>
                  ${invoiceData.shippingAddress.addressLine1}<br>
                  ${invoiceData.shippingAddress.addressLine2 ? invoiceData.shippingAddress.addressLine2 + '<br>' : ''}
                  ${invoiceData.shippingAddress.city}, ${invoiceData.shippingAddress.postalCode}<br>
                  ${invoiceData.shippingAddress.state ? invoiceData.shippingAddress.state + '<br>' : ''}
                  ${invoiceData.shippingAddress.country}
                </p>
              </div>
              
              <p style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
                <strong>What's Next?</strong><br>
                Your order is being processed and will be shipped soon. You'll receive another email with tracking information once your order has been dispatched.
              </p>
              
              <p>If you have any questions or concerns about your order, please don't hesitate to contact our support team.</p>
              
              <p>Thank you for choosing FocusRobin!</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>The FocusRobin Team</strong>
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p style="margin-top: 10px;">Keep this email and the attached documents for your records.</p>
            </div>
          </body>
        </html>
      `,
      attachments: [
        {
          filename: `FocusRobin-Order-${invoiceData.orderNumber}-Documents.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("[Invoice Email] Error sending order confirmation email:", error);
      return { success: false, error: error.message };
    }

    console.log(`[Invoice Email] ✓ Order confirmation email sent successfully`);
    return { success: true };
  } catch (error: any) {
    console.error("[Invoice Email] Error sending order confirmation email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use sendOrderConfirmationWithDocuments instead
 */
export async function sendPaymentConfirmationEmail(
  invoiceData: InvoiceData,
  pdfBuffer: Buffer
): Promise<{ success: boolean; error?: string }> {
  console.warn("[Invoice Email] sendPaymentConfirmationEmail is deprecated. Use sendOrderConfirmationWithDocuments instead.");
  return sendOrderConfirmationWithDocuments(invoiceData);
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use sendOrderConfirmationWithDocuments instead
 */
export async function sendInvoiceEmail(
  invoiceData: InvoiceData,
  pdfBuffer: Buffer
): Promise<{ success: boolean; error?: string }> {
  console.warn("[Invoice Email] sendInvoiceEmail is deprecated. Use sendOrderConfirmationWithDocuments instead.");
  return sendOrderConfirmationWithDocuments(invoiceData);
}

