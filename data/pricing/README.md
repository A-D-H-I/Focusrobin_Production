# BOD Lenses Price List 2025

This directory contains the source of truth for prescription lens pricing.

## File

- `bod-lenses-price-list-2025.csv` - The official BOD Lenses price list in CSV format

## CSV Structure

### Header Row
The first row contains column headers:
- Column 0: Lens model name
- Column 1: UC (Uncoated)
- Column 2: Basis
- Column 3: CLARUS II
- Column 4: Blue PRO
- Column 5: Clarus Sericum UV
- Column 6: Achromatic
- Column 7: Mirror Coating
- Column 8: Flash to Mirror
- Column 9: Ultraslik

### Lens Model Rows
Each row represents a lens model with prices for different coatings:
- Model name in column 0
- Prices in columns 1-9
- "x" indicates unavailable/not supported

### Supported Models in Site
The system only extracts prices for these models:
- `Mono Rx 1.56` → CLEAR/TINTED 1.56
- `Mono Rx 1.60` → CLEAR/TINTED 1.60
- `Mono Rx 1.67` → CLEAR/TINTED 1.67
- `Mono Rx 1.56 Solis` → PHOTOCHROMIC_SOLIS 1.56
- `Mono Rx 1.60 Solis` → PHOTOCHROMIC_SOLIS 1.60
- `Mono Rx 1.67 Solis` → PHOTOCHROMIC_SOLIS 1.67
- `Mono Rx 1.60 NuPolar` → POLARIZED_NUPOLAR 1.60
- `Mono Rx 1.67 NuPolar` → POLARIZED_NUPOLAR 1.67

### Service Sections

#### EDGING (around line 620)
Edging/mounting fees per order:
- Full frame: 4.60 EUR
- Nylon frame: 5.90 EUR
- Rimless (plastic pressing): 12.00 EUR
- Rimless (individual mountings): 20.00 EUR
- Lindberg/Complex: 20.00 EUR

#### RX TINTING (around line 626)
Tinting service fees per lens (converted to per pair in code):
- Full tinting (catalog): 3.00 EUR per lens = 6.00 EUR per pair (for 1.50/1.60/1.67)
- Gradient tinting (catalog): 4.00 EUR per lens = 8.00 EUR per pair (for 1.50/1.60)

## Usage

The CSV is automatically parsed during build time by `scripts/parse-lens-pricing-csv.ts`, which generates `src/lib/data/lensPricingData.ts`.

### Regenerating Pricing Data

After updating the CSV file, run:
```bash
npm run generate-pricing
```

Or it will run automatically before builds via the `prebuild` script.

## Important Notes

- **CSV is ALWAYS the source of truth** - All pricing must match the CSV exactly
- The parser only extracts prices for lens models currently supported in the site
- Any discrepancies between code and CSV will be resolved in favor of the CSV
- Build will fail if required prices are missing, ensuring data integrity
- **DO NOT manually edit** `src/lib/data/lensPricingData.ts` - it is auto-generated
- All pricing functions validate data at runtime and will throw errors if prices are missing

## Validation

The system includes multiple layers of validation to ensure CSV is always the source of truth:

### Runtime Validation

- **Module Load Validation**: When pricing modules are imported, they automatically validate that all required pricing data exists
- **Function-Level Validation**: All pricing functions use validated getters that throw errors if prices are missing (no silent fallbacks)
- **Error Messages**: Clear error messages guide developers to run `npm run generate-pricing` if data is missing

### Development Validation

Run the validation script to check pricing data integrity:

```bash
npm run validate-pricing
```

This script:
- Verifies CSV file exists and is accessible
- Checks that generated file exists and is up to date
- Validates checksum match between CSV and generated data
- Ensures all required models and fees are present
- Confirms only supported models are extracted

### CSV Metadata

The parser stores CSV metadata in the generated file:
- File path and last modified timestamp
- File size and line count
- SHA-256 checksum for integrity verification
- Count of supported models extracted

This metadata is used by validation scripts to ensure the generated data matches the CSV source.

## Architecture

```
CSV File (Source of Truth)
    ↓
[parse-lens-pricing-csv.ts] - Build-time parser
    ↓
[lensPricingData.ts] - Generated TypeScript constants
    ↓
[validatePricing.ts] - Runtime validation layer
    ↓
[lensPricing.ts, rx167.ts] - Pricing calculation modules
    ↓
Application Code
```

### Key Principles

1. **CSV is ALWAYS the source of truth** - No exceptions
2. **No hardcoded fallbacks** - Missing prices cause errors, not silent defaults
3. **Runtime validation** - System fails fast if pricing data is invalid
4. **Only supported models** - Parser only extracts models in `LENS_MODEL_MAPPING`
5. **Build-time generation** - CSV is parsed at build time for performance
6. **Development validation** - Scripts to verify CSV integrity

## Troubleshooting

### Error: "Pricing data missing for..."

This means the generated pricing data is missing a required price. Solutions:
1. Check that the CSV file contains the required model/coating
2. Run `npm run generate-pricing` to regenerate
3. Verify the model name in CSV matches exactly (case-sensitive)

### Error: "CSV checksum mismatch"

The CSV file has been modified since pricing data was generated. Solution:
```bash
npm run generate-pricing
```

### Warning: "Missing SERICUM_UV price for TINTED"

This may be expected if SERICUM_UV is not available for TINTED lenses in the CSV. The system will handle this gracefully, but verify the CSV to confirm.

## Files

- `bod-lenses-price-list-2025.csv` - Source CSV file (EDIT THIS to update prices)
- `scripts/parse-lens-pricing-csv.ts` - CSV parser script
- `scripts/validate-pricing-integrity.ts` - Validation script
- `src/lib/data/lensPricingData.ts` - Generated pricing constants (DO NOT EDIT)
- `src/lib/pricing/validatePricing.ts` - Runtime validation
- `src/lib/lensPricing.ts` - Main pricing module
- `src/lib/pricing/rx167.ts` - Rx167 pricing module

