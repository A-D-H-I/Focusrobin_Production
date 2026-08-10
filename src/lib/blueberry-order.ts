import { prisma } from "@/lib/prisma";
import type { Order, OrderItem } from "@prisma/client";
import { sendBlueberryOrderFailureAlert } from "@/lib/blueberry-order-alert";

const API_KEY = process.env.BLUEBERRY_API_KEY;
const API_URL = process.env.BLUEBERRY_API_URL || "https://mbx.blue-berry.eu/api";

type OrderItemWithSupplier = OrderItem & {
  Product: { supplier: string } | null;
  PrescriptionGlasses: { supplier: string } | null;
};

type OrderWithSupplierItems = Order & {
  items: OrderItemWithSupplier[];
  User: { email: string } | null;
};

/**
 * Places a real, non-cancellable wholesale order with Blueberry for the
 * Blueberry-sourced items in this order, if any. Never throws — any
 * failure is recorded on the order (blueberryOrderStatus: FAILED) and
 * triggers an admin alert email; the customer's order/payment is
 * untouched either way.
 *
 * Deliberately has NO retry logic: retrying an ambiguous failure
 * (timeout/5xx) against a non-cancellable order API risks a silent
 * duplicate order. Fail once, alert, let a human decide.
 *
 * Guarded by BLUEBERRY_AUTO_ORDER_ENABLED — ships disabled by default.
 */
export async function placeBlueberryOrderIfNeeded(order: OrderWithSupplierItems): Promise<void> {
  if (process.env.BLUEBERRY_AUTO_ORDER_ENABLED !== "true") {
    return;
  }

  const blueberryItems = order.items.filter(
    (item) => item.Product?.supplier === "BLUEBERRY" || item.PrescriptionGlasses?.supplier === "BLUEBERRY"
  );

  if (blueberryItems.length === 0) {
    return;
  }

  if (!API_KEY) {
    console.error("[Blueberry Order] BLUEBERRY_API_KEY not configured, cannot place order");
    return;
  }

  // Atomic claim: prevents double placement if finalizeOrder races (webhook + verify-session).
  const claim = await prisma.order.updateMany({
    where: { id: order.id, blueberryOrderStatus: { in: ["NOT_APPLICABLE", "PENDING"] } },
    data: { blueberryOrderStatus: "PENDING", blueberryOrderAttempts: { increment: 1 } },
  });
  if (claim.count === 0) {
    console.log(`[Blueberry Order] Order ${order.orderNumber} already claimed/placed - skipping.`);
    return;
  }

  try {
    const payload = {
      number: order.orderNumber,
      date: new Date().toISOString().slice(0, 10),
      currency: order.currency,
      customer: {
        email: order.User?.email || "orders@focusrobin.lt",
        country: order.shippingCountry,
        city: order.shippingCity,
        zipcode: order.shippingPostalCode,
        address: order.shippingAddressLine1,
      },
      items: blueberryItems.map((item) => ({
        sku: item.sku,
        qty: item.quantity,
      })),
    };

    console.log(`[Blueberry Order] Placing order for ${order.orderNumber}:`, JSON.stringify(payload));

    const res = await fetch(`${API_URL}/orders/create`, {
      method: "POST",
      headers: { akey: API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body: any = await res.json().catch(() => null);

    if (!res.ok || body?.status !== true) {
      throw new Error(`Blueberry API rejected order ${res.status}: ${JSON.stringify(body)}`);
    }

    const blueberryOrderId = body?.data?.id != null ? String(body.data.id) : null;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        blueberryOrderStatus: "PLACED",
        blueberryOrderId,
        blueberryOrderedAt: new Date(),
        blueberryOrderError: null,
      },
    });

    console.log(`[Blueberry Order] Placed order for ${order.orderNumber} - Blueberry order id: ${blueberryOrderId}`);
  } catch (err: any) {
    const message = String(err?.message || err).slice(0, 1000);
    console.error(`[Blueberry Order] FAILED to place order for ${order.orderNumber}:`, message);

    try {
      await prisma.order.update({
        where: { id: order.id },
        data: { blueberryOrderStatus: "FAILED", blueberryOrderError: message },
      });
    } catch (dbErr) {
      console.error(`[Blueberry Order] Failed to record failure status for ${order.orderNumber}:`, dbErr);
    }

    await sendBlueberryOrderFailureAlert(order, err);
  }
}
