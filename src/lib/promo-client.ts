import type { Product } from '@/lib/productData';
import type { CartItem } from '@/lib/cart-wishlist-mapper';
import { normalizeGenders, type PromoLine, type PromoProductInfo } from '@/lib/promo';

/** "€42.13" -> 42.13 (same parsing as CartContext.getCartTotal) */
export function parseEuro(price: string | undefined | null): number {
  if (!price) return 0;
  return parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
}

/** Promo-eligibility facts about a storefront product */
export function productPromoInfo(product: Product): PromoProductInfo {
  return {
    brand: product.brand || 'FocusRobin',
    genders: normalizeGenders(product.categories || []),
    type: product.productType === 'eyeglasses' ? 'EYEGLASSES' : 'SUNGLASSES',
  };
}

/** Cart items as promo lines, priced exactly like CartContext.getCartTotal */
export function cartItemsToPromoLines(items: CartItem[]): PromoLine[] {
  return items.map((item) => {
    const frameUnitPrice = parseEuro(item.product.price);
    const rxTotal = item.prescriptionData?.rxPriceBreakdown?.totalNet;
    return {
      product: productPromoInfo(item.product),
      quantity: item.quantity,
      unitPrice: rxTotal ? Number(rxTotal) : frameUnitPrice,
      frameUnitPrice,
    };
  });
}
