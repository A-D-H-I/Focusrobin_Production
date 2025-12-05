// Currency exchange rate management
// Base currency: EUR
// Rates are cached in database and refreshed every 24 hours

import { prisma } from './prisma';

export interface CurrencyRate {
  code: string;
  rate: number;
  symbol: string;
  name: string;
  lastUpdated: Date;
}

export interface ExchangeRates {
  [code: string]: CurrencyRate;
}

const EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest/EUR';
const CACHE_DURATION_HOURS = 24;

// Symbol mapping for currencies
export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'Fr',
  PLN: 'zł',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  CZK: 'Kč',
  HUF: 'Ft',
  RON: 'lei',
  BGN: 'лв',
  ISK: 'kr', // Icelandic Króna
};

// Currency names
export const CURRENCY_NAMES: Record<string, string> = {
  EUR: 'Euro',
  USD: 'US Dollar',
  GBP: 'British Pound',
  CHF: 'Swiss Franc',
  PLN: 'Polish Złoty',
  SEK: 'Swedish Krona',
  NOK: 'Norwegian Krone',
  DKK: 'Danish Krone',
  CZK: 'Czech Koruna',
  HUF: 'Hungarian Forint',
  RON: 'Romanian Leu',
  BGN: 'Bulgarian Lev',
  ISK: 'Icelandic Króna',
};

// Supported currency codes
export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_SYMBOLS);

/**
 * Check if cached rates are stale (older than 24 hours)
 */
function isRateStale(lastUpdated: Date): boolean {
  const now = new Date();
  const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
  return hoursDiff > CACHE_DURATION_HOURS;
}

/**
 * Fetch fresh exchange rates from external API
 */
async function fetchExternalRates(): Promise<Record<string, number> | null> {
  try {
    const response = await fetch(EXCHANGE_RATE_API_URL, {
      next: { revalidate: 3600 }, // Cache for 1 hour on the edge
    });
    
    if (!response.ok) {
      console.error('Failed to fetch exchange rates:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data.rates as Record<string, number>;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return null;
  }
}

/**
 * Update database with new exchange rates
 */
async function updateDatabaseRates(rates: Record<string, number>): Promise<void> {
  for (const code of SUPPORTED_CURRENCIES) {
    const rate = rates[code];
    if (rate !== undefined) {
      await prisma.currencyRate.upsert({
        where: { code },
        update: { 
          rate, 
          lastUpdated: new Date() 
        },
        create: {
          code,
          rate,
          symbol: CURRENCY_SYMBOLS[code] || code,
          name: CURRENCY_NAMES[code] || code,
        },
      });
    }
  }
}

/**
 * Get exchange rates from database
 * If rates are stale, fetches fresh rates from API and updates DB
 * Falls back to cached rates if API fails
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  try {
    // Get rates from database
    const dbRates = await prisma.currencyRate.findMany();
    
    // Check if we have rates and if they're fresh
    const hasRates = dbRates.length > 0;
    const newestRate = hasRates ? dbRates.reduce((a, b) => 
      a.lastUpdated > b.lastUpdated ? a : b
    ) : null;
    
    const needsRefresh = !hasRates || (newestRate && isRateStale(newestRate.lastUpdated));
    
    if (needsRefresh) {
      console.log('Exchange rates are stale, fetching fresh rates...');
      const freshRates = await fetchExternalRates();
      
      if (freshRates) {
        await updateDatabaseRates(freshRates);
        // Fetch updated rates from database
        const updatedDbRates = await prisma.currencyRate.findMany();
        return ratesArrayToObject(updatedDbRates);
      }
      
      // API failed but we have cached rates, use them
      if (hasRates) {
        console.warn('API fetch failed, using cached rates');
        return ratesArrayToObject(dbRates);
      }
      
      // No cached rates and API failed, return defaults
      console.warn('No cached rates and API failed, using defaults');
      return getDefaultRates();
    }
    
    return ratesArrayToObject(dbRates);
  } catch (error) {
    console.error('Error getting exchange rates:', error);
    return getDefaultRates();
  }
}

/**
 * Get a single currency rate
 */
export async function getCurrencyRate(code: string): Promise<CurrencyRate | null> {
  try {
    const rate = await prisma.currencyRate.findUnique({
      where: { code },
    });
    
    if (rate) {
      return {
        code: rate.code,
        rate: rate.rate,
        symbol: rate.symbol,
        name: rate.name,
        lastUpdated: rate.lastUpdated,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting currency rate:', error);
    return null;
  }
}

/**
 * Convert array of rates to object keyed by currency code
 */
function ratesArrayToObject(rates: any[]): ExchangeRates {
  return rates.reduce((acc, rate) => {
    acc[rate.code] = {
      code: rate.code,
      rate: rate.rate,
      symbol: rate.symbol,
      name: rate.name,
      lastUpdated: rate.lastUpdated,
    };
    return acc;
  }, {} as ExchangeRates);
}

/**
 * Get default rates (fallback when DB is empty and API fails)
 */
function getDefaultRates(): ExchangeRates {
  const defaults: ExchangeRates = {};
  const defaultRateValues: Record<string, number> = {
    EUR: 1.0,
    USD: 1.08,
    GBP: 0.86,
    CHF: 0.94,
    PLN: 4.32,
    SEK: 11.42,
    NOK: 11.78,
    DKK: 7.46,
    CZK: 25.21,
    HUF: 395.50,
    RON: 4.97,
    BGN: 1.96,
    ISK: 150.0, // Icelandic Króna (approximate)
  };
  
  for (const code of SUPPORTED_CURRENCIES) {
    defaults[code] = {
      code,
      rate: defaultRateValues[code] || 1,
      symbol: CURRENCY_SYMBOLS[code] || code,
      name: CURRENCY_NAMES[code] || code,
      lastUpdated: new Date(),
    };
  }
  
  return defaults;
}

/**
 * Convert amount from EUR to target currency
 */
export function convertFromEur(amountInEur: number, targetCurrencyRate: number): number {
  return amountInEur * targetCurrencyRate;
}

/**
 * Convert amount from target currency back to EUR
 */
export function convertToEur(amount: number, sourceCurrencyRate: number): number {
  return amount / sourceCurrencyRate;
}

/**
 * Format price with currency symbol
 */
export function formatPrice(
  amountInEur: number, 
  currencyCode: string, 
  rate: number,
  options?: { showOriginal?: boolean }
): string {
  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  const convertedAmount = convertFromEur(amountInEur, rate);
  
  // Format based on currency (some currencies don't use decimals)
  const noDecimalCurrencies = ['HUF', 'CZK', 'SEK', 'NOK', 'DKK', 'ISK'];
  const decimals = noDecimalCurrencies.includes(currencyCode) ? 0 : 2;
  
  const formatted = convertedAmount.toFixed(decimals);
  
  // Position symbol based on convention
  const symbolAfterCurrencies = ['PLN', 'CZK', 'HUF', 'RON', 'BGN', 'SEK', 'NOK', 'DKK', 'ISK'];
  if (symbolAfterCurrencies.includes(currencyCode)) {
    return `${formatted} ${symbol}`;
  }
  
  return `${symbol}${formatted}`;
}

/**
 * Get currency symbol for a code
 */
export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] || code;
}

