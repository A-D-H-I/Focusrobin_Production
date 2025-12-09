// Country to currency mapping
// Maps ISO country codes to supported currency codes

export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // Eurozone countries
  'AT': 'EUR', // Austria
  'BE': 'EUR', // Belgium
  'CY': 'EUR', // Cyprus
  'EE': 'EUR', // Estonia
  'FI': 'EUR', // Finland
  'FR': 'EUR', // France
  'DE': 'EUR', // Germany
  'GR': 'EUR', // Greece
  'IE': 'EUR', // Ireland
  'IT': 'EUR', // Italy
  'LV': 'EUR', // Latvia
  'LT': 'EUR', // Lithuania
  'LU': 'EUR', // Luxembourg
  'MT': 'EUR', // Malta
  'NL': 'EUR', // Netherlands
  'PT': 'EUR', // Portugal
  'SK': 'EUR', // Slovakia
  'SI': 'EUR', // Slovenia
  'ES': 'EUR', // Spain
  
  // Non-Euro European countries
  'BG': 'BGN', // Bulgaria
  'CZ': 'CZK', // Czech Republic
  'DK': 'DKK', // Denmark
  'HU': 'HUF', // Hungary
  'IS': 'ISK', // Iceland
  'PL': 'PLN', // Poland
  'RO': 'RON', // Romania
  'SE': 'SEK', // Sweden
  'NO': 'NOK', // Norway
  'CH': 'CHF', // Switzerland
  
  // Other countries
  'GB': 'GBP', // United Kingdom
  'US': 'USD', // United States
  'CA': 'USD', // Canada (using USD as fallback, or could add CAD)
  'AU': 'USD', // Australia (using USD as fallback, or could add AUD)
  'NZ': 'USD', // New Zealand (using USD as fallback, or could add NZD)
  
  // Default fallback for unsupported countries
};

/**
 * Get currency code for a country code
 * Returns EUR as default if country is not mapped
 */
export function getCurrencyForCountry(countryCode: string | null | undefined): string {
  if (!countryCode) return 'EUR';
  
  const upperCountryCode = countryCode.toUpperCase();
  return COUNTRY_TO_CURRENCY[upperCountryCode] || 'EUR';
}

/**
 * Check if a country code is supported
 */
export function isCountrySupported(countryCode: string | null | undefined): boolean {
  if (!countryCode) return false;
  return countryCode.toUpperCase() in COUNTRY_TO_CURRENCY;
}

