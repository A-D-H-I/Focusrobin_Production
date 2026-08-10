/**
 * Centralized price calculation utility.
 *
 * This is the SINGLE SOURCE OF TRUTH for the margin formula used across
 * the entire FocusRobin application. Any change to the pricing logic
 * should be made here and nowhere else.
 *
 * Formula (for non-FocusRobin brands):
 *   basePrice × 2.5
 */

/**
 * Calculates the retail price for a product.
 *
 * For FocusRobin-branded products, the base price IS the retail price
 * (no margin markup applied).
 *
 * For third-party brands (e.g., BigBuy/Blueberry imports), the margin formula is applied.
 *
 * @param basePrice - The raw base/wholesale price
 * @param brand     - The product brand name
 * @returns The calculated retail price (before any discount)
 */
export function calculateRetailPrice(basePrice: number, brand: string): number {
  const isFocusRobin = (brand || "").trim().toLowerCase() === "focusrobin";

  if (isFocusRobin || basePrice <= 0) {
    return basePrice;
  }

  return basePrice * 2.5;
}

/**
 * Calculates the final price after applying a percentage discount.
 *
 * @param retailPrice - The retail price (output of calculateRetailPrice)
 * @param discountPct - The discount percentage (0-100)
 * @returns The final price after discount
 */
export function calculateFinalPrice(
  retailPrice: number,
  discountPct: number = 0
): number {
  if (discountPct <= 0) return retailPrice;
  return retailPrice * (1 - discountPct / 100);
}
