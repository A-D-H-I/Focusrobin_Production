import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ─── Price Calculation ────────────────────────────────────────────────────────
function calculateRetailPrice(basePrice: number): number {
  if (basePrice <= 0) return 0;
  let price = basePrice * 1.1 + 13.5;
  price = price * 1.21;
  price = price * 1.015;
  return Math.round(price * 100) / 100;
}

// ─── Color Map ────────────────────────────────────────────────────────────────
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
      return { colorName: key.charAt(0).toUpperCase() + key.slice(1), ...val };
    }
  }
  return { colorName: 'Default', hex: '#1A1A1A', family: 'Other' };
}

// ─── Name Cleaning ────────────────────────────────────────────────────────────
const PREFIXES_TO_STRIP = [
  "ladies' sunglasses", "ladies sunglasses", "unisex sunglasses",
  "men's sunglasses", "mens sunglasses", "women's sunglasses", "womens sunglasses",
  "ladies' spectacle frame", "ladies spectacle frame", "unisex spectacle frame",
  "men's spectacle frame", "mens spectacle frame",
];

function cleanName(raw: string): string {
  let name = raw.trim();
  for (const prefix of PREFIXES_TO_STRIP) {
    if (name.toLowerCase().startsWith(prefix)) {
      name = name.slice(prefix.length).trim();
      break;
    }
  }
  // Handle :: delimiter — keep both parts as "Brand Model" for the display name
  if (name.includes('::')) {
    name = name.replace('::', ' ');
  }
  const tokens = name.split(/\s+/);
  while (tokens.length > 0) {
    const last = tokens[tokens.length - 1];
    if (last.includes('_')) break;
    const isColorCode = /^\d{2}[A-Z0-9]{1,}/i.test(last);
    const isPlainColor = /^(black|golden|gold|white|red|blue|green|grey|gray|brown|pink|silver|nude|beige|clear|transparent|purple|violet|orange|copper|navy|ivory|rose|burgundy)$/i.test(last);
    if (isColorCode || isPlainColor) tokens.pop();
    else break;
  }
  return tokens.join(' ').trim().replace(/[-_]+$/, '');
}



// ─── Extract model code from :: delimiter ────────────────────────────────────
function extractModelCode(raw: string): string {
  if (raw.includes('::')) {
    return raw.split('::')[1]?.trim() || raw;
  }
  // Fallback: return last token that looks like a model code
  const tokens = raw.trim().split(/\s+/);
  const last = tokens[tokens.length - 1];
  return last || raw;
}

// ─── Slug Builder ──────────────────────────────────────────────────────────────
function buildSlug(brand: string, sku: string): string {
  return (brand + '-' + sku)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── Brand extraction from cleaned name ───────────────────────────────────────
function extractBrand(raw: string): string {
  // 1. Check the RAW name for :: BEFORE cleaning (cleanName strips ::)
  if (raw.includes('::')) {
    return raw.split('::')[0].trim();
  }

  // 2. Fallback heuristic: take words until we hit a number or a likely model prefix
  const name = cleanName(raw);
  const tokens = name.split(' ');
  const brandTokens = [];
  for (const token of tokens) {
    // If token has a digit, it's the start of the model (e.g., GU00216)
    if (/\d/.test(token)) break;
    
    // If token is fully uppercase and we already have a brand word, 
    // it's likely a model prefix (e.g., "Polaroid PLD" -> "PLD", "Tommy Hilfiger TH" -> "TH")
    if (/^[A-Z]{2,}$/.test(token) && brandTokens.length > 0) break;
    
    brandTokens.push(token);
  }
  return brandTokens.join(' ').trim() || 'Unknown';
}

// ─── Parse CSV text ────────────────────────────────────────────────────────────
function parseCSVText(text: string) {
  const lines = text.split('\n').filter(l => l.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    if (cols.length < 15) continue;
    const pvd = parseFloat(cols[11]);
    const pvr = parseFloat(cols[14]);
    if (isNaN(pvd) || pvd <= 0) continue;
    const name = cols[1]?.trim() || '';
    rows.push({
      sku: cols[0]?.trim() || '',
      name,
      imageUrl: cols[2]?.trim() || '',
      stockA: parseInt(cols[4]) || 0,
      pvd,
      pvr: isNaN(pvr) ? 0 : pvr,
      category: cols[16]?.trim().replace(/\r/g, '') || 'Sunglasses',
    });
  }
  return rows;
}

// ─── POST: Import selected brands from CSV ─────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const brandsJson = formData.get('brands') as string | null;
    const categoryType = (formData.get('categoryType') as string) || 'SUNGLASSES';
    const productsPerBrand = parseInt(formData.get('productsPerBrand') as string) || 10;
    const selectedGenderRaw = (formData.get('gender') as string) || 'WOMEN';

    const selectedGender = selectedGenderRaw === 'MEN' ? ['MEN'] :
                           selectedGenderRaw === 'KIDS' ? ['KIDS'] :
                           ['WOMEN'];

    if (!file || !brandsJson) {
      return NextResponse.json({ error: 'File and brands required' }, { status: 400 });
    }

    const selectedBrands: string[] = JSON.parse(brandsJson);
    if (!selectedBrands.length) {
      return NextResponse.json({ error: 'No brands selected' }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSVText(text);

    // Group by brand
    const brandBuckets: Record<string, typeof rows> = {};
    for (const brand of selectedBrands) { brandBuckets[brand] = []; }

    for (const row of rows) {
      const brand = extractBrand(row.name);
      if (brandBuckets[brand] && brandBuckets[brand].length < productsPerBrand) {
        brandBuckets[brand].push(row);
      }
    }

    // Ensure category exists
    let defaultCat = await prisma.category.findUnique({ where: { name: 'Unisex' } });
    if (!defaultCat) {
      defaultCat = await prisma.category.create({ data: { name: 'Unisex' } });
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];
    const results: { brand: string; count: number }[] = [];

    console.log('[CSV Import] Starting import for brands:', selectedBrands);
    console.log('[CSV Import] Total rows parsed:', rows.length);
    for (const [b, bucket] of Object.entries(brandBuckets)) {
      console.log(`[CSV Import]   Brand "${b}" => ${bucket.length} rows`);
    }

    for (const brand of selectedBrands) {
      const brandRows = brandBuckets[brand] || [];
      let brandCount = 0;

      for (const row of brandRows) {
        try {
          const slug = buildSlug(brand, row.sku);
          const { hex, family } = extractColor(row.name);
          const variantName = extractModelCode(row.name); // e.g. "GU7917" from "Guess::GU7917"
          const calculatedRetailPrice = calculateRetailPrice(row.pvd);
          const compareAtPrice = row.pvr > 0 ? row.pvr : null;
          const productName = cleanName(row.name);

          if (categoryType === 'PRESCRIPTION') {
            await prisma.prescriptionGlasses.upsert({
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
                gender: selectedGender,
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
                PrescriptionGlassesVariant: {
                  create: [{
                    name: variantName,
                    sku: row.sku,
                    colorName: 'Default',
                    colorHex: hex,
                    colorFamily: family,
                    lensColor: 'Default',
                    stock: row.stockA,
                    PrescriptionGlassesAsset: {
                      create: row.imageUrl ? [{ url: row.imageUrl, type: 'NO_BG', isPrimary: true }] : [],
                    },
                  }],
                },
              },
            });
          } else {
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
                gender: selectedGender,
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
                    name: variantName,
                    sku: row.sku,
                    colorName: 'Default',
                    colorHex: hex,
                    colorFamily: family,
                    lensColor: 'Default',
                    stock: row.stockA,
                    ProductAsset: {
                      create: row.imageUrl ? [{ url: row.imageUrl, type: 'NO_BG', isPrimary: true }] : [],
                    },
                  }],
                },
              },
            });
          }

          created++;
          brandCount++;
        } catch (err: any) {
          const fullMsg = String(err.message || err);
          // Extract the meaningful part of Prisma errors
          const meaningful = fullMsg.includes('Unique constraint')
            ? 'Duplicate entry (already exists)'
            : fullMsg.slice(-300).trim();
          const errMsg = `[${brand}] ${row.sku}: ${meaningful.slice(0, 200)}`;
          console.error('[CSV Import] ERROR:', errMsg);
          errors.push(errMsg);
          skipped++;
        }
      }

      results.push({ brand, count: brandCount });
    }

    console.log(`[CSV Import] Done. Created: ${created}, Skipped: ${skipped}`);
    
    // Revalidate Next.js cache so the newly imported brands and products appear in filters immediately
    const { revalidateTag } = require('next/cache');
    revalidateTag('brands');
    revalidateTag('products');

    return NextResponse.json({ success: true, created, skipped, results, errors: errors.slice(0, 20) });
  } catch (err: any) {
    console.error('[CSV Import] FATAL:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
