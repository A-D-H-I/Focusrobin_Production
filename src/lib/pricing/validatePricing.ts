/**
 * Pricing Validation Module
 * 
 * Ensures all pricing data comes from CSV-generated constants and validates
 * data integrity at runtime. This module enforces that the CSV is ALWAYS
 * the source of truth for pricing.
 * 
 * Source: data/pricing/bod-lenses-price-list-2025.csv
 */

import { LENS_PRICE_SINGLE, TINT_FEES_PAIR, EDGING_FEES } from '../data/lensPricingData';

export type LensType = "CLEAR" | "TINTED" | "PHOTOCHROMIC_SOLIS" | "POLARIZED_NUPOLAR";
export type LensIndex = "1.56" | "1.60" | "1.67";
export type Coating = "UC" | "BLUE_PRO" | "SERICUM_UV";

interface ValidationError {
  type: 'missing_price' | 'invalid_structure' | 'zero_price' | 'missing_model';
  message: string;
  context?: Record<string, unknown>;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Required lens models that must exist in the pricing data
 */
const REQUIRED_LENS_MODELS: Array<{ type: LensType; index: LensIndex; coatings: Coating[] }> = [
  { type: 'CLEAR', index: '1.56', coatings: ['UC', 'BLUE_PRO', 'SERICUM_UV'] },
  { type: 'CLEAR', index: '1.60', coatings: ['UC', 'BLUE_PRO', 'SERICUM_UV'] },
  { type: 'CLEAR', index: '1.67', coatings: ['UC', 'BLUE_PRO', 'SERICUM_UV'] },
  { type: 'TINTED', index: '1.56', coatings: ['BLUE_PRO', 'SERICUM_UV'] },
  { type: 'TINTED', index: '1.60', coatings: ['BLUE_PRO', 'SERICUM_UV'] },
  { type: 'TINTED', index: '1.67', coatings: ['BLUE_PRO', 'SERICUM_UV'] },
  { type: 'PHOTOCHROMIC_SOLIS', index: '1.56', coatings: ['UC', 'BLUE_PRO', 'SERICUM_UV'] },
  { type: 'PHOTOCHROMIC_SOLIS', index: '1.60', coatings: ['UC', 'BLUE_PRO', 'SERICUM_UV'] },
  { type: 'PHOTOCHROMIC_SOLIS', index: '1.67', coatings: ['UC', 'BLUE_PRO', 'SERICUM_UV'] },
  { type: 'POLARIZED_NUPOLAR', index: '1.60', coatings: ['UC', 'BLUE_PRO', 'SERICUM_UV'] },
  { type: 'POLARIZED_NUPOLAR', index: '1.67', coatings: ['UC', 'BLUE_PRO', 'SERICUM_UV'] },
];

/**
 * Required tint fees
 */
const REQUIRED_TINT_FEES: Array<keyof typeof TINT_FEES_PAIR> = [
  'FULL_TINT_CATALOG',
  'GRADIENT',
];

/**
 * Required edging fees
 */
const REQUIRED_EDGING_FEES: Array<keyof typeof EDGING_FEES> = [
  'FULL_FRAME',
  'NYLON_FRAME',
  'RIMLESS_PRESSING',
  'RIMLESS_INDIVIDUAL',
  'LINDBERG_COMPLEX',
];

/**
 * Validates that pricing data structure is correct
 */
function validateStructure(): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check that LENS_PRICE_SINGLE exists and is an object
  if (!LENS_PRICE_SINGLE || typeof LENS_PRICE_SINGLE !== 'object') {
    errors.push({
      type: 'invalid_structure',
      message: 'LENS_PRICE_SINGLE is missing or invalid',
    });
    return errors; // Can't continue validation if structure is broken
  }

  // Check that TINT_FEES_PAIR exists
  if (!TINT_FEES_PAIR || typeof TINT_FEES_PAIR !== 'object') {
    errors.push({
      type: 'invalid_structure',
      message: 'TINT_FEES_PAIR is missing or invalid',
    });
  }

  // Check that EDGING_FEES exists
  if (!EDGING_FEES || typeof EDGING_FEES !== 'object') {
    errors.push({
      type: 'invalid_structure',
      message: 'EDGING_FEES is missing or invalid',
    });
  }

  return errors;
}

/**
 * Validates that all required lens models have prices
 */
function validateLensPrices(): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const model of REQUIRED_LENS_MODELS) {
    const lensTypeData = LENS_PRICE_SINGLE[model.type];
    
    if (!lensTypeData) {
      errors.push({
        type: 'missing_model',
        message: `Missing lens type: ${model.type}`,
        context: { type: model.type },
      });
      continue;
    }

    const indexData = lensTypeData[model.index];
    
    if (!indexData) {
      errors.push({
        type: 'missing_model',
        message: `Missing lens index ${model.index} for type ${model.type}`,
        context: { type: model.type, index: model.index },
      });
      continue;
    }

    for (const coating of model.coatings) {
      const price = indexData[coating];
      
      if (price === undefined || price === null) {
        errors.push({
          type: 'missing_price',
          message: `Missing price for ${model.type} ${model.index} ${coating}`,
          context: { type: model.type, index: model.index, coating },
        });
      } else if (price === 0) {
        errors.push({
          type: 'zero_price',
          message: `Price is zero for ${model.type} ${model.index} ${coating} (should be > 0)`,
          context: { type: model.type, index: model.index, coating, price },
        });
      } else if (price < 0) {
        errors.push({
          type: 'invalid_structure',
          message: `Negative price for ${model.type} ${model.index} ${coating}`,
          context: { type: model.type, index: model.index, coating, price },
        });
      }
    }
  }

  return errors;
}

/**
 * Validates that all required tint fees exist
 */
function validateTintFees(): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const feeKey of REQUIRED_TINT_FEES) {
    const fee = TINT_FEES_PAIR[feeKey];
    
    if (fee === undefined || fee === null) {
      errors.push({
        type: 'missing_price',
        message: `Missing tint fee: ${feeKey}`,
        context: { feeKey },
      });
    } else if (fee < 0) {
      errors.push({
        type: 'invalid_structure',
        message: `Invalid tint fee for ${feeKey}: ${fee} (must be >= 0)`,
        context: { feeKey, fee },
      });
    }
  }

  return errors;
}

/**
 * Validates that all required edging fees exist
 */
function validateEdgingFees(): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const feeKey of REQUIRED_EDGING_FEES) {
    const fee = EDGING_FEES[feeKey];
    
    if (fee === undefined || fee === null) {
      errors.push({
        type: 'missing_price',
        message: `Missing edging fee: ${feeKey}`,
        context: { feeKey },
      });
    } else if (fee < 0) {
      errors.push({
        type: 'invalid_structure',
        message: `Invalid edging fee for ${feeKey}: ${fee} (must be >= 0)`,
        context: { feeKey, fee },
      });
    }
  }

  return errors;
}

/**
 * Validates pricing data integrity
 * 
 * @returns ValidationResult with errors and warnings
 */
export function validatePricingData(): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Validate structure first
  errors.push(...validateStructure());
  
  // If structure is broken, don't continue
  if (errors.some(e => e.type === 'invalid_structure')) {
    return { isValid: false, errors, warnings };
  }

  // Validate lens prices
  errors.push(...validateLensPrices());
  
  // Validate tint fees
  errors.push(...validateTintFees());
  
  // Validate edging fees
  errors.push(...validateEdgingFees());

  // Check for potential issues (warnings)
  if (Object.keys(LENS_PRICE_SINGLE).length === 0) {
    warnings.push('LENS_PRICE_SINGLE is empty - no pricing data found');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Gets a price for a lens model, throwing an error if price is missing
 * 
 * This function enforces that prices must come from CSV and prevents
 * silent fallbacks to zero or hardcoded values.
 * 
 * @throws Error if price is missing or invalid
 */
export function getValidatedPrice(
  lensType: LensType,
  index: LensIndex,
  coating: Coating
): number {
  const lensTypeData = LENS_PRICE_SINGLE[lensType];
  
  if (!lensTypeData) {
    throw new Error(
      `Pricing data missing for lens type: ${lensType}. ` +
      `This indicates the CSV may be missing this model or the pricing data was not generated correctly. ` +
      `Please run: npm run generate-pricing`
    );
  }

  const indexData = lensTypeData[index];
  
  if (!indexData) {
    throw new Error(
      `Pricing data missing for ${lensType} index ${index}. ` +
      `This indicates the CSV may be missing this model or the pricing data was not generated correctly. ` +
      `Please run: npm run generate-pricing`
    );
  }

  const price = indexData[coating];
  
  if (price === undefined || price === null) {
    throw new Error(
      `Price missing for ${lensType} ${index} ${coating}. ` +
      `This indicates the CSV may be missing this coating option or the pricing data was not generated correctly. ` +
      `Please run: npm run generate-pricing`
    );
  }

  if (price <= 0) {
    throw new Error(
      `Invalid price for ${lensType} ${index} ${coating}: ${price}. ` +
      `Price must be greater than 0. Please check the CSV file.`
    );
  }

  return price;
}

/**
 * Gets a tint fee, throwing an error if fee is missing
 * 
 * @throws Error if fee is missing or invalid
 */
export function getValidatedTintFee(feeKey: keyof typeof TINT_FEES_PAIR): number {
  const fee = TINT_FEES_PAIR[feeKey];
  
  if (fee === undefined || fee === null) {
    throw new Error(
      `Tint fee missing for: ${feeKey}. ` +
      `This indicates the CSV may be missing this fee or the pricing data was not generated correctly. ` +
      `Please run: npm run generate-pricing`
    );
  }

  if (fee < 0) {
    throw new Error(
      `Invalid tint fee for ${feeKey}: ${fee}. ` +
      `Fee must be >= 0. Please check the CSV file.`
    );
  }

  return fee;
}

/**
 * Gets an edging fee, throwing an error if fee is missing
 * 
 * @throws Error if fee is missing or invalid
 */
export function getValidatedEdgingFee(feeKey: keyof typeof EDGING_FEES): number {
  const fee = EDGING_FEES[feeKey];
  
  if (fee === undefined || fee === null) {
    throw new Error(
      `Edging fee missing for: ${feeKey}. ` +
      `This indicates the CSV may be missing this fee or the pricing data was not generated correctly. ` +
      `Please run: npm run generate-pricing`
    );
  }

  if (fee < 0) {
    throw new Error(
      `Invalid edging fee for ${feeKey}: ${fee}. ` +
      `Fee must be >= 0. Please check the CSV file.`
    );
  }

  return fee;
}

/**
 * Validates pricing data on module load and throws if invalid
 * 
 * This should be called when pricing modules are imported to ensure
 * data integrity before any pricing calculations are performed.
 */
export function validatePricingOnLoad(): void {
  const result = validatePricingData();
  
  if (!result.isValid) {
    const errorMessages = result.errors.map(e => e.message).join('\n');
    const warningMessages = result.warnings.length > 0 
      ? '\nWarnings:\n' + result.warnings.join('\n')
      : '';
    
    throw new Error(
      `Pricing data validation failed. The CSV-generated pricing data is invalid or incomplete.\n\n` +
      `Errors:\n${errorMessages}${warningMessages}\n\n` +
      `Please ensure the CSV file at data/pricing/bod-lenses-price-list-2025.csv is correct ` +
      `and run: npm run generate-pricing`
    );
  }
  
  if (result.warnings.length > 0) {
    console.warn('Pricing data validation warnings:', result.warnings);
  }
}

