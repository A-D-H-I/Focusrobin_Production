/**
 * Determines the shipping provider based on the shipping country
 * @param country - The shipping country name
 * @returns The shipping provider name ("Omniva" or "DHL")
 */
export function getShippingProvider(country: string): string {
  // Normalize country name for comparison (case-insensitive)
  const normalizedCountry = country.trim().toLowerCase();
  
  // Countries that use Omniva
  const omnivaCountries = ['latvia', 'lithuania', 'estonia'];
  
  // Check if country is in the Omniva list
  if (omnivaCountries.includes(normalizedCountry)) {
    return 'Omniva';
  }
  
  // Default to DHL for all other countries
  return 'DHL';
}

/**
 * Get shipping provider display name
 */
export function getShippingProviderDisplayName(provider: string): string {
  return provider === 'Omniva' ? 'Omniva' : 'DHL';
}

