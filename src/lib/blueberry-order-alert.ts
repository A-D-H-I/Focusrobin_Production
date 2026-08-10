import { Resend } from "resend";

let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

/**
 * Alerts an admin when automatic Blueberry order placement fails.
 * The customer's order/payment is never touched by this — this is
 * purely an operational notification so a human can fulfill manually.
 * Must never throw: it's called from inside a catch block and an
 * alert-sending failure must not mask the original placement failure.
 */
export async function sendBlueberryOrderFailureAlert(
  order: { id: string; orderNumber: string },
  error: unknown
): Promise<void> {
  try {
    const client = getResendClient();
    if (!client) {
      console.error("[Blueberry Alert] RESEND_API_KEY not configured, cannot send alert");
      return;
    }

    const verifiedEmail = process.env.RESEND_VERIFIED_EMAIL || "focusrobin25@gmail.com";
    const requestedEmail = process.env.CONTACT_EMAIL || "support@focusrobin.com";
    const toEmail = process.env.RESEND_DOMAIN_VERIFIED === "true" ? requestedEmail : verifiedEmail;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const message = String((error as any)?.message || error).slice(0, 2000);

    await client.emails.send({
      from: `FocusRobin Ops Alerts <${fromEmail}>`,
      to: [toEmail],
      subject: `Blueberry order placement FAILED - Order ${order.orderNumber}`,
      html: `
        <p>Automatic Blueberry wholesale order placement failed for order <b>${order.orderNumber}</b> (id: ${order.id}).</p>
        <p>The customer's order and payment were <b>not</b> affected. Manual fulfillment via Blueberry is required for this order.</p>
        <pre style="white-space: pre-wrap; background:#f5f5f5; padding:12px; border-radius:4px;">${message}</pre>
      `,
    });
  } catch (alertErr) {
    console.error("[Blueberry Alert] Failed to send failure alert email:", alertErr);
  }
}
