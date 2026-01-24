"use server";

import { Resend } from "resend";

// Initialize Resend client
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[Password Reset Email] ❌ RESEND_API_KEY is not configured");
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Send password reset email to user
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resendClient = getResendClient();
    if (!resendClient) {
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:9002";
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    // Generate HTML email content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #0d9488; margin-top: 0; font-size: 28px; text-align: center;">Reset Your Password</h1>
    
    <p style="font-size: 16px; color: #666; margin-bottom: 24px;">
      We received a request to reset your password for your FocusRobin account. If you didn't make this request, you can safely ignore this email.
    </p>
    
    <p style="font-size: 16px; color: #666; margin-bottom: 32px;">
      Click the button below to reset your password. This link will expire in 1 hour.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" 
         style="display: inline-block; background-color: #0d9488; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">
        Reset Password
      </a>
    </div>
    
    <p style="font-size: 14px; color: #999; margin-top: 32px; margin-bottom: 0;">
      If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p style="font-size: 12px; color: #666; word-break: break-all; background-color: #f9f9f9; padding: 12px; border-radius: 4px; margin-top: 8px;">
      ${resetUrl}
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
      subject: "Reset Your Password - FocusRobin",
      html: htmlContent,
    });

    if (error) {
      console.error("[Password Reset Email] ❌ Failed to send email:", error);
      return { success: false, error: error.message || "Failed to send email" };
    }

    console.log("[Password Reset Email] ✅ Password reset email sent to:", email);
    return { success: true };
  } catch (error: any) {
    console.error("[Password Reset Email] ❌ Exception sending password reset email:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

