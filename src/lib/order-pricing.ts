import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { calculateRetailPrice } from '@/lib/price-utils';
import { normalizeImageUrl } from '@/lib/normalize-image-url';
import {
  computePromoDiscount,
  normalizeGenders,
  promoAvailabilityError,
  roundMoney,
  toPromoRules,
  type PromoLine,
} from '@/lib/promo';

/**
 * Server-side order pricing shared by Stripe (actions/checkout.ts) and PayPal
 * (api/paypal/create-order). Prices come from the database, never from the
 * browser; the browser's total is only compared against the result.
 */

const productFields = {
  id: true,
  name: true,
  slug: true,
  brand: true,
  basePrice: true,
  discountPct: true,
  gender: true,
  Category: { select: { name: true } },
} as const;

const variantFields = {
  id: true,
  name: true,
  sku: true,
  price: true,
  stock: true,
} as const;

/** Prisma select for the cart items needed to price an order */
export const cartPricingSelect = {
  id: true,
  items: {
    select: {
      id: true,
      productId: true,
      prescriptionGlassesId: true,
      variantId: true,
      quantity: true,
      prescriptionData: true,
      Product: {
        select: {
          ...productFields,
          ProductVariant: {
            select: {
              ...variantFields,
              ProductAsset: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
        },
      },
      PrescriptionGlasses: {
        select: {
          ...productFields,
          PrescriptionGlassesVariant: {
            select: {
              ...variantFields,
              PrescriptionGlassesAsset: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartSelect;

export type PricingCart = Prisma.CartGetPayload<{ select: typeof cartPricingSelect }>;
type PricingCartItem = PricingCart['items'][number];

export interface PricedOrderItem {
  productId: string | null;
  prescriptionGlassesId: string | null;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
  imageUrl: string | null;
  prescriptionData: any;
}

export function getCartForPricing(userId: string) {
  return prisma.cart.findUnique({ where: { userId }, select: cartPricingSelect });
}

/** Resolve the product and the cart item's variant (either sunglasses or prescription glasses) */
export function resolveCartItem(cartItem: PricingCartItem) {
  const product = cartItem.Product || cartItem.PrescriptionGlasses;
  const variant = cartItem.Product
    ? cartItem.Product.ProductVariant.find((v) => v.id === cartItem.variantId)
    : cartItem.PrescriptionGlasses?.PrescriptionGlassesVariant.find((v) => v.id === cartItem.variantId);
  return { product, variant };
}

/**
 * Frame price after the product's own discount, rounded to cents exactly like the price
 * shown on product pages and in the cart (prisma-product-mapper formats it with toFixed(2))
 */
function framePrice(product: NonNullable<ReturnType<typeof resolveCartItem>['product']>, variantPrice: unknown): number {
  const basePrice = variantPrice ? Number(variantPrice) : calculateRetailPrice(Number(product.basePrice), product.brand);
  const discountPct = product.discountPct || 0;
  return roundMoney(basePrice * (1 - discountPct / 100));
}

/** Price every cart line from the database */
export function priceCartItems(cart: PricingCart) {
  const orderItems: PricedOrderItem[] = [];
  const promoLines: PromoLine[] = [];
  let subtotal = 0;

  for (const cartItem of cart.items) {
    const { product, variant } = resolveCartItem(cartItem);
    if (!product || !variant) continue;

    // Only use prescription data stored on the cart item itself
    const prescriptionData = cartItem.prescriptionData ? (cartItem.prescriptionData as any) : null;
    const frameUnitPrice = framePrice(product, variant.price);
    const unitPrice = prescriptionData?.rxPriceBreakdown?.totalNet
      ? Number(prescriptionData.rxPriceBreakdown.totalNet)
      : frameUnitPrice;

    const total = unitPrice * cartItem.quantity;
    subtotal += total;

    const primaryAsset = cartItem.Product
      ? (variant as any).ProductAsset?.[0]
      : (variant as any).PrescriptionGlassesAsset?.[0];

    orderItems.push({
      productId: cartItem.productId,
      prescriptionGlassesId: cartItem.prescriptionGlassesId,
      variantId: cartItem.variantId,
      productName: product.name,
      variantName: variant.name,
      sku: variant.sku,
      quantity: cartItem.quantity,
      price: unitPrice,
      total,
      imageUrl: primaryAsset?.url ? normalizeImageUrl(primaryAsset.url) : null,
      prescriptionData,
    });

    promoLines.push({
      product: {
        brand: product.brand,
        genders: normalizeGenders(product.gender.length > 0 ? product.gender : [product.Category?.name]),
        type: cartItem.Product ? 'SUNGLASSES' : 'EYEGLASSES',
      },
      quantity: cartItem.quantity,
      unitPrice,
      frameUnitPrice,
    });
  }

  return { orderItems, promoLines, subtotal };
}

/** Validate a promo code against the priced cart; invalid or inapplicable codes give no discount */
export async function resolvePromo(promoCodeId: string | null | undefined, promoLines: PromoLine[]) {
  const none = { promoCodeId: null as string | null, promoDiscount: 0, promoCashback: 0 };
  if (!promoCodeId) return none;

  const row = await prisma.promoCode.findUnique({ where: { id: promoCodeId } });
  if (!row || promoAvailabilityError(row)) return none;

  const result = computePromoDiscount(toPromoRules(row), promoLines);
  if (!result.applied) return none;

  return { promoCodeId: row.id, promoDiscount: result.discount, promoCashback: result.cashback };
}

/** Amount to charge: subtotal + shipping - promo - wallet, rounded to cents */
export function orderTotal(subtotal: number, shipping: number, promoDiscount: number, walletAmount: number) {
  return roundMoney(Math.max(0, subtotal + shipping - promoDiscount) - walletAmount);
}

/** The browser must show the same total the server charges (compared in whole cents, 1 cent tolerance) */
export function totalsMatch(clientTotal: number, serverTotal: number) {
  return Math.abs(Math.round(clientTotal * 100) - Math.round(serverTotal * 100)) <= 1;
}

export const PRICE_CHANGED_ERROR =
  'Prices in your cart have changed. Please refresh the page to see the updated total and try again.';
