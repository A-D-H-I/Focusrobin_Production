/**
 * Seed prescription pricing data
 * Based on BOD Lenses Price List 2025 and Prescription Glasses Pricing Breakdown PDF
 * 
 * IMPORTANT: Prices are per SINGLE lens (pair price = single × 2)
 * 
 * Available UI Combinations:
 * - CLEAR: 1.56, 1.60, 1.67 with UC, BLUE_PRO
 * - TINTED: 1.56, 1.60, 1.67 with SERICUM_UV only
 * - PHOTOCHROMIC_SOLIS: 1.56, 1.60, 1.67 with SERICUM_UV, BLUE_PRO
 * - POLARIZED_NUPOLAR: 1.60, 1.67 only (no 1.56) with SERICUM_UV only
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// LENS PRICES (per SINGLE lens) from PDF
// ============================================================================

const LENS_PRICE_SINGLE: Record<string, Record<string, Record<string, number>>> = {
  // CLEAR lenses - UC and BLUE_PRO available
  CLEAR: {
    "1.56": { UC: 8.49, BLUE_PRO: 14.49, SERICUM_UV: 14.49 },
    "1.60": { UC: 16.98, BLUE_PRO: 22.98, SERICUM_UV: 22.98 },
    "1.67": { UC: 25.07, BLUE_PRO: 31.07, SERICUM_UV: 31.07 },
  },
  // TINTED lenses - same base price as CLEAR, but only SERICUM_UV shown in UI
  TINTED: {
    "1.56": { UC: 8.49, BLUE_PRO: 14.49, SERICUM_UV: 14.49 },
    "1.60": { UC: 16.98, BLUE_PRO: 22.98, SERICUM_UV: 22.98 },
    "1.67": { UC: 25.07, BLUE_PRO: 31.07, SERICUM_UV: 31.07 },
  },
  // PHOTOCHROMIC_SOLIS lenses - SERICUM_UV and BLUE_PRO available
  PHOTOCHROMIC_SOLIS: {
    "1.56": { UC: 13.53, BLUE_PRO: 19.53, SERICUM_UV: 19.53 },
    "1.60": { UC: 24.66, BLUE_PRO: 30.66, SERICUM_UV: 30.66 },
    "1.67": { UC: 32.90, BLUE_PRO: 38.90, SERICUM_UV: 38.90 },
  },
  // POLARIZED_NUPOLAR lenses - NO 1.56, only SERICUM_UV shown in UI
  POLARIZED_NUPOLAR: {
    // Note: 1.56 NOT available for polarized
    "1.60": { UC: 35.98, BLUE_PRO: 41.98, SERICUM_UV: 41.98 },
    "1.67": { UC: 58.62, BLUE_PRO: 64.62, SERICUM_UV: 64.62 },
  },
};

// ============================================================================
// TINT FEES (per PAIR) from PDF
// ============================================================================

const TINT_FEES_PAIR: Record<string, number> = {
  FULL_TINT_CATALOG: 6.00,  // €3 per lens × 2
  GRADIENT: 8.00,           // €4 per lens × 2
};

// ============================================================================
// EDGING FEES (per ORDER) from PDF
// ============================================================================

const EDGING_FEES: Record<string, number> = {
  FULL_FRAME: 4.60,
  NYLON_FRAME: 5.90,
  RIMLESS_PRESSING: 12.00,
  RIMLESS_INDIVIDUAL: 20.00,
  LINDBERG_COMPLEX: 20.00,
};

// ============================================================================
// FIXED PROFIT from PDF
// ============================================================================

const FIXED_PROFIT = 15.00;

// ============================================================================
// SEED FUNCTION
// ============================================================================

async function seedPrescriptionPricing() {
  console.log('🌱 Seeding prescription pricing data from PDF...');
  console.log('');

  // Clear existing data first
  console.log('  → Clearing existing pricing data...');
  await prisma.prescriptionLensPrice.deleteMany({});
  await prisma.prescriptionTintFee.deleteMany({});
  await prisma.prescriptionEdgingFee.deleteMany({});
  await prisma.prescriptionProfit.deleteMany({});
  console.log('  ✓ Existing data cleared');
  console.log('');

  // Seed lens prices
  console.log('  → Seeding lens prices (per single lens)...');
  let lensCount = 0;
  for (const [lensType, indices] of Object.entries(LENS_PRICE_SINGLE)) {
    for (const [lensIndex, coatings] of Object.entries(indices)) {
      for (const [coating, price] of Object.entries(coatings)) {
        await prisma.prescriptionLensPrice.create({
          data: {
            lensType,
            lensIndex,
            coating,
            price,
            isActive: true,
          },
        });
        lensCount++;
        console.log(`    ${lensType} ${lensIndex} ${coating}: €${price.toFixed(2)}`);
      }
    }
  }
  console.log(`  ✓ ${lensCount} lens prices seeded`);
  console.log('');

  // Seed tint fees
  console.log('  → Seeding tint fees (per pair)...');
  for (const [tintType, price] of Object.entries(TINT_FEES_PAIR)) {
    await prisma.prescriptionTintFee.create({
      data: {
        tintType,
        price,
        isActive: true,
      },
    });
    console.log(`    ${tintType}: €${price.toFixed(2)}`);
  }
  console.log(`  ✓ ${Object.keys(TINT_FEES_PAIR).length} tint fees seeded`);
  console.log('');

  // Seed edging fees
  console.log('  → Seeding edging fees (per order)...');
  for (const [frameType, price] of Object.entries(EDGING_FEES)) {
    await prisma.prescriptionEdgingFee.create({
      data: {
        frameType,
        price,
        isActive: true,
      },
    });
    console.log(`    ${frameType}: €${price.toFixed(2)}`);
  }
  console.log(`  ✓ ${Object.keys(EDGING_FEES).length} edging fees seeded`);
  console.log('');

  // Seed fixed profit
  console.log('  → Seeding fixed profit...');
  await prisma.prescriptionProfit.create({
    data: {
      profit: FIXED_PROFIT,
      isActive: true,
    },
  });
  console.log(`    Fixed Profit: €${FIXED_PROFIT.toFixed(2)}`);
  console.log('  ✓ Fixed profit seeded');
  console.log('');

  console.log('✅ Prescription pricing data seeded successfully!');
  console.log('');
  console.log('📋 Summary:');
  console.log('  - Lens prices are per SINGLE lens (multiply by 2 for pair)');
  console.log('  - Tint fees are per PAIR');
  console.log('  - Edging fees are per ORDER');
  console.log('  - Fixed profit is added to total');
  console.log('');
  console.log('💰 Final Price Formula:');
  console.log('  Total = (Single Lens × 2) + Tint Fee + Edging Fee + €15 Profit');
}

seedPrescriptionPricing()
  .catch((e) => {
    console.error('❌ Error seeding prescription pricing:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
