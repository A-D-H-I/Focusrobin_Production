"use server";

import { Resend } from "resend";

// Initialize Resend client
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[OTP Email] ❌ RESEND_API_KEY is not configured");
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Send OTP email to user for email verification
 */
export async function sendOTPEmail(
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resendClient = getResendClient();
    if (!resendClient) {
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    // Generate HTML email content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #0d9488; margin-top: 0; font-size: 28px; text-align: center;">Verify Your Email</h1>
    
    <p style="font-size: 16px; color: #666; margin-bottom: 24px; text-align: center;">
      Thank you for signing up with FocusRobin! Please verify your email address by entering the OTP code below.
    </p>
    
    <div style="text-align: center; margin: 32px 0; padding: 24px; background-color: #f0fdfa; border-radius: 8px; border: 2px dashed #0d9488;">
      <p style="font-size: 14px; color: #666; margin: 0 0 12px 0; font-weight: 600;">Your verification code:</p>
      <div style="font-size: 36px; font-weight: bold; color: #0d9488; letter-spacing: 8px; font-family: 'Courier New', monospace;">
        ${otp}
      </div>
    </div>
    
    <p style="font-size: 14px; color: #999; margin-top: 32px; margin-bottom: 0; text-align: center;">
      This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
    
    <p style="font-size: 12px; color: #999; margin: 0;">
      This is an automated email from FocusRobin. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
    `.trim();

    // Send email
    const { data, error } = await resendClient.emails.send({
      from: `FocusRobin <${fromEmail}>`,
      to: email,
      subject: "Verify Your Email - FocusRobin",
      html: htmlContent,
    });

    if (error) {
      console.error("[OTP Email] ❌ Failed to send email:", error);
      return { success: false, error: error.message || "Failed to send email" };
    }

    console.log("[OTP Email] ✅ OTP email sent to:", email);
    return { success: true };
  } catch (error: any) {
    console.error("[OTP Email] ❌ Exception sending OTP email:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

