"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CURRENCY_SYMBOLS, CURRENCY_NAMES, SUPPORTED_CURRENCIES } from '@/lib/currency';

export interface CurrencyRate {
  code: string;
  rate: number;
  symbol: string;
  name: string;
}

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  rates: Record<string, CurrencyRate>;
  isLoading: boolean;
  convertPrice: (amountInEur: number) => number;
  formatPrice: (amountInEur: number) => string;
  formatPriceRaw: (amount: number) => string; // Format without conversion (for already converted amounts)
  getCurrentRate: () => number;
  getCurrentSymbol: () => string;
  // For wallet/checkout: always show EUR base value alongside converted
  formatPriceWithBase: (amountInEur: number) => { converted: string; base: string; rate: number };
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = 'focusrobin-currency';

// Default rates (fallback if API fails)
const DEFAULT_RATES: Record<string, CurrencyRate> = {
  EUR: { code: 'EUR', rate: 1.0, symbol: '€', name: 'Euro' },
  USD: { code: 'USD', rate: 1.08, symbol: '$', name: 'US Dollar' },
  GBP: { code: 'GBP', rate: 0.86, symbol: '£', name: 'British Pound' },
  CHF: { code: 'CHF', rate: 0.94, symbol: 'Fr', name: 'Swiss Franc' },
  PLN: { code: 'PLN', rate: 4.32, symbol: 'zł', name: 'Polish Złoty' },
  SEK: { code: 'SEK', rate: 11.42, symbol: 'kr', name: 'Swedish Krona' },
  NOK: { code: 'NOK', rate: 11.78, symbol: 'kr', name: 'Norwegian Krone' },
  DKK: { code: 'DKK', rate: 7.46, symbol: 'kr', name: 'Danish Krone' },
  CZK: { code: 'CZK', rate: 25.21, symbol: 'Kč', name: 'Czech Koruna' },
  HUF: { code: 'HUF', rate: 395.50, symbol: 'Ft', name: 'Hungarian Forint' },
  RON: { code: 'RON', rate: 4.97, symbol: 'lei', name: 'Romanian Leu' },
  BGN: { code: 'BGN', rate: 1.96, symbol: 'лв', name: 'Bulgarian Lev' },
  ISK: { code: 'ISK', rate: 150.0, symbol: 'kr', name: 'Icelandic Króna' },
};

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState('EUR');
  const [rates, setRates] = useState<Record<string, CurrencyRate>>(DEFAULT_RATES);
  const [isLoading, setIsLoading] = useState(true);

  // Load currency preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (saved && SUPPORTED_CURRENCIES.includes(saved)) {
        setCurrencyState(saved);
      }
    }
  }, []);

  // Fetch rates from API
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('/api/currency/rates');
        if (response.ok) {
          const data = await response.json();
          if (data.rates) {
            setRates(data.rates);
          }
        }
      } catch (error) {
        console.error('Error fetching currency rates:', error);
        // Keep using default rates
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
    
    // Refresh rates every hour
    const interval = setInterval(fetchRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Save currency preference to localStorage
  const setCurrency = useCallback((newCurrency: string) => {
    if (SUPPORTED_CURRENCIES.includes(newCurrency)) {
      setCurrencyState(newCurrency);
      if (typeof window !== 'undefined') {
        localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
      }
    }
  }, []);

  // Get current exchange rate
  const getCurrentRate = useCallback(() => {
    return rates[currency]?.rate || 1;
  }, [currency, rates]);

  // Get current currency symbol
  const getCurrentSymbol = useCallback(() => {
    return rates[currency]?.symbol || CURRENCY_SYMBOLS[currency] || currency;
  }, [currency, rates]);

  // Convert price from EUR to current currency
  const convertPrice = useCallback((amountInEur: number) => {
    const rate = getCurrentRate();
    return amountInEur * rate;
  }, [getCurrentRate]);

  // Format converted price with symbol
  const formatPrice = useCallback((amountInEur: number) => {
    const rate = getCurrentRate();
    const symbol = getCurrentSymbol();
    const convertedAmount = amountInEur * rate;
    
    // Some currencies don't use decimals
    const noDecimalCurrencies = ['HUF', 'CZK', 'SEK', 'NOK', 'DKK', 'ISK'];
    const decimals = noDecimalCurrencies.includes(currency) ? 0 : 2;
    const formatted = convertedAmount.toFixed(decimals);
    
    // Position symbol based on convention
    const symbolAfterCurrencies = ['PLN', 'CZK', 'HUF', 'RON', 'BGN', 'SEK', 'NOK', 'DKK', 'ISK'];
    if (symbolAfterCurrencies.includes(currency)) {
      return `${formatted} ${symbol}`;
    }
    
    return `${symbol}${formatted}`;
  }, [currency, getCurrentRate, getCurrentSymbol]);

  // Format price without conversion (for already converted amounts)
  const formatPriceRaw = useCallback((amount: number) => {
    const symbol = getCurrentSymbol();
    
    const noDecimalCurrencies = ['HUF', 'CZK', 'SEK', 'NOK', 'DKK', 'ISK'];
    const decimals = noDecimalCurrencies.includes(currency) ? 0 : 2;
    const formatted = amount.toFixed(decimals);
    
    const symbolAfterCurrencies = ['PLN', 'CZK', 'HUF', 'RON', 'BGN', 'SEK', 'NOK', 'DKK', 'ISK'];
    if (symbolAfterCurrencies.includes(currency)) {
      return `${formatted} ${symbol}`;
    }
    
    return `${symbol}${formatted}`;
  }, [currency, getCurrentSymbol]);

  // Format price showing both converted and base EUR value (for checkout/wallet)
  const formatPriceWithBase = useCallback((amountInEur: number) => {
    const rate = getCurrentRate();
    const convertedAmount = amountInEur * rate;
    
    const noDecimalCurrencies = ['HUF', 'CZK', 'SEK', 'NOK', 'DKK', 'ISK'];
    const decimals = noDecimalCurrencies.includes(currency) ? 0 : 2;
    const symbol = getCurrentSymbol();
    
    const symbolAfterCurrencies = ['PLN', 'CZK', 'HUF', 'RON', 'BGN', 'SEK', 'NOK', 'DKK', 'ISK'];
    
    let converted: string;
    if (symbolAfterCurrencies.includes(currency)) {
      converted = `${convertedAmount.toFixed(decimals)} ${symbol}`;
    } else {
      converted = `${symbol}${convertedAmount.toFixed(decimals)}`;
    }
    
    const base = `€${amountInEur.toFixed(2)}`;
    
    return { converted, base, rate };
  }, [currency, getCurrentRate, getCurrentSymbol]);

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      rates,
      isLoading,
      convertPrice,
      formatPrice,
      formatPriceRaw,
      getCurrentRate,
      getCurrentSymbol,
      formatPriceWithBase,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
