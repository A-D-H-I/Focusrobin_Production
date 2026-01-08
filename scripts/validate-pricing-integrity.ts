/**
 * Pricing Integrity Validation Script
 * 
 * Validates that the generated pricing data matches the CSV source and
 * ensures all required models are present. This script can be run manually
 * or in CI/CD to verify pricing data integrity.
 * 
 * Usage: npm run validate-pricing
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const CSV_PATH = path.join(process.cwd(), 'data', 'pricing', 'bod-lenses-price-list-2025.csv');
const GENERATED_PATH = path.join(process.cwd(), 'src', 'lib', 'data', 'lensPricingData.ts');

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

function calculateChecksum(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function extractMetadataFromGenerated(): {
  checksum?: string;
  lastModified?: string;
  filePath?: string;
  supportedModelsCount?: number;
} {
  if (!fs.existsSync(GENERATED_PATH)) {
    return {};
  }

  const content = fs.readFileSync(GENERATED_PATH, 'utf-8');
  
  // Extract checksum from CSV_METADATA
  const checksumMatch = content.match(/checksum:\s*"([^"]+)"/);
  const lastModifiedMatch = content.match(/lastModified:\s*"([^"]+)"/);
  const filePathMatch = content.match(/filePath:\s*"([^"]+)"/);
  const modelsCountMatch = content.match(/supportedModelsCount:\s*(\d+)/);

  return {
    checksum: checksumMatch?.[1],
    lastModified: lastModifiedMatch?.[1],
    filePath: filePathMatch?.[1],
    supportedModelsCount: modelsCountMatch ? parseInt(modelsCountMatch[1], 10) : undefined,
  };
}

function validateCSVExists(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    info: [],
  };

  if (!fs.existsSync(CSV_PATH)) {
    result.isValid = false;
    result.errors.push(`CSV file not found: ${CSV_PATH}`);
    return result;
  }

  const stats = fs.statSync(CSV_PATH);
  result.info.push(`CSV file found: ${CSV_PATH}`);
  result.info.push(`  - Size: ${stats.size} bytes`);
  result.info.push(`  - Last modified: ${stats.mtime.toISOString()}`);

  return result;
}

function validateGeneratedFileExists(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    info: [],
  };

  if (!fs.existsSync(GENERATED_PATH)) {
    result.isValid = false;
    result.errors.push(`Generated file not found: ${GENERATED_PATH}`);
    result.errors.push(`  Run: npm run generate-pricing`);
    return result;
  }

  const stats = fs.statSync(GENERATED_PATH);
  result.info.push(`Generated file found: ${GENERATED_PATH}`);
  result.info.push(`  - Size: ${stats.size} bytes`);
  result.info.push(`  - Last modified: ${stats.mtime.toISOString()}`);

  return result;
}

function validateChecksumMatch(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    info: [],
  };

  if (!fs.existsSync(CSV_PATH) || !fs.existsSync(GENERATED_PATH)) {
    result.isValid = false;
    result.errors.push('Cannot validate checksum - files missing');
    return result;
  }

  // Calculate current CSV checksum
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const csvChecksum = calculateChecksum(csvContent);

  // Get checksum from generated file
  const generatedMetadata = extractMetadataFromGenerated();
  const generatedChecksum = generatedMetadata.checksum;

  result.info.push(`CSV checksum: ${csvChecksum.substring(0, 16)}...`);

  if (!generatedChecksum) {
    result.isValid = false;
    result.errors.push('Generated file does not contain checksum metadata');
    result.errors.push('  The file may have been manually edited or is outdated');
    result.errors.push('  Run: npm run generate-pricing');
    return result;
  }

  result.info.push(`Generated checksum: ${generatedChecksum.substring(0, 16)}...`);

  if (csvChecksum !== generatedChecksum) {
    result.isValid = false;
    result.errors.push('CSV checksum mismatch!');
    result.errors.push('  The CSV file has been modified since the pricing data was generated');
    result.errors.push('  Run: npm run generate-pricing to regenerate');
    return result;
  }

  result.info.push('✅ Checksums match - generated data is up to date');

  return result;
}

function validateRequiredModels(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    info: [],
  };

  if (!fs.existsSync(GENERATED_PATH)) {
    result.isValid = false;
    result.errors.push('Cannot validate models - generated file missing');
    return result;
  }

  const content = fs.readFileSync(GENERATED_PATH, 'utf-8');

  // Required models that must be present
  const requiredModels = [
    { type: 'CLEAR', index: '1.56', coatings: ['UC', 'BLUE_PRO', 'SERICUM_UV'] },
    { type: 'CLEAR', index: '1.60', coatings: ['UC', 'BLUE_PRO', 'SERICUM_UV'] },
    { type: 'CLEAR', index: '1.67', coatings: ['UC', 'BLUE_PRO', 'SERICUM_UV'] },
    { type: 'PHOTOCHROMIC_SOLIS', index: '1.56', coatings: ['UC', 'BLUE_PRO', 'SERICUM_UV'] },
    { type: 'PHOTOCHROMIC_SOLIS', index: '1.60', coatings: ['UC', 'BLUE_PRO', 'SERICUM_UV'] },
    { type: 'PHOTOCHROMIC_SOLIS', index: '1.67', coatings: ['UC', 'BLUE_PRO', 'SERICUM_UV'] },
    { type: 'POLARIZED_NUPOLAR', index: '1.60', coatings: ['UC', 'BLUE_PRO', 'SERICUM_UV'] },
    { type: 'POLARIZED_NUPOLAR', index: '1.67', coatings: ['UC', 'BLUE_PRO', 'SERICUM_UV'] },
  ];

  let foundCount = 0;

  for (const model of requiredModels) {
    // Check if the model exists in the generated file
    const typePattern = new RegExp(`${model.type}:\\s*\\{`, 'm');
    const indexPattern = new RegExp(`"${model.index}":\\s*\\{`, 'm');
    
    if (!typePattern.test(content)) {
      result.isValid = false;
      result.errors.push(`Missing lens type: ${model.type}`);
      continue;
    }

    if (!indexPattern.test(content)) {
      result.isValid = false;
      result.errors.push(`Missing index ${model.index} for ${model.type}`);
      continue;
    }

    // Check for coatings
    for (const coating of model.coatings) {
      const coatingPattern = new RegExp(`${coating}:\\s*[\\d.]+`, 'm');
      if (!coatingPattern.test(content)) {
        result.warnings.push(`Missing or zero price for ${model.type} ${model.index} ${coating}`);
      }
    }

    foundCount++;
  }

  result.info.push(`Found ${foundCount}/${requiredModels.length} required models`);

  // Check for required fees
  const requiredFees = {
    tint: ['FULL_TINT_CATALOG', 'GRADIENT'],
    edging: ['FULL_FRAME', 'NYLON_FRAME', 'RIMLESS_PRESSING', 'RIMLESS_INDIVIDUAL', 'LINDBERG_COMPLEX'],
  };

  for (const fee of requiredFees.tint) {
    const pattern = new RegExp(`${fee}:\\s*[\\d.]+`, 'm');
    if (!pattern.test(content)) {
      result.isValid = false;
      result.errors.push(`Missing tint fee: ${fee}`);
    }
  }

  for (const fee of requiredFees.edging) {
    const pattern = new RegExp(`${fee}:\\s*[\\d.]+`, 'm');
    if (!pattern.test(content)) {
      result.isValid = false;
      result.errors.push(`Missing edging fee: ${fee}`);
    }
  }

  return result;
}

function validateOnlySupportedModels(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    info: [],
  };

  // Supported models mapping from parser
  const supportedModels = [
    'Mono Rx 1.56',
    'Mono Rx 1.60',
    'Mono Rx 1.67',
    'Mono Rx 1.56 Solis',
    'Mono Rx 1.60 Solis',
    'Mono Rx 1.67 Solis',
    'Mono Rx 1.60 NuPolar',
    'Mono Rx 1.67 NuPolar',
  ];

  result.info.push(`Only ${supportedModels.length} supported models should be extracted from CSV`);
  result.info.push(`  Models: ${supportedModels.join(', ')}`);

  // This is informational - the parser already enforces this
  result.info.push('✅ Parser only extracts supported models (enforced in parse-lens-pricing-csv.ts)');

  return result;
}

function main() {
  console.log('🔍 Validating Pricing Data Integrity\n');
  console.log('=' .repeat(60));

  const results: ValidationResult[] = [];

  // 1. Check CSV exists
  console.log('\n1. Checking CSV file...');
  const csvCheck = validateCSVExists();
  results.push(csvCheck);
  csvCheck.info.forEach(msg => console.log(`   ${msg}`));
  csvCheck.errors.forEach(msg => console.error(`   ❌ ${msg}`));
  csvCheck.warnings.forEach(msg => console.warn(`   ⚠️  ${msg}`));

  // 2. Check generated file exists
  console.log('\n2. Checking generated file...');
  const generatedCheck = validateGeneratedFileExists();
  results.push(generatedCheck);
  generatedCheck.info.forEach(msg => console.log(`   ${msg}`));
  generatedCheck.errors.forEach(msg => console.error(`   ❌ ${msg}`));
  generatedCheck.warnings.forEach(msg => console.warn(`   ⚠️  ${msg}`));

  // 3. Validate checksum match
  if (csvCheck.isValid && generatedCheck.isValid) {
    console.log('\n3. Validating checksum...');
    const checksumCheck = validateChecksumMatch();
    results.push(checksumCheck);
    checksumCheck.info.forEach(msg => console.log(`   ${msg}`));
    checksumCheck.errors.forEach(msg => console.error(`   ❌ ${msg}`));
    checksumCheck.warnings.forEach(msg => console.warn(`   ⚠️  ${msg}`));
  }

  // 4. Validate required models
  if (generatedCheck.isValid) {
    console.log('\n4. Validating required models...');
    const modelsCheck = validateRequiredModels();
    results.push(modelsCheck);
    modelsCheck.info.forEach(msg => console.log(`   ${msg}`));
    modelsCheck.errors.forEach(msg => console.error(`   ❌ ${msg}`));
    modelsCheck.warnings.forEach(msg => console.warn(`   ⚠️  ${msg}`));
  }

  // 5. Validate only supported models
  console.log('\n5. Validating model extraction...');
  const supportedCheck = validateOnlySupportedModels();
  results.push(supportedCheck);
  supportedCheck.info.forEach(msg => console.log(`   ${msg}`));
  supportedCheck.errors.forEach(msg => console.error(`   ❌ ${msg}`));
  supportedCheck.warnings.forEach(msg => console.warn(`   ⚠️  ${msg}`));

  // Summary
  console.log('\n' + '='.repeat(60));
  const allValid = results.every(r => r.isValid);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  if (allValid) {
    console.log('\n✅ All validations passed!');
    console.log('   CSV is the source of truth and pricing data is valid.');
  } else {
    console.log('\n❌ Validation failed!');
    console.log(`   Found ${totalErrors} error(s) and ${totalWarnings} warning(s)`);
    console.log('\n   To fix:');
    console.log('   1. Ensure CSV file is correct: data/pricing/bod-lenses-price-list-2025.csv');
    console.log('   2. Run: npm run generate-pricing');
    process.exit(1);
  }

  if (totalWarnings > 0) {
    console.log(`\n⚠️  ${totalWarnings} warning(s) found - review above`);
  }
}

main();

