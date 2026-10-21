"use client";

import { useState } from 'react';
import { Check, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePromo } from '@/context/PromoContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePrice } from '@/hooks/usePrice';
import { fillMessage, type PromoResult } from '@/lib/promo';

interface CartPromoCodeProps {
  /** computePromoDiscount result for the current cart (null when no code is applied) */
  result: PromoResult | null;
}

/** "Have a promo code?" box for the cart: apply, show the saving, or explain why it doesn't apply */
export default function CartPromoCode({ result }: CartPromoCodeProps) {
  const { appliedPromo, applyCode, removePromo } = usePromo();
  const { t } = useLanguage();
  const { formatPrice } = usePrice();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    const message = await applyCode(code);
    setError(message ? t(message) : '');
    if (!message) setCode('');
    setIsApplying(false);
  };

  if (appliedPromo) {
    const applies = !!result?.applied;
    return (
      <div
        className={`flex items-start justify-between gap-2 rounded-lg border p-3 text-sm ${
          applies ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
        }`}
      >
        <div className="min-w-0">
          <p className={`flex items-center gap-1.5 font-semibold ${applies ? 'text-green-700' : 'text-amber-800'}`}>
            {applies ? <Check className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
            {appliedPromo.code}
          </p>
          {applies ? (
            <p className="mt-0.5 text-xs text-green-700">
              {t('You save')} {formatPrice(result!.discount)}
            </p>
          ) : result?.reason ? (
            <p className="mt-0.5 text-xs text-amber-800">{fillMessage(t(result.reason), result.reasonParams)}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={removePromo}
          aria-label={t('Remove promo code')}
          className="rounded p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor="cart-promo-code" className="text-sm font-medium text-brand-blue">
        {t('Have a promo code?')}
      </label>
      <div className="flex gap-2">
        <Input
          id="cart-promo-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleApply();
            }
          }}
          placeholder={t('Enter promo code')}
          disabled={isApplying}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleApply}
          disabled={isApplying || !code.trim()}
          className="bg-brand-teal text-white hover:bg-brand-teal/90"
        >
          {isApplying ? '...' : t('Apply')}
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
