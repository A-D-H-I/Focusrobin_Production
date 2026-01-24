/**
 * Calculate delivery time based on order type and shipping location
 * @param items - Array of order items
 * @param shippingCountry - Shipping country name
 * @returns Delivery time string (e.g., "2-4 days", "4-7 days")
 */
export function getDeliveryTime(
  items: Array<{ prescriptionData?: any; productSlug?: string | null }>,
  shippingCountry: string
): string {
  // Check if order contains prescription glasses
  // An item is prescription glasses if:
  // 1. It has prescriptionData (prescription lenses were added)
  // 2. OR the product slug contains "prescription-glasses"
  const hasPrescriptionGlasses = items.some(
    (item) =>
      item.prescriptionData ||
      (item.productSlug && item.productSlug.includes("prescription-glasses"))
  );

  // Check if shipping is inside Lithuania
  const isInsideLithuania =
    shippingCountry.toLowerCase() === "lithuania" ||
    shippingCountry.toLowerCase() === "lt";

  // Calculate delivery time based on logic
  if (hasPrescriptionGlasses) {
    // Prescription glasses
    if (isInsideLithuania) {
      return "4-7 days";
    } else {
      return "9-14 days";
    }
  } else {
    // Sunglasses
    if (isInsideLithuania) {
      return "2-4 days";
    } else {
      return "4-7 days";
    }
  }
}

