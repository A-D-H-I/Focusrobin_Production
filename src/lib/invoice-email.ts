"use server";

import { Resend } from "resend";
import { InvoiceData } from "./invoice";

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
 * Send payment confirmation email to customer
 */
export async function sendPaymentConfirmationEmail(
  invoiceData: InvoiceData,
  pdfBuffer: Buffer
): Promise<{ success: boolean; error?: string }> {
  const resendClient = getResendClient();
  if (!resendClient) {
    console.error("Resend API key not configured");
    return { success: false, error: "Email service not configured" };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const recipientEmail = getRecipientEmail(invoiceData.customerEmail);

  console.log(`[Invoice Email] Sending payment confirmation to: ${recipientEmail}`);
  console.log(`[Invoice Email] From: ${fromEmail}`);

  try {
    const { data, error } = await resendClient.emails.send({
      from: `FocusRobin <${fromEmail}>`,
      to: [recipientEmail],
      subject: `Payment Confirmation - Order ${invoiceData.orderNumber}`,
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
              <h1 style="margin: 0;">Payment Successful!</h1>
            </div>
            <div class="content">
              <p>Dear ${invoiceData.customerName},</p>
              
              <div class="success-badge">✓ Payment Confirmed</div>
              
              <p>Thank you for your purchase! Your payment has been successfully processed.</p>
              
              <div class="order-details">
                <h3 style="margin-top: 0; color: #2A9D9A;">Order Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Order Number:</span>
                  <span>${invoiceData.orderNumber}</span>
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
                  <span class="detail-label">Total Amount:</span>
                  <span style="font-weight: bold; color: #2A9D9A;">${invoiceData.currency} ${invoiceData.total.toFixed(2)}</span>
                </div>
              </div>
              
              <p>Your order is being processed and will be shipped to:</p>
              <p style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #4DCECA;">
                ${invoiceData.shippingAddress.name}<br>
                ${invoiceData.shippingAddress.addressLine1}<br>
                ${invoiceData.shippingAddress.addressLine2 ? invoiceData.shippingAddress.addressLine2 + '<br>' : ''}
                ${invoiceData.shippingAddress.city}, ${invoiceData.shippingAddress.postalCode}<br>
                ${invoiceData.shippingAddress.country}
              </p>
              
              <p>You will receive a separate email with your invoice shortly.</p>
              
              <p>If you have any questions, please don't hesitate to contact us.</p>
              
              <p>Best regards,<br>The FocusRobin Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Error sending payment confirmation email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error sending payment confirmation email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send invoice email to customer
 */
export async function sendInvoiceEmail(
  invoiceData: InvoiceData,
  pdfBuffer: Buffer
): Promise<{ success: boolean; error?: string }> {
  const resendClient = getResendClient();
  if (!resendClient) {
    console.error("[Invoice Email] Resend API key not configured");
    return { success: false, error: "Email service not configured" };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const recipientEmail = getRecipientEmail(invoiceData.customerEmail);

  console.log(`[Invoice Email] Sending invoice to: ${recipientEmail}`);
  console.log(`[Invoice Email] From: ${fromEmail}`);

  try {
    // Convert buffer to base64 for email attachment
    const pdfBase64 = pdfBuffer.toString('base64');

    const { data, error } = await resendClient.emails.send({
      from: `FocusRobin <${fromEmail}>`,
      to: [recipientEmail],
      subject: `Invoice - Order ${invoiceData.orderNumber}`,
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
              .invoice-summary {
                background: white;
                padding: 20px;
                border-radius: 5px;
                margin: 20px 0;
                border-left: 4px solid #4DCECA;
              }
              .summary-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
              }
              .summary-total {
                font-size: 18px;
                font-weight: bold;
                color: #2A9D9A;
                border-top: 2px solid #2A9D9A;
                padding-top: 10px;
                margin-top: 10px;
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
              <h1 style="margin: 0;">Your Invoice</h1>
            </div>
            <div class="content">
              <p>Dear ${invoiceData.customerName},</p>
              
              <p>Please find attached your invoice for order <strong>${invoiceData.orderNumber}</strong>.</p>
              
              <div class="invoice-summary">
                <h3 style="margin-top: 0; color: #2A9D9A;">Invoice Summary</h3>
                <div class="summary-row">
                  <span>Subtotal:</span>
                  <span>${invoiceData.currency} ${invoiceData.subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                  <span>Shipping:</span>
                  <span>${invoiceData.currency} ${invoiceData.shipping.toFixed(2)}</span>
                </div>
                <div class="summary-row summary-total">
                  <span>Total:</span>
                  <span>${invoiceData.currency} ${invoiceData.total.toFixed(2)}</span>
                </div>
              </div>
              
              <p>The detailed invoice is attached as a PDF file.</p>
              
              <p>Thank you for your purchase!</p>
              
              <p>Best regards,<br>The FocusRobin Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </body>
        </html>
      `,
      attachments: [
        {
          filename: `Invoice-${invoiceData.orderNumber}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    if (error) {
      console.error("Error sending invoice email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error sending invoice email:", error);
    return { success: false, error: error.message };
  }
}

