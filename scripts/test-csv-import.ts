import { PrismaClient, Gender, ProductStatus } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

function calculateRetailPrice(basePrice: number): number {
  if (basePrice <= 0) return 0;
  let price = basePrice * 1.1 + 13.5;
  price = price * 1.21;
  price = price * 1.015;
  return Math.round(price * 100) / 100;
}

const COLOR_MAP: Record<string, { hex: string; family: string }> = {
  'black': { hex: '#1A1A1A', family: 'Black' },
  'white': { hex: '#FFFFFF', family: 'White' },
  'red': { hex: '#CC0000', family: 'Red' },
  'blue': { hex: '#1A3A8F', family: 'Blue' },
  'brown': { hex: '#8B4513', family: 'Brown' },
  'grey': { hex: '#808080', family: 'Grey' },
  'gray': { hex: '#808080', family: 'Grey' },
  'gold': { hex: '#C9A84C', family: 'Gold' },
  'golden': { hex: '#C9A84C', family: 'Gold' },
  'silver': { hex: '#A8A9AD', family: 'Silver' },
  'pink': { hex: '#E75480', family: 'Pink' },
  'green': { hex: '#2D6A4F', family: 'Green' },
};

function extractColor(name: string) {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return { colorName: key.charAt(0).toUpperCase() + key.slice(1), ...val };
  }
  return { colorName: 'Default', hex: '#1A1A1A', family: 'Other' };
}

const PREFIXES_TO_STRIP = [
  "ladies' sunglasses", "ladies sunglasses", "unisex sunglasses",
  "men's sunglasses", "mens sunglasses", "women's sunglasses", "womens sunglasses",
  "ladies' spectacle frame", "ladies spectacle frame", "unisex spectacle frame",
  "men's spectacle frame", "mens spectacle frame",
];

function cleanName(raw: string): string {
  let name = raw.trim();
  for (const prefix of PREFIXES_TO_STRIP) {
    if (name.toLowerCase().startsWith(prefix)) { name = name.slice(prefix.length).trim(); break; }
  }
  if (name.includes('::')) name = name.replace('::', ' ');
  const tokens = name.split(/\s+/);
  while (tokens.length > 0) {
    const last = tokens[tokens.length - 1];
    if (last.includes('_')) break;
    if (/^\d{2}[A-Z0-9]{1,}/i.test(last) || /^(black|golden|gold|white|red|blue|green|grey|gray|brown|pink|silver)$/i.test(last)) tokens.pop();
    else break;
  }
  return tokens.join(' ').trim().replace(/[-_]+$/, '');
}

function extractBrand(raw: string): string {
  if (raw.includes('::')) return raw.split('::')[0].trim();
  const name = cleanName(raw);
  const tokens = name.split(' ');
  const brandTokens: string[] = [];
  for (const token of tokens) {
    if (/\d/.test(token)) break;
    if (/^[A-Z]{2,}$/.test(token) && brandTokens.length > 0) break;
    brandTokens.push(token);
  }
  return brandTokens.join(' ').trim() || 'Unknown';
}

function buildSlug(brand: string, sku: string): string {
  return (brand + '-' + sku).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  const csvPath = '/Users/hariharanadaikkappan/Focusrobin/Focusrobin_Production/products_cleaned.csv';
  const text = fs.readFileSync(csvPath, 'utf8');
  const lines = text.split('\n').filter(l => l.trim());

  // Parse all rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    if (cols.length < 15) continue;
    const pvd = parseFloat(cols[11]);
    const pvr = parseFloat(cols[14]);
    if (isNaN(pvd) || pvd <= 0) continue;
    rows.push({
      sku: cols[0]?.trim() || '',
      name: cols[1]?.trim() || '',
      imageUrl: cols[2]?.trim() || '',
      stockA: parseInt(cols[4]) || 0,
      pvd,
      pvr: isNaN(pvr) ? 0 : pvr,
    });
  }
  console.log(`Parsed ${rows.length} valid rows\n`);

  // Group by brand
  const brandBuckets: Record<string, typeof rows> = {};
  for (const row of rows) {
    const brand = extractBrand(row.name);
    if (!brandBuckets[brand]) brandBuckets[brand] = [];
    brandBuckets[brand].push(row);
  }

  console.log('Brands found:');
  const sortedBrands = Object.entries(brandBuckets).sort((a, b) => b[1].length - a[1].length);
  for (const [brand, bRows] of sortedBrands) {
    console.log(`  ${brand}: ${bRows.length} products`);
  }

  // Pick first 3 brands, 3 products each
  const testBrands = sortedBrands.slice(0, 3).map(([b]) => b);
  const LIMIT = 3;
  console.log(`\n--- Importing ${testBrands.join(', ')} (${LIMIT} each) ---`);

  let defaultCat = await prisma.category.findUnique({ where: { name: 'Unisex' } });
  if (!defaultCat) {
    defaultCat = await prisma.category.create({ data: { name: 'Unisex' } });
  }

  let created = 0, skipped = 0;

  for (const brand of testBrands) {
    const brandRows = brandBuckets[brand].slice(0, LIMIT);
    let brandCount = 0;

    for (const row of brandRows) {
      try {
        const slug = buildSlug(brand, row.sku);
        const { colorName, hex, family } = extractColor(row.name);
        const calculatedRetailPrice = calculateRetailPrice(row.pvd);
        const compareAtPrice = row.pvr > 0 ? row.pvr : null;
        const productName = cleanName(row.name);

        await prisma.product.upsert({
          where: { slug },
          update: {},
          create: {
            name: productName,
            slug,
            brand,
            description: null,
            basePrice: row.pvd,
            compareAtPrice,
            calculatedRetailPrice,
            status: ProductStatus.PUBLISHED,
            confidenceScore: 95,
            gender: [Gender.WOMEN],
            tags: [],
            frameWidth: 0, lensWidth: 0, lensHeight: 0, bridgeWidth: 0, templeLength: 0,
            weightBg: 0,
            frameMaterial: 'Unknown',
            lensMaterial: 'Polycarbonate',
            uvProtection: 'UV400',
            glassShape: null,
            isPolarized: brand === 'Polaroid',
            isUVProtection: true,
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
                  create: row.imageUrl ? [{ url: row.imageUrl, type: 'NO_BG' as const, isPrimary: true }] : [],
                },
              }],
            },
          },
        });
        created++;
        brandCount++;
        console.log(`  ✅ ${brand} | ${productName} | ${slug}`);
      } catch (err: any) {
        skipped++;
        console.error(`  ❌ ${brand} | ${row.sku}: ${err.message}`);
      }
    }
    console.log(`  → ${brand}: ${brandCount} created`);
  }

  console.log(`\n=== DONE: ${created} created, ${skipped} skipped ===`);

  // Verify
  const count = await prisma.product.count();
  console.log(`Total products in DB: ${count}`);

  await prisma.$disconnect();
}

main();
