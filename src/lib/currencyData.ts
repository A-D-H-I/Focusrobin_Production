// Currency data for the currency switcher
// This file provides the list of supported currencies for UI components

export interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
}

export const supportedCurrencies: SupportedCurrency[] = [
  // Euro Zone Countries (all use EUR)
  { code: 'EUR', name: 'Euro (€)', symbol: '€' },
  
  // Non-Euro European Countries
  { code: 'BGN', name: 'Bulgarian Lev (лв)', symbol: 'лв' },
  { code: 'CZK', name: 'Czech Koruna (Kč)', symbol: 'Kč' },
  { code: 'DKK', name: 'Danish Krone (kr)', symbol: 'kr' },
  { code: 'HUF', name: 'Hungarian Forint (Ft)', symbol: 'Ft' },
  { code: 'ISK', name: 'Icelandic Króna (kr)', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Złoty (zł)', symbol: 'zł' },
  { code: 'RON', name: 'Romanian Leu (lei)', symbol: 'lei' },
  { code: 'SEK', name: 'Swedish Krona (kr)', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone (kr)', symbol: 'kr' },
  { code: 'CHF', name: 'Swiss Franc (Fr)', symbol: 'Fr' },
  
  // Additional currencies
  { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
  { code: 'GBP', name: 'British Pound (£)', symbol: '£' },
];

// Helper to get currency symbol by code
export function getCurrencySymbol(code: string): string {
  const currency = supportedCurrencies.find(c => c.code === code);
  return currency?.symbol || code;
}

// Helper to get currency display name
export function getCurrencyDisplayName(code: string): string {
  const currency = supportedCurrencies.find(c => c.code === code);
  return currency?.name || code;
}

// Get all supported currency codes
export const supportedCurrencyCodes = supportedCurrencies.map(c => c.code);
