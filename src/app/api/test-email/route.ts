import { NextResponse } from "next/server";
import { Resend } from "resend";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Check authentication (admin only for security)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Collect environment configuration
    const config = {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? "SET (" + process.env.RESEND_API_KEY.substring(0, 8) + "...)" : "NOT SET",
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "NOT SET (defaults to onboarding@resend.dev)",
      RESEND_VERIFIED_EMAIL: process.env.RESEND_VERIFIED_EMAIL || "NOT SET",
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? "SET" : "NOT SET",
    };

    console.log("[Test Email] Configuration:", config);

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: false,
        message: "RESEND_API_KEY is not configured",
        config,
        action: "Add RESEND_API_KEY to your .env file",
      });
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const isUsingTestMode = fromEmail === "onboarding@resend.dev";

    // If using test mode, check for verified email
    if (isUsingTestMode && !process.env.RESEND_VERIFIED_EMAIL) {
      return NextResponse.json({
        success: false,
        message: "Using test mode but RESEND_VERIFIED_EMAIL is not set",
        config,
        action: "Set RESEND_VERIFIED_EMAIL to your verified email address in .env, OR set RESEND_FROM_EMAIL to your verified domain email (e.g., orders@yourdomain.com)",
      });
    }

    // Check if using verified domain
    if (!isUsingTestMode) {
      console.log(`[Test Email] Using verified domain: ${fromEmail}`);
    }

    // Try to send a test email
    const resend = new Resend(process.env.RESEND_API_KEY);
    const recipientEmail = isUsingTestMode 
      ? process.env.RESEND_VERIFIED_EMAIL! 
      : session.user.email || process.env.RESEND_VERIFIED_EMAIL;

    if (!recipientEmail) {
      return NextResponse.json({
        success: false,
        message: "No recipient email available",
        config,
        action: "Either log in with a valid email or set RESEND_VERIFIED_EMAIL",
      });
    }

    console.log(`[Test Email] Sending test email from ${fromEmail} to ${recipientEmail}`);

    const { data, error } = await resend.emails.send({
      from: `FocusRobin <${fromEmail}>`,
      to: recipientEmail,
      subject: "FocusRobin Email Test - Configuration Working!",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #2A9D9A;">✅ Email Configuration Working!</h1>
          <p>This is a test email from your FocusRobin store.</p>
          <h3>Configuration:</h3>
          <ul>
            <li><strong>From Email:</strong> ${fromEmail}</li>
            <li><strong>To Email:</strong> ${recipientEmail}</li>
            <li><strong>Test Mode:</strong> ${isUsingTestMode ? "Yes (using onboarding@resend.dev)" : "No (using verified domain)"}</li>
          </ul>
          <p style="color: #666;">If you received this email, your order confirmation emails should work correctly!</p>
          <p style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 5px;">
            <strong>Next Steps:</strong><br>
            1. Place a test order<br>
            2. Complete the payment<br>
            3. Check your email for the order confirmation
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[Test Email] Failed to send:", error);
      return NextResponse.json({
        success: false,
        message: `Failed to send test email: ${error.message}`,
        config,
        error: error,
        action: isUsingTestMode 
          ? "Make sure RESEND_VERIFIED_EMAIL is an email verified in your Resend account" 
          : "Make sure your domain is verified in Resend and the from email is valid",
      });
    }

    console.log("[Test Email] Test email sent successfully:", data);

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${recipientEmail}!`,
      config,
      emailId: data?.id,
      recipientEmail,
      fromEmail,
      isTestMode: isUsingTestMode,
      action: "Check your inbox (and spam folder) for the test email. If you receive it, order emails should work correctly.",
    });

  } catch (error: any) {
    console.error("[Test Email] Error:", error);
    return NextResponse.json({
      success: false,
      message: `Error: ${error.message}`,
      error: error.toString(),
    }, { status: 500 });
  }
}
