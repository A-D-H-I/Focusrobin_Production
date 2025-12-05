"use client";

import { useCurrency } from '@/context/CurrencyContext';
import { useCallback, useMemo } from 'react';

interface UsePriceReturn {
  formatPrice: (amountInEur: number) => string;
  formatPriceRaw: (amount: number) => string;
  convertPrice: (amountInEur: number) => number;
  currency: string;
  symbol: string;
  rate: number;
  // For wallet/checkout displays
  formatWithBase: (amountInEur: number) => { 
    converted: string; 
    base: string; 
    rate: number;
  };
  // Parse a price string (like "€129.00") to get EUR value
  parseEurPrice: (priceString: string) => number;
}

/**
 * Custom hook for handling multi-currency price formatting and conversion
 * 
 * @example
 * ```tsx
 * const { formatPrice, convertPrice, symbol, rate } = usePrice();
 * 
 * // Format a EUR price in current currency
 * <span>{formatPrice(129.00)}</span> // "$139.32" if USD selected
 * 
 * // Get converted value for calculations
 * const convertedTotal = convertPrice(subtotal);
 * 
 * // For checkout/wallet: show both converted and EUR base
 * const { converted, base, rate } = formatWithBase(100);
 * // converted: "$108.00", base: "€100.00", rate: 1.08
 * ```
 */
export function usePrice(): UsePriceReturn {
  const {
    currency,
    formatPrice: contextFormatPrice,
    formatPriceRaw: contextFormatPriceRaw,
    convertPrice: contextConvertPrice,
    getCurrentRate,
    getCurrentSymbol,
    formatPriceWithBase,
  } = useCurrency();

  const rate = useMemo(() => getCurrentRate(), [getCurrentRate]);
  const symbol = useMemo(() => getCurrentSymbol(), [getCurrentSymbol]);

  const formatPrice = useCallback((amountInEur: number) => {
    return contextFormatPrice(amountInEur);
  }, [contextFormatPrice]);

  const formatPriceRaw = useCallback((amount: number) => {
    return contextFormatPriceRaw(amount);
  }, [contextFormatPriceRaw]);

  const convertPrice = useCallback((amountInEur: number) => {
    return contextConvertPrice(amountInEur);
  }, [contextConvertPrice]);

  const formatWithBase = useCallback((amountInEur: number) => {
    return formatPriceWithBase(amountInEur);
  }, [formatPriceWithBase]);

  // Parse a price string like "€129.00" or "$139.32" to get the EUR value
  // This is useful when prices come from the database as formatted strings
  const parseEurPrice = useCallback((priceString: string): number => {
    // Remove currency symbols and whitespace
    const cleaned = priceString.replace(/[€$£Fr\s,złkrKčFtleiлв]/g, '').trim();
    // Replace comma with dot for European number format
    const normalized = cleaned.replace(',', '.');
    const value = parseFloat(normalized);
    return isNaN(value) ? 0 : value;
  }, []);

  return {
    formatPrice,
    formatPriceRaw,
    convertPrice,
    currency,
    symbol,
    rate,
    formatWithBase,
    parseEurPrice,
  };
}

export default usePrice;

