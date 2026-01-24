/**
 * Auto-generated from BOD Lenses Price List 2025 CSV
 * DO NOT EDIT MANUALLY - Run: npm run generate-pricing
 * 
 * CSV is the SOURCE OF TRUTH for all pricing data.
 * Any manual edits to this file will be overwritten.
 * 
 * Source: G:\Dev\focusrobinsite\data\pricing\bod-lenses-price-list-2025.csv
 * Generated: 2026-01-24T13:17:05.919Z
 * 
 * CSV Metadata:
 *   - Last Modified: 2026-01-07T21:19:14.396Z
 *   - File Size: 54384 bytes
 *   - Line Count: 636
 *   - Checksum: 61a2c64af2f91a43b63d05afec3e3f95d4d86f597f4c0b37aa443761b7a28b1e
 *   - Supported Models Extracted: 8
 */

export const LENS_PRICE_SINGLE: Record<string, Partial<Record<string, Record<string, number>>>> = {
  CLEAR: {
    "1.56": {UC: 8.49, BLUE_PRO: 14.49, SERICUM_UV: 14.49 },
    "1.60": {UC: 16.98, BLUE_PRO: 22.98, SERICUM_UV: 22.98 },
    "1.67": {UC: 25.07, BLUE_PRO: 31.07, SERICUM_UV: 31.07 },
  },
  TINTED: {
    "1.56": {UC: 8.49, BLUE_PRO: 14.49, SERICUM_UV: 14.49 },
    "1.60": {UC: 16.98, BLUE_PRO: 22.98, SERICUM_UV: 22.98 },
    "1.67": {UC: 25.07, BLUE_PRO: 31.07, SERICUM_UV: 31.07 },
  },
  PHOTOCHROMIC_SOLIS: {
    "1.56": {UC: 13.53, BLUE_PRO: 19.53, SERICUM_UV: 19.53 },
    "1.60": {UC: 24.66, BLUE_PRO: 30.66, SERICUM_UV: 30.66 },
    "1.67": {UC: 32.9, BLUE_PRO: 38.9, SERICUM_UV: 38.9 },
  },
  POLARIZED_NUPOLAR: {
    "1.60": {UC: 35.98, BLUE_PRO: 41.98, SERICUM_UV: 41.98 },
    "1.67": {UC: 58.62, BLUE_PRO: 64.62, SERICUM_UV: 64.62 },
  },
} as const;

export const TINT_FEES_PAIR = {
  FULL_TINT_CATALOG: 6,  // 3 per lens × 2 = 6 per pair (from CSV)
  GRADIENT: 8,  // 4 per lens × 2 = 8 per pair (from CSV)
} as const;

export const EDGING_FEES = {
  FULL_FRAME: 4.6,
  NYLON_FRAME: 5.9,
  RIMLESS_PRESSING: 12,
  RIMLESS_INDIVIDUAL: 20,
  LINDBERG_COMPLEX: 20,
} as const;

/**
 * CSV metadata for integrity validation
 * Used to verify that generated data matches CSV source
 */
export const CSV_METADATA = {
  filePath: "G:/Dev/focusrobinsite/data/pricing/bod-lenses-price-list-2025.csv",
  lastModified: "2026-01-07T21:19:14.396Z",
  fileSize: 54384,
  lineCount: 636,
  checksum: "61a2c64af2f91a43b63d05afec3e3f95d4d86f597f4c0b37aa443761b7a28b1e",
  supportedModelsCount: 8,
  generatedAt: "2026-01-24T13:17:05.920Z",
} as const;
