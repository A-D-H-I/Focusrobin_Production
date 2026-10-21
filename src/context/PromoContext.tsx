"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product } from '@/lib/productData';
import {
  applyPromoPercent,
  promoAppliesToProduct,
  promoProductPercent,
  type PromoRules,
} from '@/lib/promo';
import { parseEuro, productPromoInfo } from '@/lib/promo-client';

const STORAGE_KEY = 'focusrobin-applied-promo';

export interface ProductPromoPrice {
  /** Current price before any promo code (after the product's own discount) */
  price: number;
  /** Price with the applied code, when it applies to this product */
  promoPrice: number | null;
  /** The applied code, when it gives this product a percentage discount */
  appliedPromo: PromoRules | null;
  appliedPercent: number | null;
  /** A public coupon the visitor could apply to this product (not yet applied) */
  coupon: PromoRules | null;
  couponPercent: number | null;
}

interface PromoContextType {
  coupons: PromoRules[];
  appliedPromo: PromoRules | null;
  /** Validate and apply a typed code; resolves to an error message or null */
  applyCode: (code: string) => Promise<string | null>;
  /** Apply a public coupon clicked on a product */
  applyCoupon: (coupon: PromoRules) => void;
  removePromo: () => void;
  getProductPromo: (product: Product) => ProductPromoPrice;
}

const PromoContext = createContext<PromoContextType | undefined>(undefined);

function readStoredPromo(): PromoRules | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PromoRules) : null;
  } catch {
    return null;
  }
}

function storePromo(promo: PromoRules | null) {
  try {
    if (promo) localStorage.setItem(STORAGE_KEY, JSON.stringify(promo));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode): the code just won't survive a reload
  }
}

async function fetchPromo(code: string): Promise<{ promo: PromoRules | null; error: string | null }> {
  try {
    const response = await fetch('/api/promo-codes/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await response.json();
    if (response.ok && data.success) return { promo: data.promoCode as PromoRules, error: null };
    return { promo: null, error: data.error || 'Invalid promo code' };
  } catch {
    return { promo: null, error: 'Failed to validate promo code. Please try again.' };
  }
}

export function PromoProvider({ children }: { children: ReactNode }) {
  const [coupons, setCoupons] = useState<PromoRules[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<PromoRules | null>(null);

  // Load public coupons, and re-check a remembered code (it may have expired or been disabled)
  useEffect(() => {
    let cancelled = false;
    fetch('/api/promo-codes/coupons')
      .then((r) => (r.ok ? r.json() : { coupons: [] }))
      .then((data) => !cancelled && setCoupons(data.coupons || []))
      .catch(() => {});

    const stored = readStoredPromo();
    if (stored?.code) {
      setAppliedPromo(stored);
      fetchPromo(stored.code).then(({ promo }) => {
        if (cancelled) return;
        setAppliedPromo(promo);
        storePromo(promo);
      });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const applyCode = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return 'Please enter a promo code';
    const { promo, error } = await fetchPromo(trimmed);
    if (promo) {
      setAppliedPromo(promo);
      storePromo(promo);
    }
    return error;
  }, []);

  const applyCoupon = useCallback((coupon: PromoRules) => {
    setAppliedPromo(coupon);
    storePromo(coupon);
  }, []);

  const removePromo = useCallback(() => {
    setAppliedPromo(null);
    storePromo(null);
  }, []);

  const getProductPromo = useCallback(
    (product: Product): ProductPromoPrice => {
      const price = parseEuro(product.price);
      const info = productPromoInfo(product);

      const appliedPercent =
        appliedPromo && promoAppliesToProduct(appliedPromo, info) ? promoProductPercent(appliedPromo) : null;

      // Suggest the best public coupon only when nothing is applied to this product yet
      let coupon: PromoRules | null = null;
      let couponPercent: number | null = null;
      if (!appliedPercent) {
        for (const c of coupons) {
          if (c.id === appliedPromo?.id || !promoAppliesToProduct(c, info)) continue;
          const pct = promoProductPercent(c);
          if (pct && pct > (couponPercent ?? 0)) {
            coupon = c;
            couponPercent = pct;
          }
        }
      }

      return {
        price,
        promoPrice: appliedPercent ? applyPromoPercent(price, appliedPercent) : null,
        appliedPromo: appliedPercent ? appliedPromo : null,
        appliedPercent,
        coupon,
        couponPercent,
      };
    },
    [appliedPromo, coupons]
  );

  const value = useMemo(
    () => ({ coupons, appliedPromo, applyCode, applyCoupon, removePromo, getProductPromo }),
    [coupons, appliedPromo, applyCode, applyCoupon, removePromo, getProductPromo]
  );

  return <PromoContext.Provider value={value}>{children}</PromoContext.Provider>;
}

export function usePromo() {
  const context = useContext(PromoContext);
  if (!context) throw new Error('usePromo must be used within a PromoProvider');
  return context;
}
