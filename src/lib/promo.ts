/**
 * Promo code rules shared by the browser (strike-through prices, cart/checkout
 * summary) and the server (order pricing). Keep this file free of Prisma and
 * React imports so both sides compute exactly the same discount.
 */

export type PromoProductType = 'SUNGLASSES' | 'EYEGLASSES';
export type PromoGender = 'MEN' | 'WOMEN' | 'KIDS' | 'UNISEX';

export const PROMO_PRODUCT_TYPES: PromoProductType[] = ['SUNGLASSES', 'EYEGLASSES'];
export const PROMO_GENDERS: PromoGender[] = ['MEN', 'WOMEN', 'KIDS', 'UNISEX'];

/** Promo code fields needed to price an order (numbers, not Prisma Decimals) */
export interface PromoRules {
  id: string;
  code: string;
  description?: string | null;
  discountPercentage: number | null;
  discountAmount: number | null;
  cashbackPercentage: number | null;
  minPurchaseAmount: number | null;
  applyToFramesOnly: boolean;
  minFrameQuantity: number | null;
  bulkFrameDiscountPercentage: number | null;
  applicableBrands: string[];
  applicableGenders: string[];
  applicableProductTypes: string[];
  showAsCoupon?: boolean;
  endDate?: string | null;
}

/** What a promo needs to know about a product to decide eligibility */
export interface PromoProductInfo {
  brand: string;
  genders: string[];
  type: PromoProductType;
}

export interface PromoLine {
  product: PromoProductInfo;
  quantity: number;
  /** Price per unit actually charged (frame, or frame + lenses for prescription items) */
  unitPrice: number;
  /** Frame-only price per unit (equals unitPrice for non-prescription items) */
  frameUnitPrice: number;
}

export interface PromoResult {
  /** False when the code exists but doesn't apply to this cart (reason says why) */
  applied: boolean;
  /** English message template, e.g. "Minimum purchase amount of {amount}€ required" (translate, then fill reasonParams) */
  reason?: string;
  reasonParams?: Record<string, string>;
  discount: number;
  cashback: number;
  eligibleSubtotal: number;
}

export const roundMoney = (value: number) => Math.round(value * 100) / 100;

/** Convert a Prisma PromoCode row (Decimals) into plain numbers */
export function toPromoRules(row: {
  id: string;
  code: string;
  description?: string | null;
  discountPercentage: unknown;
  discountAmount: unknown;
  cashbackPercentage: unknown;
  minPurchaseAmount: unknown;
  applyToFramesOnly: boolean;
  minFrameQuantity: number | null;
  bulkFrameDiscountPercentage: unknown;
  applicableBrands?: string[] | null;
  applicableGenders?: string[] | null;
  applicableProductTypes?: string[] | null;
  showAsCoupon?: boolean | null;
  endDate?: Date | string | null;
}): PromoRules {
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return {
    id: row.id,
    code: row.code,
    description: row.description ?? null,
    discountPercentage: num(row.discountPercentage),
    discountAmount: num(row.discountAmount),
    cashbackPercentage: num(row.cashbackPercentage),
    minPurchaseAmount: num(row.minPurchaseAmount),
    applyToFramesOnly: row.applyToFramesOnly,
    minFrameQuantity: row.minFrameQuantity,
    bulkFrameDiscountPercentage: num(row.bulkFrameDiscountPercentage),
    applicableBrands: row.applicableBrands ?? [],
    applicableGenders: row.applicableGenders ?? [],
    applicableProductTypes: row.applicableProductTypes ?? [],
    showAsCoupon: row.showAsCoupon ?? false,
    endDate: row.endDate ? new Date(row.endDate).toISOString() : null,
  };
}

/** Status checks that don't depend on the cart (active flag, dates, usage limit) */
export function promoAvailabilityError(
  promo: { isActive: boolean; startDate: Date; endDate: Date | null; usageLimit: number | null; usedCount: number },
  now = new Date()
): string | null {
  if (!promo.isActive) return 'This promo code is not active';
  if (promo.startDate > now) return 'This promo code is not yet valid';
  if (promo.endDate && promo.endDate < now) return 'This promo code has expired';
  if (promo.usageLimit && promo.usedCount >= promo.usageLimit) return 'This promo code has reached its usage limit';
  return null;
}

/** Map a product's gender list (enum values, display names or a category name) to promo genders */
export function normalizeGenders(values: (string | null | undefined)[]): string[] {
  const out = new Set<string>();
  for (const value of values) {
    const v = (value || '').trim().toUpperCase();
    if (v === 'MEN' || v === "MEN'S") out.add('MEN');
    else if (v === 'WOMEN' || v === "WOMEN'S") out.add('WOMEN');
    else if (v === 'KIDS') out.add('KIDS');
    else if (v === 'UNISEX') out.add('UNISEX');
  }
  return out.size > 0 ? [...out] : ['UNISEX'];
}

/** Does this promo's brand / gender / product-type scope include the product? */
export function promoAppliesToProduct(promo: PromoRules, product: PromoProductInfo): boolean {
  if (promo.applicableProductTypes.length > 0 && !promo.applicableProductTypes.includes(product.type)) {
    return false;
  }
  if (promo.applicableBrands.length > 0) {
    const brand = product.brand.trim().toLowerCase();
    if (!promo.applicableBrands.some((b) => b.trim().toLowerCase() === brand)) return false;
  }
  if (promo.applicableGenders.length > 0) {
    if (!product.genders.some((g) => promo.applicableGenders.includes(g))) return false;
  }
  return true;
}

/**
 * Percentage taken off each eligible product's price, or null when the code is
 * a fixed amount or a bulk-frames deal (those only show in cart/checkout totals).
 */
export function promoProductPercent(promo: PromoRules): number | null {
  if (promo.applyToFramesOnly) return null;
  return promo.discountPercentage && promo.discountPercentage > 0 ? promo.discountPercentage : null;
}

/** Price of one product after a percentage promo (for strike-through display) */
export function applyPromoPercent(price: number, percent: number): number {
  return roundMoney(price * (1 - percent / 100));
}

/** Discount, cashback and eligibility for a whole cart */
export function computePromoDiscount(promo: PromoRules, lines: PromoLine[]): PromoResult {
  const none = (reason: string, reasonParams?: Record<string, string>): PromoResult => ({
    applied: false,
    reason,
    reasonParams,
    discount: 0,
    cashback: 0,
    eligibleSubtotal: 0,
  });

  const orderSubtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  if (promo.minPurchaseAmount && orderSubtotal < promo.minPurchaseAmount) {
    return none('Minimum purchase amount of {amount}€ required', { amount: promo.minPurchaseAmount.toFixed(2) });
  }

  const eligible = lines.filter((l) => promoAppliesToProduct(promo, l.product));
  if (eligible.length === 0) {
    return none('This promo code does not apply to the items in your cart');
  }

  if (promo.applyToFramesOnly) {
    const frameQuantity = eligible.reduce((sum, l) => sum + l.quantity, 0);
    const required = promo.minFrameQuantity || 0;
    if (frameQuantity < required) {
      return none('This promo code requires purchasing at least {count} frames', { count: String(required) });
    }
    const frameSubtotal = eligible.reduce((sum, l) => sum + l.frameUnitPrice * l.quantity, 0);
    const pct = promo.bulkFrameDiscountPercentage || 0;
    const discount = roundMoney(Math.min((frameSubtotal * pct) / 100, frameSubtotal));
    return { applied: discount > 0, discount, cashback: 0, eligibleSubtotal: frameSubtotal };
  }

  const eligibleSubtotal = eligible.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  let discount = 0;
  if (promo.discountPercentage) {
    discount = (eligibleSubtotal * promo.discountPercentage) / 100;
  } else if (promo.discountAmount) {
    discount = promo.discountAmount;
  }
  discount = roundMoney(Math.min(discount, eligibleSubtotal));
  const cashback = promo.cashbackPercentage ? roundMoney((eligibleSubtotal * promo.cashbackPercentage) / 100) : 0;

  return { applied: discount > 0 || cashback > 0, discount, cashback, eligibleSubtotal };
}

/** Clean the scope fields of an admin create/update request (undefined = leave unchanged) */
export function parsePromoScopeInput(body: Record<string, unknown>) {
  const list = (v: unknown) =>
    Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string').map((x) => x.trim()).filter(Boolean))] : undefined;

  const brands = list(body.applicableBrands);
  const genders = list(body.applicableGenders)?.filter((g): g is PromoGender => (PROMO_GENDERS as string[]).includes(g));
  const types = list(body.applicableProductTypes)?.filter((t): t is PromoProductType => (PROMO_PRODUCT_TYPES as string[]).includes(t));

  return {
    ...(brands !== undefined && { applicableBrands: brands }),
    ...(genders !== undefined && { applicableGenders: genders }),
    ...(types !== undefined && { applicableProductTypes: types }),
    ...(typeof body.showAsCoupon === 'boolean' && { showAsCoupon: body.showAsCoupon }),
  };
}

/** Fill "{name}" placeholders in an (already translated) message */
export function fillMessage(message: string, params?: Record<string, string>): string {
  if (!params) return message;
  return message.replace(/\{(\w+)\}/g, (match, key) => params[key] ?? match);
}
