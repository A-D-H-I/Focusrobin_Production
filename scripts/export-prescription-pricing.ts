/**
 * Export prescription pricing data to CSV
 * Run with: npx ts-node scripts/export-prescription-pricing.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Helper to escape CSV values
function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function exportPrescriptionPricing() {
  console.log('📊 Exporting prescription pricing data...\n');

  try {
    // Fetch all pricing data
    const [lensPrices, tintFees, edgingFees, profit] = await Promise.all([
      prisma.prescriptionLensPrice.findMany({
        orderBy: [
          { lensType: 'asc' },
          { lensIndex: 'asc' },
          { coating: 'asc' },
        ],
      }),
      prisma.prescriptionTintFee.findMany({
        orderBy: { tintType: 'asc' },
      }),
      prisma.prescriptionEdgingFee.findMany({
        orderBy: { frameType: 'asc' },
      }),
      prisma.prescriptionProfit.findFirst({
        where: { isActive: true },
      }),
    ]);

    const outputDir = path.join(process.cwd(), 'data', 'exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');

    // ============================================================================
    // Export Lens Prices
    // ============================================================================
    console.log('  → Exporting lens prices...');
    const lensPricesCsv: string[] = [];
    lensPricesCsv.push('Lens Type,Lens Index,Coating,Price (EUR per Single Lens),Pair Price (EUR),Is Active');
    
    for (const price of lensPrices) {
      const pairPrice = Number(price.price) * 2;
      lensPricesCsv.push([
        escapeCSV(price.lensType),
        escapeCSV(price.lensIndex),
        escapeCSV(price.coating),
        escapeCSV(Number(price.price).toFixed(2)),
        escapeCSV(pairPrice.toFixed(2)),
        escapeCSV(price.isActive ? 'Yes' : 'No'),
      ].join(','));
    }

    const lensPricesPath = path.join(outputDir, `prescription-lens-prices-${timestamp}.csv`);
    fs.writeFileSync(lensPricesPath, lensPricesCsv.join('\n'), 'utf-8');
    console.log(`  ✓ Exported ${lensPrices.length} lens prices to: ${lensPricesPath}`);

    // ============================================================================
    // Export Tint Fees
    // ============================================================================
    console.log('  → Exporting tint fees...');
    const tintFeesCsv: string[] = [];
    tintFeesCsv.push('Tint Type,Price (EUR per Pair),Is Active');
    
    for (const fee of tintFees) {
      tintFeesCsv.push([
        escapeCSV(fee.tintType),
        escapeCSV(Number(fee.price).toFixed(2)),
        escapeCSV(fee.isActive ? 'Yes' : 'No'),
      ].join(','));
    }

    const tintFeesPath = path.join(outputDir, `prescription-tint-fees-${timestamp}.csv`);
    fs.writeFileSync(tintFeesPath, tintFeesCsv.join('\n'), 'utf-8');
    console.log(`  ✓ Exported ${tintFees.length} tint fees to: ${tintFeesPath}`);

    // ============================================================================
    // Export Edging Fees
    // ============================================================================
    console.log('  → Exporting edging fees...');
    const edgingFeesCsv: string[] = [];
    edgingFeesCsv.push('Frame Type,Price (EUR per Order),Is Active');
    
    for (const fee of edgingFees) {
      edgingFeesCsv.push([
        escapeCSV(fee.frameType),
        escapeCSV(Number(fee.price).toFixed(2)),
        escapeCSV(fee.isActive ? 'Yes' : 'No'),
      ].join(','));
    }

    const edgingFeesPath = path.join(outputDir, `prescription-edging-fees-${timestamp}.csv`);
    fs.writeFileSync(edgingFeesPath, edgingFeesCsv.join('\n'), 'utf-8');
    console.log(`  ✓ Exported ${edgingFees.length} edging fees to: ${edgingFeesPath}`);

    // ============================================================================
    // Export Fixed Profit
    // ============================================================================
    console.log('  → Exporting fixed profit...');
    const profitCsv: string[] = [];
    profitCsv.push('Name,Profit (EUR),Is Active');
    
    if (profit) {
      profitCsv.push([
        escapeCSV('FIXED_PROFIT'),
        escapeCSV(Number(profit.profit).toFixed(2)),
        escapeCSV(profit.isActive ? 'Yes' : 'No'),
      ].join(','));
    }

    const profitPath = path.join(outputDir, `prescription-profit-${timestamp}.csv`);
    fs.writeFileSync(profitPath, profitCsv.join('\n'), 'utf-8');
    console.log(`  ✓ Exported fixed profit to: ${profitPath}`);

    // ============================================================================
    // Export Combined CSV (All pricing in one file)
    // ============================================================================
    console.log('  → Creating combined export...');
    const combinedCsv: string[] = [];
    
    // Header
    combinedCsv.push('Type,Category,Item,Price (EUR),Unit,Is Active,Notes');
    combinedCsv.push('');

    // Lens Prices Section
    combinedCsv.push('# LENS PRICES (Per Single Lens)');
    combinedCsv.push('Type,Category,Item,Price (EUR),Unit,Is Active,Notes');
    for (const price of lensPrices) {
      const pairPrice = Number(price.price) * 2;
      combinedCsv.push([
        'Lens Price',
        escapeCSV(price.lensType),
        escapeCSV(`${price.lensIndex} - ${price.coating}`),
        escapeCSV(Number(price.price).toFixed(2)),
        'Per Single Lens',
        escapeCSV(price.isActive ? 'Yes' : 'No'),
        escapeCSV(`Pair price: €${pairPrice.toFixed(2)}`),
      ].join(','));
    }
    combinedCsv.push('');

    // Tint Fees Section
    combinedCsv.push('# TINT FEES (Per Pair)');
    combinedCsv.push('Type,Category,Item,Price (EUR),Unit,Is Active,Notes');
    for (const fee of tintFees) {
      combinedCsv.push([
        'Tint Fee',
        'Tinting',
        escapeCSV(fee.tintType),
        escapeCSV(Number(fee.price).toFixed(2)),
        'Per Pair',
        escapeCSV(fee.isActive ? 'Yes' : 'No'),
        '',
      ].join(','));
    }
    combinedCsv.push('');

    // Edging Fees Section
    combinedCsv.push('# EDGING FEES (Per Order)');
    combinedCsv.push('Type,Category,Item,Price (EUR),Unit,Is Active,Notes');
    for (const fee of edgingFees) {
      combinedCsv.push([
        'Edging Fee',
        'Frame Mounting',
        escapeCSV(fee.frameType),
        escapeCSV(Number(fee.price).toFixed(2)),
        'Per Order',
        escapeCSV(fee.isActive ? 'Yes' : 'No'),
        '',
      ].join(','));
    }
    combinedCsv.push('');

    // Fixed Profit Section
    combinedCsv.push('# FIXED PROFIT (Per Order)');
    combinedCsv.push('Type,Category,Item,Price (EUR),Unit,Is Active,Notes');
    if (profit) {
      combinedCsv.push([
        'Fixed Profit',
        'Profit Margin',
        escapeCSV('FIXED_PROFIT'),
        escapeCSV(Number(profit.profit).toFixed(2)),
        'Per Order',
        escapeCSV(profit.isActive ? 'Yes' : 'No'),
        'Added to total Rx cost',
      ].join(','));
    }

    const combinedPath = path.join(outputDir, `prescription-pricing-complete-${timestamp}.csv`);
    fs.writeFileSync(combinedPath, combinedCsv.join('\n'), 'utf-8');
    console.log(`  ✓ Combined export created: ${combinedPath}`);

    console.log('\n✅ Export completed successfully!');
    console.log('\n📋 Files created:');
    console.log(`  1. ${lensPricesPath}`);
    console.log(`  2. ${tintFeesPath}`);
    console.log(`  3. ${edgingFeesPath}`);
    console.log(`  4. ${profitPath}`);
    console.log(`  5. ${combinedPath}`);
    console.log('\n💡 Use the combined file for easy import after deployment.');
    console.log('   Individual files are available for specific data types.\n');

  } catch (error) {
    console.error('❌ Error exporting pricing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

exportPrescriptionPricing()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

