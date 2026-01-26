// Language data for European countries
// Maps countries to their primary languages and currencies

export interface Language {
  code: string; // ISO 639-1 language code
  name: string; // Language name in English
  nativeName: string; // Language name in native language
  country?: string; // Primary country
}

export interface CountryLanguage {
  country: string;
  languages: string[]; // Language codes
  currency: string; // Currency code
}

// Supported languages - Lithuanian, Russian, and English
export const supportedLanguages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
];

// Country to language and currency mapping
export const countryLanguageMap: Record<string, CountryLanguage> = {
  // Euro Zone Countries
  'AT': { country: 'Austria', languages: ['de'], currency: 'EUR' },
  'BE': { country: 'Belgium', languages: ['nl', 'fr', 'de'], currency: 'EUR' },
  'HR': { country: 'Croatia', languages: ['hr'], currency: 'EUR' },
  'EE': { country: 'Estonia', languages: ['et'], currency: 'EUR' },
  'FI': { country: 'Finland', languages: ['fi', 'sv'], currency: 'EUR' },
  'FR': { country: 'France', languages: ['fr'], currency: 'EUR' },
  'DE': { country: 'Germany', languages: ['de'], currency: 'EUR' },
  'GR': { country: 'Greece', languages: ['el'], currency: 'EUR' },
  'IT': { country: 'Italy', languages: ['it'], currency: 'EUR' },
  'LV': { country: 'Latvia', languages: ['lv'], currency: 'EUR' },
  'LT': { country: 'Lithuania', languages: ['lt'], currency: 'EUR' },
  'LU': { country: 'Luxembourg', languages: ['lb', 'fr', 'de'], currency: 'EUR' },
  'MT': { country: 'Malta', languages: ['mt', 'en'], currency: 'EUR' },
  'NL': { country: 'Netherlands', languages: ['nl'], currency: 'EUR' },
  'PT': { country: 'Portugal', languages: ['pt'], currency: 'EUR' },
  'SK': { country: 'Slovakia', languages: ['sk'], currency: 'EUR' },
  'SI': { country: 'Slovenia', languages: ['sl'], currency: 'EUR' },
  'ES': { country: 'Spain', languages: ['es'], currency: 'EUR' },
  
  // Non-Euro Countries
  'BG': { country: 'Bulgaria', languages: ['bg'], currency: 'BGN' },
  'CZ': { country: 'Czech Republic', languages: ['cs'], currency: 'CZK' },
  'DK': { country: 'Denmark', languages: ['da'], currency: 'DKK' },
  'HU': { country: 'Hungary', languages: ['hu'], currency: 'HUF' },
  'IS': { country: 'Iceland', languages: ['is'], currency: 'ISK' },
  'LI': { country: 'Liechtenstein', languages: ['de'], currency: 'CHF' },
  'NO': { country: 'Norway', languages: ['no'], currency: 'NOK' },
  'PL': { country: 'Poland', languages: ['pl'], currency: 'PLN' },
  'RO': { country: 'Romania', languages: ['ro'], currency: 'RON' },
  'SE': { country: 'Sweden', languages: ['sv'], currency: 'SEK' },
  'CH': { country: 'Switzerland', languages: ['de', 'fr', 'it', 'rm'], currency: 'CHF' },
};

// Get language by code
export function getLanguageByCode(code: string): Language | undefined {
  return supportedLanguages.find(lang => lang.code === code);
}

// Get languages for a country
export function getLanguagesForCountry(countryCode: string): Language[] {
  const country = countryLanguageMap[countryCode];
  if (!country) return [];
  
  return country.languages
    .map(code => getLanguageByCode(code))
    .filter((lang): lang is Language => lang !== undefined);
}

// Get currency for a country
export function getCurrencyForCountry(countryCode: string): string {
  return countryLanguageMap[countryCode]?.currency || 'EUR';
}

// Get all supported language codes
export const supportedLanguageCodes = supportedLanguages.map(lang => lang.code);
