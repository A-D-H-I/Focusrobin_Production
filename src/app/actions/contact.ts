"use server";

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

// Initialize Resend client only if API key is available
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

const getSubjectLabel = (subject: string): string => {
  const subjects: Record<string, string> = {
    "order-support": "Order Support",
    "product-inquiry": "Product Inquiry",
    "returns": "Returns",
    "other": "Other",
  };
  return subjects[subject] || subject;
};

export async function sendContactEmail(formData: ContactFormData) {
  try {
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.subject || !formData.message) {
      return { error: "All required fields must be filled" };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return { error: "Invalid email address" };
    }

    // Check if Resend API key is configured
    const resendClient = getResendClient();
    if (!resendClient) {
      console.error("RESEND_API_KEY is not configured");
      return { error: "Email service is not configured. Please contact support directly." };
    }

    // For Resend free tier: can only send to verified email unless domain is verified
    // Priority: TEST_EMAIL (if verified) > CONTACT_EMAIL (if domain verified) > verified email
    const verifiedEmail = process.env.RESEND_VERIFIED_EMAIL || "focusrobin25@gmail.com";
    const testEmail = process.env.TEST_EMAIL; // For testing
    const requestedEmail = process.env.CONTACT_EMAIL || "support@focusrobin.com";
    
    // Determine recipient email
    // If domain is verified, use requested email, otherwise use verified email
    // Note: Resend free tier only allows sending to verified email address
    let toEmail: string;
    if (process.env.RESEND_DOMAIN_VERIFIED === "true") {
      // Domain verified - can use any email
      toEmail = testEmail || requestedEmail;
    } else {
      // Domain not verified - must use verified email (Resend free tier limitation)
      toEmail = verifiedEmail;
      if (testEmail && testEmail !== verifiedEmail) {
        console.warn(`TEST_EMAIL (${testEmail}) is not verified. Using verified email (${verifiedEmail}) instead.`);
      }
    }
    
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    // Save submission to database
    try {
      await prisma.contactSubmission.create({
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          subject: formData.subject,
          message: formData.message,
        },
      });
    } catch (dbError) {
      console.error("Error saving contact submission to database:", dbError);
      // Continue with email sending even if database save fails
    }

    // Debug logging
    console.log("Email configuration:", {
      fromEmail,
      toEmail,
      apiKeyExists: !!process.env.RESEND_API_KEY,
      apiKeyLength: process.env.RESEND_API_KEY?.length || 0,
      apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 3) || "N/A",
    });

    // Send email to admin
    const emailData = {
      from: `FocusRobin Contact Form <${fromEmail}>`,
      to: [toEmail],
      replyTo: formData.email,
      subject: `New Contact Form Submission: ${getSubjectLabel(formData.subject)}`,
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
              .field {
                margin-bottom: 20px;
              }
              .label {
                font-weight: bold;
                color: #2A9D9A;
                display: block;
                margin-bottom: 5px;
              }
              .value {
                background: white;
                padding: 12px;
                border-radius: 4px;
                border-left: 3px solid #4DCECA;
              }
              .message-box {
                background: white;
                padding: 15px;
                border-radius: 4px;
                border-left: 3px solid #4DCECA;
                white-space: pre-wrap;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0;">New Contact Form Submission</h1>
            </div>
            <div class="content">
              <div class="field">
                <span class="label">Name:</span>
                <div class="value">${formData.firstName} ${formData.lastName}</div>
              </div>
              
              <div class="field">
                <span class="label">Email:</span>
                <div class="value">${formData.email}</div>
              </div>
              
              ${formData.phone ? `
              <div class="field">
                <span class="label">Phone:</span>
                <div class="value">${formData.phone}</div>
              </div>
              ` : ''}
              
              <div class="field">
                <span class="label">Subject:</span>
                <div class="value">${getSubjectLabel(formData.subject)}</div>
              </div>
              
              <div class="field">
                <span class="label">Message:</span>
                <div class="message-box">${formData.message.replace(/\n/g, '<br>')}</div>
              </div>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="color: #666; font-size: 14px;">
                You can reply directly to this email to respond to ${formData.firstName}.
              </p>
            </div>
          </body>
        </html>
      `,
    };

    console.log("Attempting to send email:", {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      hasApiKey: !!process.env.RESEND_API_KEY,
    });

    const { data, error } = await resendClient.emails.send(emailData);

    if (error) {
      console.error("Resend API error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      // Provide more specific error messages
      if (error.message?.includes("Invalid API key") || error.message?.includes("Unauthorized")) {
        return { error: "Email service configuration error. Please contact support directly." };
      }
      
      // Handle Resend free tier limitation
      if (error.message?.includes("can only send testing emails") || error.message?.includes("verify a domain")) {
        console.warn("Resend domain not verified. Attempting to use verified email address.");
        // Try again with verified email
        const verifiedEmail = process.env.RESEND_VERIFIED_EMAIL || "focusrobin25@gmail.com";
        
        // Only retry if we weren't already using the verified email
        if (toEmail === verifiedEmail) {
          return { 
            error: "Email service configuration issue. Please verify your domain in Resend or contact support directly." 
          };
        }
        
        const retryData = {
          ...emailData,
          to: [verifiedEmail],
        };
        
        const retryResult = await resendClient.emails.send(retryData);
        if (retryResult.error) {
          return { 
            error: "Email service configuration issue. Please verify your domain in Resend or contact support directly." 
          };
        }
        // Success with verified email - log warning but return success
        console.log("Email sent to verified address:", verifiedEmail);
        return { 
          success: true, 
          messageId: retryResult.data?.id
        };
      }
      
      if (error.message?.includes("domain") || error.message?.includes("not verified")) {
        return { error: "Email domain not verified. Please contact support directly." };
      }
      
      return { 
        error: `Failed to send email: ${error.message || "Unknown error"}. Please try again or contact support directly.` 
      };
    }

    console.log("Email sent successfully:", data);

    // Optionally send a confirmation email to the user
    if (process.env.SEND_CONFIRMATION_EMAIL === "true" && resendClient) {
      await resendClient.emails.send({
        from: `FocusRobin <${fromEmail}>`,
        to: [formData.email],
        subject: "Thank you for contacting FocusRobin",
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
              </style>
            </head>
            <body>
              <div class="header">
                <h1 style="margin: 0;">Thank You for Contacting Us!</h1>
              </div>
              <div class="content">
                <p>Hi ${formData.firstName},</p>
                <p>We've received your message and will get back to you as soon as possible.</p>
                <p>In the meantime, feel free to browse our collection or reach out via:</p>
                <ul>
                  <li>Email: support@focusrobin.com</li>
                  <li>Phone: +370 609 66069</li>
                  <li>Live Chat: Available on our website</li>
                </ul>
                <p>Best regards,<br>The FocusRobin Team</p>
              </div>
            </body>
          </html>
        `,
      });
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Error sending contact email:", error);
    return { error: "Failed to send email. Please try again later." };
  }
}

