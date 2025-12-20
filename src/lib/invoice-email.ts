"use server";

import { Resend } from "resend";
import { InvoiceData } from "./invoice";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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

// Get the verified email for testing (when using onboarding@resend.dev)
function getRecipientEmail(customerEmail: string): string {
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  
  // When using the Resend test domain, emails can only be sent to verified addresses
  // In production with a custom domain, send to the actual customer
  if (fromEmail === "onboarding@resend.dev") {
    const verifiedEmail = process.env.RESEND_VERIFIED_EMAIL;
    if (verifiedEmail) {
      console.log(`[Invoice Email] Using test mode - sending to verified email: ${verifiedEmail} (instead of ${customerEmail})`);
      return verifiedEmail;
    }
    console.warn(`[Invoice Email] Using onboarding@resend.dev but no RESEND_VERIFIED_EMAIL set. Email will likely fail.`);
  }
  
  return customerEmail;
}

/**
 * Generate combined PDF with Payment Receipt + Invoice
 * This is the same PDF that admins can download from the admin panel
 */
async function generateCombinedPDF(invoiceData: InvoiceData): Promise<Buffer> {
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
  
  // ==================== PAGE 1: Payment Receipt ====================
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
  
  page1.drawText('Payment Receipt', {
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
  page1.drawText('This is a payment receipt document.', {
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
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Send order confirmation email with Payment Receipt and Invoice
 * This sends a single email with both documents combined in one PDF
 */
export async function sendOrderConfirmationWithDocuments(
  invoiceData: InvoiceData
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
    const pdfBuffer = await generateCombinedPDF(invoiceData);
    console.log(`[Invoice Email] Combined PDF generated successfully (${pdfBuffer.length} bytes)`);
    
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
                    <div style="font-size: 14px; color: #666;">${item.variant}</div>
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
          content: pdfBase64,
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

