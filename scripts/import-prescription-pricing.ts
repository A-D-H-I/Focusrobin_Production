/**
 * Import prescription pricing data from CSV files
 * Run with: npx ts-node scripts/import-prescription-pricing.ts [csv-file-path]
 * 
 * If no path is provided, it will look for the most recent complete CSV file
 * in data/exports/
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ParsedRow {
  type: string;
  category: string;
  item: string;
  price: number;
  unit: string;
  isActive: boolean;
  notes?: string;
}

function parseCSV(csvPath: string): ParsedRow[] {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty or has no valid data rows');
  }

  // Skip header row
  const dataLines = lines.slice(1);
  const rows: ParsedRow[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;
    
    // Parse CSV line (handle quoted values)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Add last value

    if (values.length < 6) continue; // Skip incomplete rows

    const [type, category, item, priceStr, unit, isActiveStr, notes] = values;
    
    // Skip header rows that might appear in the middle
    if (type === 'Type' || category === 'Category') continue;

    const price = parseFloat(priceStr);
    if (isNaN(price)) {
      console.warn(`⚠️  Skipping row with invalid price: ${item}`);
      continue;
    }

    rows.push({
      type: type.trim(),
      category: category.trim(),
      item: item.trim(),
      price,
      unit: unit.trim(),
      isActive: isActiveStr.trim().toLowerCase() === 'yes',
      notes: notes?.trim(),
    });
  }

  return rows;
}

async function importPrescriptionPricing(csvPath: string) {
  console.log('📥 Importing prescription pricing data from CSV...\n');
  console.log(`   Source: ${csvPath}\n`);

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  const rows = parseCSV(csvPath);
  console.log(`   Found ${rows.length} pricing entries\n`);

  // Clear existing data
  console.log('  → Clearing existing pricing data...');
  await prisma.prescriptionLensPrice.deleteMany({});
  await prisma.prescriptionTintFee.deleteMany({});
  await prisma.prescriptionEdgingFee.deleteMany({});
  await prisma.prescriptionProfit.deleteMany({});
  console.log('  ✓ Existing data cleared\n');

  let lensCount = 0;
  let tintCount = 0;
  let edgingCount = 0;
  let profitCount = 0;

  // Process rows
  for (const row of rows) {
    try {
      if (row.type === 'Lens Price') {
        // Parse: "1.56 - UC" or "1.67 - BLUE_PRO"
        const parts = row.item.split(' - ');
        if (parts.length !== 2) {
          console.warn(`⚠️  Skipping invalid lens price format: ${row.item}`);
          continue;
        }

        const [lensIndex, coating] = parts;
        const lensType = row.category;

        await prisma.prescriptionLensPrice.create({
          data: {
            lensType,
            lensIndex: lensIndex.trim(),
            coating: coating.trim(),
            price: row.price,
            isActive: row.isActive,
          },
        });
        lensCount++;
        console.log(`    ✓ ${lensType} ${lensIndex} ${coating}: €${row.price.toFixed(2)}`);

      } else if (row.type === 'Tint Fee') {
        await prisma.prescriptionTintFee.create({
          data: {
            tintType: row.item,
            price: row.price,
            isActive: row.isActive,
          },
        });
        tintCount++;
        console.log(`    ✓ ${row.item}: €${row.price.toFixed(2)}`);

      } else if (row.type === 'Edging Fee') {
        await prisma.prescriptionEdgingFee.create({
          data: {
            frameType: row.item,
            price: row.price,
            isActive: row.isActive,
          },
        });
        edgingCount++;
        console.log(`    ✓ ${row.item}: €${row.price.toFixed(2)}`);

      } else if (row.type === 'Fixed Profit') {
        await prisma.prescriptionProfit.create({
          data: {
            profit: row.price,
            isActive: row.isActive,
          },
        });
        profitCount++;
        console.log(`    ✓ Fixed Profit: €${row.price.toFixed(2)}`);
      }
    } catch (error) {
      console.error(`    ❌ Error importing ${row.type} - ${row.item}:`, error);
    }
  }

  console.log('\n✅ Import completed successfully!\n');
  console.log('📋 Summary:');
  console.log(`   - Lens prices: ${lensCount}`);
  console.log(`   - Tint fees: ${tintCount}`);
  console.log(`   - Edging fees: ${edgingCount}`);
  console.log(`   - Fixed profit: ${profitCount}`);
  console.log('');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  let csvPath: string;

  if (args.length > 0) {
    // Use provided path
    csvPath = path.resolve(args[0]);
  } else {
    // Find most recent complete CSV file
    const exportsDir = path.join(process.cwd(), 'data', 'exports');
    if (!fs.existsSync(exportsDir)) {
      throw new Error('Exports directory not found. Please provide a CSV file path.');
    }

    const files = fs.readdirSync(exportsDir)
      .filter(file => file.startsWith('prescription-pricing-complete-') && file.endsWith('.csv'))
      .sort()
      .reverse(); // Most recent first

    if (files.length === 0) {
      throw new Error('No prescription pricing CSV files found. Please provide a CSV file path.');
    }

    csvPath = path.join(exportsDir, files[0]);
    console.log(`📁 Using most recent export: ${files[0]}\n`);
  }

  await importPrescriptionPricing(csvPath);
}

main()
  .catch((error) => {
    console.error('\n❌ Error importing pricing data:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

