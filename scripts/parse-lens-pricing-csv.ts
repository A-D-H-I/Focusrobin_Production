/**
 * CSV Parser for BOD Lenses Price List 2025
 * 
 * This script parses the BOD Lenses pricing CSV and generates TypeScript constants
 * for only the lens models currently supported in the site.
 * 
 * CSV Structure:
 * - Row 0: Headers (Lens model name, UC, Basis, CLARUS II, Blue PRO, Clarus Sericum UV, ...)
 * - Rows 1-619: Lens models with prices
 * - Row 620: "EDGING" header
 * - Rows 621-625: Edging fees
 * - Row 626: "RX TINTING" header
 * - Rows 627-631: Tinting service fees
 * 
 * Column Mapping:
 * - Column 0: Lens model name
 * - Column 1: UC (Uncoated)
 * - Column 4: Blue PRO
 * - Column 5: Clarus Sericum UV
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// CSV column indices
const COL_UC = 1;
const COL_BLUE_PRO = 4;
const COL_SERICUM_UV = 5;

// Supported lens models mapping (CSV model name → our lens type)
const LENS_MODEL_MAPPING: Record<string, { type: string; index: string }> = {
  'Mono Rx 1.56': { type: 'CLEAR', index: '1.56' },
  'Mono Rx 1.60': { type: 'CLEAR', index: '1.60' },
  'Mono Rx 1.67': { type: 'CLEAR', index: '1.67' },
  'Mono Rx 1.56 Solis': { type: 'PHOTOCHROMIC_SOLIS', index: '1.56' },
  'Mono Rx 1.60 Solis': { type: 'PHOTOCHROMIC_SOLIS', index: '1.60' },
  'Mono Rx 1.67 Solis': { type: 'PHOTOCHROMIC_SOLIS', index: '1.67' },
  'Mono Rx 1.60 NuPolar': { type: 'POLARIZED_NUPOLAR', index: '1.60' },
  'Mono Rx 1.67 NuPolar': { type: 'POLARIZED_NUPOLAR', index: '1.67' },
};

interface ParsedPrice {
  UC?: number;
  BLUE_PRO?: number;
  SERICUM_UV?: number;
}

interface ParsedData {
  lenses: Record<string, Record<string, ParsedPrice>>;
  edging: {
    FULL_FRAME: number;
    NYLON_FRAME: number;
    RIMLESS_PRESSING: number;
    RIMLESS_INDIVIDUAL: number;
    LINDBERG_COMPLEX: number;
  };
  tinting: {
    FULL_TINT_CATALOG: number; // per pair
    GRADIENT: number; // per pair
  };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function parsePrice(value: string): number | null {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === 'x' || trimmed === '' || trimmed === 'nemokamai') {
    return null;
  }
  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
}

function normalizeModelName(name: string): string {
  // Remove quotes and extra spaces
  return name.replace(/^"|"$/g, '').trim();
}

interface CSVMetadata {
  filePath: string;
  lastModified: string;
  fileSize: number;
  lineCount: number;
  checksum: string; // SHA-256 hash of file content
  supportedModelsCount: number;
}

function calculateChecksum(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function getCSVMetadata(csvPath: string, content: string, supportedModelsCount: number): CSVMetadata {
  const stats = fs.statSync(csvPath);
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  
  return {
    filePath: csvPath,
    lastModified: stats.mtime.toISOString(),
    fileSize: stats.size,
    lineCount: lines.length,
    checksum: calculateChecksum(content),
    supportedModelsCount,
  };
}

function parseCSV(csvPath: string): { data: ParsedData; metadata: CSVMetadata } {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  
  const result: ParsedData = {
    lenses: {
      CLEAR: {},
      TINTED: {},
      PHOTOCHROMIC_SOLIS: {},
      POLARIZED_NUPOLAR: {},
    },
    edging: {
      FULL_FRAME: 0,
      NYLON_FRAME: 0,
      RIMLESS_PRESSING: 0,
      RIMLESS_INDIVIDUAL: 0,
      LINDBERG_COMPLEX: 0,
    },
    tinting: {
      FULL_TINT_CATALOG: 0,
      GRADIENT: 0,
    },
  };

  let inEdgingSection = false;
  let inTintingSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = parseCSVLine(line);
    const firstCol = normalizeModelName(columns[0] || '');

    // Check for section headers
    if (firstCol === 'EDGING') {
      inEdgingSection = true;
      inTintingSection = false;
      continue;
    }
    
    if (firstCol === 'RX TINTING') {
      inEdgingSection = false;
      inTintingSection = true;
      continue;
    }

    // Parse edging fees
    if (inEdgingSection) {
      if (firstCol === 'Full frame') {
        result.edging.FULL_FRAME = parsePrice(columns[1]) || 0;
      } else if (firstCol === 'Nylon frame') {
        result.edging.NYLON_FRAME = parsePrice(columns[1]) || 0;
      } else if (firstCol === 'Rimless glasses frames with plastic pressing technology') {
        result.edging.RIMLESS_PRESSING = parsePrice(columns[1]) || 0;
      } else if (firstCol === 'Rimless eyeglass frames assembled with individually adjustable screws') {
        result.edging.RIMLESS_INDIVIDUAL = parsePrice(columns[1]) || 0;
      } else if (firstCol === 'Lindberg and other complex structures') {
        result.edging.LINDBERG_COMPLEX = parsePrice(columns[1]) || 0;
      }
      continue;
    }

    // Parse tinting fees
    if (inTintingSection) {
      // Only get the 1.50 | 1.60* | 1.67* row (not the 1.74 row)
      if (firstCol === 'Full tinting according to the Bod Lenses catalog') {
        const indexCol = columns[2] || '';
        // Check if this is for 1.50/1.60/1.67 (not 1.74)
        if (indexCol.includes('1.50') || indexCol.includes('1.60') || indexCol.includes('1.67')) {
          const pricePerLens = parsePrice(columns[1]);
          if (pricePerLens !== null && result.tinting.FULL_TINT_CATALOG === 0) {
            // Convert per lens to per pair (multiply by 2)
            result.tinting.FULL_TINT_CATALOG = pricePerLens * 2;
          }
        }
      } else if (firstCol === 'Gradient tinting according to Bod Lenses catalog*') {
        const pricePerLens = parsePrice(columns[1]);
        if (pricePerLens !== null) {
          // Convert per lens to per pair (multiply by 2)
          result.tinting.GRADIENT = pricePerLens * 2;
        }
      }
      continue;
    }

    // Parse lens models
    const mapping = LENS_MODEL_MAPPING[firstCol];
    if (mapping) {
      const { type, index } = mapping;
      
      if (!result.lenses[type][index]) {
        result.lenses[type][index] = {};
      }

      const ucPrice = parsePrice(columns[COL_UC]);
      const blueProPrice = parsePrice(columns[COL_BLUE_PRO]);
      const sericumPrice = parsePrice(columns[COL_SERICUM_UV]);

      if (ucPrice !== null) {
        result.lenses[type][index].UC = ucPrice;
      }
      if (blueProPrice !== null) {
        result.lenses[type][index].BLUE_PRO = blueProPrice;
      }
      if (sericumPrice !== null) {
        result.lenses[type][index].SERICUM_UV = sericumPrice;
      }
    }
  }

  // Count supported models that were actually extracted
  let supportedModelsCount = 0;
  for (const [lensType, indices] of Object.entries(result.lenses)) {
    for (const index of Object.keys(indices)) {
      supportedModelsCount++;
    }
  }

  const metadata = getCSVMetadata(csvPath, content, supportedModelsCount);

  return { data: result, metadata };
}

function generateTypeScript(data: ParsedData, metadata: CSVMetadata): string {
  const indent = (level: number) => '  '.repeat(level);

  let output = `/**
 * Auto-generated from BOD Lenses Price List 2025 CSV
 * DO NOT EDIT MANUALLY - Run: npm run generate-pricing
 * 
 * CSV is the SOURCE OF TRUTH for all pricing data.
 * Any manual edits to this file will be overwritten.
 * 
 * Source: ${metadata.filePath}
 * Generated: ${new Date().toISOString()}
 * 
 * CSV Metadata:
 *   - Last Modified: ${metadata.lastModified}
 *   - File Size: ${metadata.fileSize} bytes
 *   - Line Count: ${metadata.lineCount}
 *   - Checksum: ${metadata.checksum}
 *   - Supported Models Extracted: ${metadata.supportedModelsCount}
 */

`;

  // Generate LENS_PRICE_SINGLE
  output += 'export const LENS_PRICE_SINGLE: Record<string, Partial<Record<string, Record<string, number>>>> = {\n';
  
  for (const [lensType, indices] of Object.entries(data.lenses)) {
    output += `${indent(1)}${lensType}: {\n`;
    
    // TINTED uses the same prices as CLEAR
    if (lensType === 'TINTED' && Object.keys(indices).length === 0) {
      const clearPrices = data.lenses.CLEAR;
      for (const [index, prices] of Object.entries(clearPrices)) {
        output += `${indent(2)}"${index}": {`;
        
        const priceEntries: string[] = [];
        if (prices.UC !== undefined) priceEntries.push(`UC: ${prices.UC}`);
        if (prices.BLUE_PRO !== undefined) priceEntries.push(`BLUE_PRO: ${prices.BLUE_PRO}`);
        if (prices.SERICUM_UV !== undefined) priceEntries.push(`SERICUM_UV: ${prices.SERICUM_UV}`);
        
        output += priceEntries.join(', ');
        output += ' },\n';
      }
    } else {
      for (const [index, prices] of Object.entries(indices)) {
        output += `${indent(2)}"${index}": {`;
        
        const priceEntries: string[] = [];
        if (prices.UC !== undefined) priceEntries.push(`UC: ${prices.UC}`);
        if (prices.BLUE_PRO !== undefined) priceEntries.push(`BLUE_PRO: ${prices.BLUE_PRO}`);
        if (prices.SERICUM_UV !== undefined) priceEntries.push(`SERICUM_UV: ${prices.SERICUM_UV}`);
        
        output += priceEntries.join(', ');
        output += ' },\n';
      }
    }
    
    output += `${indent(1)}},\n`;
  }
  
  output += '} as const;\n\n';

  // Generate TINT_FEES_PAIR
  output += 'export const TINT_FEES_PAIR = {\n';
  output += `${indent(1)}FULL_TINT_CATALOG: ${data.tinting.FULL_TINT_CATALOG},  // ${data.tinting.FULL_TINT_CATALOG / 2} per lens × 2 = ${data.tinting.FULL_TINT_CATALOG} per pair (from CSV)\n`;
  output += `${indent(1)}GRADIENT: ${data.tinting.GRADIENT},  // ${data.tinting.GRADIENT / 2} per lens × 2 = ${data.tinting.GRADIENT} per pair (from CSV)\n`;
  output += '} as const;\n\n';

  // Generate EDGING_FEES
  output += 'export const EDGING_FEES = {\n';
  output += `${indent(1)}FULL_FRAME: ${data.edging.FULL_FRAME},\n`;
  output += `${indent(1)}NYLON_FRAME: ${data.edging.NYLON_FRAME},\n`;
  output += `${indent(1)}RIMLESS_PRESSING: ${data.edging.RIMLESS_PRESSING},\n`;
  output += `${indent(1)}RIMLESS_INDIVIDUAL: ${data.edging.RIMLESS_INDIVIDUAL},\n`;
  output += `${indent(1)}LINDBERG_COMPLEX: ${data.edging.LINDBERG_COMPLEX},\n`;
  output += '} as const;\n\n';

  // Add CSV metadata export for validation
  output += '/**\n';
  output += ' * CSV metadata for integrity validation\n';
  output += ' * Used to verify that generated data matches CSV source\n';
  output += ' */\n';
  output += 'export const CSV_METADATA = {\n';
  output += `${indent(1)}filePath: "${metadata.filePath.replace(/\\/g, '/')}",\n`;
  output += `${indent(1)}lastModified: "${metadata.lastModified}",\n`;
  output += `${indent(1)}fileSize: ${metadata.fileSize},\n`;
  output += `${indent(1)}lineCount: ${metadata.lineCount},\n`;
  output += `${indent(1)}checksum: "${metadata.checksum}",\n`;
  output += `${indent(1)}supportedModelsCount: ${metadata.supportedModelsCount},\n`;
  output += `${indent(1)}generatedAt: "${new Date().toISOString()}",\n`;
  output += '} as const;\n';

  return output;
}

function validateData(data: ParsedData): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required lens prices
  const requiredLenses = [
    { type: 'CLEAR', index: '1.56' },
    { type: 'CLEAR', index: '1.60' },
    { type: 'CLEAR', index: '1.67' },
    { type: 'PHOTOCHROMIC_SOLIS', index: '1.56' },
    { type: 'PHOTOCHROMIC_SOLIS', index: '1.60' },
    { type: 'PHOTOCHROMIC_SOLIS', index: '1.67' },
    { type: 'POLARIZED_NUPOLAR', index: '1.60' },
    { type: 'POLARIZED_NUPOLAR', index: '1.67' },
  ];

  for (const { type, index } of requiredLenses) {
    const prices = data.lenses[type]?.[index];
    if (!prices) {
      errors.push(`Missing ${type} ${index}`);
      continue;
    }

    // Check for required coatings
    if (type === 'CLEAR' || type === 'TINTED') {
      if (!prices.UC && type === 'CLEAR') {
        errors.push(`Missing UC price for ${type} ${index}`);
      }
      if (!prices.BLUE_PRO) {
        errors.push(`Missing BLUE_PRO price for ${type} ${index}`);
      }
      if (!prices.SERICUM_UV && type === 'TINTED') {
        warnings.push(`Missing SERICUM_UV price for ${type} ${index} (may be unavailable)`);
      }
    } else {
      // PHOTOCHROMIC_SOLIS and POLARIZED_NUPOLAR require SERICUM_UV or BLUE_PRO
      if (!prices.SERICUM_UV && !prices.BLUE_PRO) {
        errors.push(`Missing SERICUM_UV or BLUE_PRO price for ${type} ${index}`);
      }
    }
  }

  // Validate edging fees
  if (data.edging.FULL_FRAME === 0) errors.push('Missing FULL_FRAME edging fee');
  if (data.edging.NYLON_FRAME === 0) errors.push('Missing NYLON_FRAME edging fee');
  if (data.edging.RIMLESS_PRESSING === 0) errors.push('Missing RIMLESS_PRESSING edging fee');
  if (data.edging.RIMLESS_INDIVIDUAL === 0) errors.push('Missing RIMLESS_INDIVIDUAL edging fee');
  if (data.edging.LINDBERG_COMPLEX === 0) errors.push('Missing LINDBERG_COMPLEX edging fee');

  // Validate tinting fees
  if (data.tinting.FULL_TINT_CATALOG === 0) errors.push('Missing FULL_TINT_CATALOG tinting fee');
  if (data.tinting.GRADIENT === 0) errors.push('Missing GRADIENT tinting fee');

  if (warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    warnings.forEach(w => console.warn(`   ${w}`));
  }

  if (errors.length > 0) {
    console.error('❌ Validation errors:');
    errors.forEach(e => console.error(`   ${e}`));
    throw new Error(`Validation failed: ${errors.length} error(s) found`);
  }
}

function main() {
  const csvPath = path.join(process.cwd(), 'data', 'pricing', 'bod-lenses-price-list-2025.csv');
  const outputPath = path.join(process.cwd(), 'src', 'lib', 'data', 'lensPricingData.ts');

  console.log('📊 Parsing CSV file...');
  console.log(`   Source: ${csvPath}`);

  if (!fs.existsSync(csvPath)) {
    console.warn(`⚠️  CSV file not found: ${csvPath}`);
    console.warn('⚠️  Skipping pricing data generation. Pricing will be loaded from database.');
    console.warn('⚠️  If you need to regenerate pricing data, ensure the CSV file exists and run: npm run generate-pricing');
    return; // Exit gracefully instead of throwing
  }

  const { data, metadata } = parseCSV(csvPath);
  
  console.log('✅ CSV parsed successfully');
  console.log(`   - File size: ${metadata.fileSize} bytes`);
  console.log(`   - Lines: ${metadata.lineCount}`);
  console.log(`   - Last modified: ${metadata.lastModified}`);
  console.log(`   - Supported models extracted: ${metadata.supportedModelsCount}`);
  console.log('🔍 Validating data...');
  
  validateData(data);
  
  console.log('✅ Validation passed');
  console.log('📝 Generating TypeScript file...');

  const tsContent = generateTypeScript(data, metadata);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, tsContent, 'utf-8');

  console.log('✅ TypeScript file generated successfully');
  console.log(`   Output: ${outputPath}`);
  console.log('\n📋 Summary:');
  console.log(`   - Lens types: ${Object.keys(data.lenses).length}`);
  console.log(`   - Total lens models: ${Object.values(data.lenses).reduce((sum, indices) => sum + Object.keys(indices).length, 0)}`);
  console.log(`   - Edging fees: ${Object.keys(data.edging).length}`);
  console.log(`   - Tinting fees: ${Object.keys(data.tinting).length}`);
  console.log(`   - CSV checksum: ${metadata.checksum.substring(0, 16)}...`);
  console.log('\n✅ CSV is the source of truth - all pricing data comes from the CSV file');
}

main();

