"use client";

import { Check, Tag } from 'lucide-react';
import type { Product } from '@/lib/productData';
import { usePrice } from '@/hooks/usePrice';
import { usePromo } from '@/context/PromoContext';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { fillMessage } from '@/lib/promo';

interface PromoPriceProps {
  product: Product;
  /** Classes for the price the customer pays */
  priceClassName?: string;
  /** Classes for the crossed-out price */
  strikeClassName?: string;
  /** Classes for the "-20%" badge */
  badgeClassName?: string;
  className?: string;
  /** Show the "Save X% with coupon" chip when a public coupon applies */
  showCoupon?: boolean;
}

export const formatPercent = (pct: number) => (pct % 1 === 0 ? `${pct}` : pct.toFixed(1));

/**
 * Product price with promotions:
 * - applied promo code that covers this product: new price, current price crossed out, "-X%" badge
 * - otherwise: current price, the product's "was" price crossed out, and its own discount badge
 * - plus an Amazon-style coupon chip when a public coupon would apply
 */
export default function PromoPrice({
  product,
  priceClassName,
  strikeClassName,
  badgeClassName,
  className,
  showCoupon = true,
}: PromoPriceProps) {
  const { formatPrice, parseEurPrice } = usePrice();
  const { getProductPromo, applyCoupon } = usePromo();
  const { t } = useLanguage();
  const promo = getProductPromo(product);

  const price = parseEurPrice(product.price);
  const originalPrice = product.originalPrice ? parseEurPrice(product.originalPrice) : null;
  const promoApplied = promo.promoPrice !== null && promo.appliedPercent !== null;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2 flex-wrap">
        {promoApplied ? (
          <>
            <p className={cn('font-bold text-foreground', priceClassName)}>{formatPrice(promo.promoPrice!)}</p>
            <p className={cn('text-muted-foreground line-through', strikeClassName)}>{formatPrice(price)}</p>
            <span className={cn('font-semibold text-green-700', badgeClassName)}>
              -{formatPercent(promo.appliedPercent!)}%
            </span>
          </>
        ) : (
          <>
            <p className={cn('font-bold text-foreground', priceClassName)}>{formatPrice(price)}</p>
            {originalPrice && originalPrice !== price && (
              <p className={cn('text-muted-foreground line-through', strikeClassName)}>{formatPrice(originalPrice)}</p>
            )}
            {product.discountPct ? (
              <span className={cn('font-semibold text-rose-500', badgeClassName)}>-{product.discountPct}%</span>
            ) : null}
          </>
        )}
      </div>

      {promoApplied && promo.appliedPromo ? (
        <p className="flex items-center gap-1 text-xs font-medium text-green-700">
          <Check className="h-3.5 w-3.5" />
          {t('Coupon applied')}: {promo.appliedPromo.code}
        </p>
      ) : showCoupon && promo.coupon && promo.couponPercent ? (
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-sm bg-green-700 px-1.5 py-0.5 font-semibold text-white">
            <Tag className="h-3 w-3" />
            {fillMessage(t('Save {percent}% with coupon'), { percent: formatPercent(promo.couponPercent) })}
          </span>
          <button
            type="button"
            onClick={(e) => {
              // Cards are links: applying a coupon must not open the product
              e.preventDefault();
              e.stopPropagation();
              applyCoupon(promo.coupon!);
            }}
            className="font-semibold text-green-700 underline-offset-2 hover:underline"
          >
            {t('Apply')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
