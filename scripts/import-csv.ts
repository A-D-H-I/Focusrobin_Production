/**
 * BigBuy CSV → FocusRobin Import Script
 * 
 * CSV columns (semicolon-delimited):
 *  sku;name;images;video;stock_a;stock_a_days;stock_b;stock_b_days;stock_c;stock_c_days;
 *  pvd_old;pvd;pvd_dif;pvr_old;pvr;pvr_dif;category
 *
 * pvd = wholesale price (BigBuy cost price)
 * pvr = BigBuy's retail reference price → used as compareAtPrice (crossed-out MSRP)
 * We apply our own margin formula to pvd to get the actual selling price.
 */

import fs from 'fs';
import dotenv from 'dotenv';
import { PrismaClient, Gender, ProductStatus } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

// ─── Target brands (Women's category from CSV) ───────────────────────────────
const TARGET_BRANDS = [
  'Prada', 'Versace', 'Dolce & Gabbana', 'Tom Ford', 'Burberry',
  'Michael Kors', 'Armani Exchange', 'Emporio Armani', 'Armani',
  'Vogue', 'Jimmy Choo', 'Swarovski', 'Chopard', 'Carolina Herrera',
  'Carrera', 'Polaroid', 'Guess', 'Guess Marciano', 'Karl Lagerfeld',
  'Kate Spade', 'Marc Jacobs', 'Ralph Lauren', 'Tommy Hilfiger',
  'Hugo Boss', 'Lacoste', 'Calvin Klein', 'Furla', 'Longchamp',
  'Max Mara', 'Roberto Cavalli',
];

const PRODUCTS_PER_BRAND = 10;

// ─── Price Calculation (your existing margin formula) ────────────────────────
function calculateRetailPrice(basePrice: number): number {
  if (basePrice <= 0) return 0;
  let price = basePrice * 1.1 + 13.5; // 10% margin + €13.5 shipping
  price = price * 1.21;               // 21% VAT
  price = price * 1.015;              // 1.5% Stripe fee
  return Math.round(price * 100) / 100;
}

// ─── Color Extraction ─────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, { hex: string; family: string }> = {
  'black':       { hex: '#1A1A1A', family: 'Black' },
  'white':       { hex: '#FFFFFF', family: 'White' },
  'red':         { hex: '#CC0000', family: 'Red' },
  'blue':        { hex: '#1A3A8F', family: 'Blue' },
  'navy':        { hex: '#000080', family: 'Blue' },
  'green':       { hex: '#2D6A4F', family: 'Green' },
  'yellow':      { hex: '#F7C948', family: 'Yellow' },
  'brown':       { hex: '#8B4513', family: 'Brown' },
  'tortoise':    { hex: '#5C3A21', family: 'Brown' },
  'havana':      { hex: '#6B4226', family: 'Brown' },
  'grey':        { hex: '#808080', family: 'Grey' },
  'gray':        { hex: '#808080', family: 'Grey' },
  'gold':        { hex: '#C9A84C', family: 'Gold' },
  'golden':      { hex: '#C9A84C', family: 'Gold' },
  'silver':      { hex: '#A8A9AD', family: 'Silver' },
  'pink':        { hex: '#E75480', family: 'Pink' },
  'rose':        { hex: '#E75480', family: 'Pink' },
  'purple':      { hex: '#6A0572', family: 'Purple' },
  'violet':      { hex: '#7F00FF', family: 'Purple' },
  'orange':      { hex: '#E8722A', family: 'Orange' },
  'clear':       { hex: '#E8E8E8', family: 'Clear' },
  'transparent': { hex: '#E8E8E8', family: 'Clear' },
  'nude':        { hex: '#F5CBA7', family: 'Beige' },
  'beige':       { hex: '#F5F0E8', family: 'Beige' },
  'copper':      { hex: '#B87333', family: 'Brown' },
  'burgundy':    { hex: '#800020', family: 'Red' },
};

function extractColor(name: string): { colorName: string; hex: string; family: string } {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) {
      const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
      return { colorName: capitalized, ...val };
    }
  }
  return { colorName: 'Default', hex: '#1A1A1A', family: 'Other' };
}

// ─── Name Cleaning ────────────────────────────────────────────────────────────
const PREFIXES_TO_STRIP = [
  "ladies' sunglasses",
  "ladies sunglasses",
  "unisex sunglasses",
  "men's sunglasses",
  "mens sunglasses",
  "women's sunglasses",
  "womens sunglasses",
];

function cleanName(raw: string): string {
  let name = raw.trim();
  // 1. Strip known prefixes
  for (const prefix of PREFIXES_TO_STRIP) {
    if (name.toLowerCase().startsWith(prefix)) {
      name = name.slice(prefix.length).trim();
      break;
    }
  }
  // 2. Strip trailing color/size codes (e.g. 5728Z, 52807IR, Black, Golden)
  //    but preserve tokens with underscores (model variant codes like 2344_S)
  const tokens = name.split(/\s+/);
  while (tokens.length > 0) {
    const last = tokens[tokens.length - 1];
    if (last.includes('_')) break; // model variant like 2344_S → keep
    const isColorCode = /^\d{2}[A-Z0-9]{1,}/i.test(last);
    const isPlainColor = /^(black|golden|gold|white|red|blue|green|grey|gray|brown|pink|silver|nude|beige|clear|transparent|purple|violet|orange|copper|navy|ivory|rose|burgundy)$/i.test(last);
    if (isColorCode || isPlainColor) tokens.pop();
    else break;
  }
  return tokens.join(' ').trim().replace(/[-_]+$/, '');
}

// ─── Brand Extraction from Name ──────────────────────────────────────────────
function extractBrand(name: string): string {
  // Try longest match first to catch "Guess by Marciano" before "Guess"
  const sorted = [...TARGET_BRANDS].sort((a, b) => b.length - a.length);
  for (const brand of sorted) {
    if (name.toLowerCase().includes(brand.toLowerCase())) return brand;
  }
  // Fallback: second word after "Ladies'/Unisex/Men's Sunglasses"
  const parts = name.split(' ');
  if (parts.length > 2) return parts[2];
  return 'Unknown';
}

// ─── Gender Extraction ───────────────────────────────────────────────────────
function extractGender(name: string): Gender[] {
  const lower = name.toLowerCase();
  if (lower.includes("ladies'") || lower.includes("women")) return [Gender.WOMEN];
  if (lower.includes("men'") || lower.includes("men ")) return [Gender.MEN];
  if (lower.includes("unisex")) return [Gender.UNISEX];
  return [Gender.WOMEN]; // CSV is Women's catalog
}

// ─── Slug Builder ─────────────────────────────────────────────────────────────
function buildSlug(brand: string, sku: string): string {
  return (brand + '-' + sku)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── Parse CSV ────────────────────────────────────────────────────────────────
interface CSVRow {
  sku: string;
  name: string;
  imageUrl: string;
  stockA: number;
  pvd: number;   // wholesale (our base price)
  pvr: number;   // BigBuy retail reference (compare at price / MSRP)
  category: string;
}

function parseCSV(filePath: string): CSVRow[] {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(l => l.trim());
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    if (cols.length < 15) continue;

    const pvd = parseFloat(cols[11]);
    const pvr = parseFloat(cols[14]);
    if (isNaN(pvd) || pvd <= 0) continue; // skip rows without valid price

    rows.push({
      sku: cols[0].trim(),
      name: cols[1].trim(),
      imageUrl: cols[2].trim(),
      stockA: parseInt(cols[4]) || 0,
      pvd,
      pvr: isNaN(pvr) ? 0 : pvr,
      category: cols[16]?.trim().replace(/\r/g, '') || 'Sunglasses',
    });
  }
  return rows;
}

// ─── Main Import ──────────────────────────────────────────────────────────────
async function importFromCSV() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   BigBuy CSV → FocusRobin Import v1     ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // 1. Delete all existing BigBuy-sourced products
  console.log('🗑️  Deleting all existing products...');
  await prisma.product.deleteMany({});
  console.log('   Done.\n');

  // 2. Parse CSV
  const allRows = parseCSV('./products.csv');
  console.log(`📄 CSV loaded: ${allRows.length} valid rows\n`);

  // 3. Filter rows to target brands, capped at 10 each
  const brandBuckets: Record<string, CSVRow[]> = {};
  for (const brand of TARGET_BRANDS) { brandBuckets[brand] = []; }

  for (const row of allRows) {
    const brand = extractBrand(row.name);
    if (brandBuckets[brand] && brandBuckets[brand].length < PRODUCTS_PER_BRAND) {
      brandBuckets[brand].push(row);
    }
  }

  // 4. Ensure default category exists
  let defaultCat = await prisma.category.findUnique({ where: { name: 'Unisex' } });
  if (!defaultCat) {
    defaultCat = await prisma.category.create({ data: { name: 'Unisex' } });
  }

  // 5. Track what's missing
  const missing: { brand: string; found: number }[] = [];
  let totalCreated = 0;
  let totalSkipped = 0;

  // 6. Insert products
  for (const brand of TARGET_BRANDS) {
    const rows = brandBuckets[brand];
    if (rows.length === 0) {
      console.log(`❌ ${brand}: NOT FOUND in CSV`);
      missing.push({ brand, found: 0 });
      continue;
    }

    console.log(`\n✅ ${brand}: ${rows.length} product(s)`);

    for (const row of rows) {
      try {
        const slug = buildSlug(brand, row.sku);
        const gender = extractGender(row.name);
        const { colorName, hex, family } = extractColor(row.name);
        const calculatedRetailPrice = calculateRetailPrice(row.pvd);
        // pvr is BigBuy's own retail price → use as compareAtPrice (the crossed-out MSRP)
        const compareAtPrice = row.pvr > 0 ? row.pvr : null;

        await prisma.product.upsert({
          where: { slug },
          update: {},
          create: {
            name: cleanName(row.name),
            slug,
            brand,
            description: null,              // Will be filled later from BigBuy API
            basePrice: row.pvd,
            compareAtPrice,                  // BigBuy MSRP → crossed-out price
            calculatedRetailPrice,           // Our margin formula
            status: ProductStatus.PUBLISHED,
            confidenceScore: 95,             // CSV data is clean — high confidence
            gender,
            tags: [],
            // Dimensions — not in CSV, leave 0 (can be filled from API later)
            frameWidth: 0,
            lensWidth: 0,
            lensHeight: 0,
            bridgeWidth: 0,
            templeLength: 0,
            weightBg: 0,
            // Specifications — not in CSV, leave defaults
            frameMaterial: 'Unknown',
            lensMaterial: 'Polycarbonate',
            uvProtection: 'UV400',
            glassShape: null,
            isPolarized: brand === 'Polaroid',
            isUVProtection: true,
            isHydrophobic: false,
            isAntiScratch: false,
            isBioBased: false,
            warranty: `${brand} Manufacturer Warranty`,
            categoryId: defaultCat.id,
            ProductVariant: {
              create: [{
                name: colorName,
                sku: row.sku,
                colorName,
                colorHex: hex,
                colorFamily: family,
                lensColor: colorName,
                stock: row.stockA,
                ProductAsset: {
                  create: [{
                    url: row.imageUrl,
                    type: 'NO_BG',
                    isPrimary: true,
                  }],
                },
              }],
            },
          },
        });

        console.log(`   + ${row.sku}: "${row.name.substring(0, 55)}..." | €${calculatedRetailPrice} (~~€${compareAtPrice}~~) | ${colorName} | Stock:${row.stockA}`);
        totalCreated++;
      } catch (err: any) {
        console.error(`   ❌ Error on ${row.sku}:`, err.message);
        totalSkipped++;
      }
    }
  }

  // 7. Summary
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║              Import Complete!            ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`✅ Created: ${totalCreated}`);
  console.log(`❌ Skipped: ${totalSkipped}`);

  if (missing.length > 0) {
    console.log('\n⚠️  BRANDS NOT FOUND IN CSV (need to source separately):');
    missing.forEach(m => console.log(`   - ${m.brand}`));
  }

  console.log('\n📝 FIELDS LEFT EMPTY (to be filled from BigBuy API later):');
  console.log('   - description (HTML from productinformation endpoint)');
  console.log('   - frameWidth, lensWidth, lensHeight, bridgeWidth, templeLength (from product HTML)');
  console.log('   - frameMaterial (from product HTML)');
  console.log('   - glassShape (from product HTML)');
  console.log('   - Additional images (from productimages endpoint)');
}

importFromCSV()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
