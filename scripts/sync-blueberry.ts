import dotenv from 'dotenv';
import { PrismaClient, Gender, ProductStatus } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

const API_KEY = process.env.BLUEBERRY_API_KEY;
const API_URL = process.env.BLUEBERRY_API_URL || 'https://mbx.blue-berry.eu/api';
const PAGE_LIMIT = 100;

// Cap how many products this run imports (pass a number as the first CLI arg to override)
const MAX_PRODUCTS = Number(process.argv[2] ?? 200);

if (!API_KEY) {
  throw new Error('BLUEBERRY_API_KEY is required');
}

// ──────────── Types ────────────

interface BBProperty {
  propertyGroup: string;
  propertyName: string;
  propertyValue: string;
  propertyUnit?: string;
}

interface BBProduct {
  id: string;
  productId: number;
  number: string; // this is the SKU
  ean: string;
  name: string;
  model: string;
  stock: number;
  price: number;
  priceNet: number; // wholesale cost, excl. VAT — what we apply our margin formula to
  priceRrp: number; // supplier's own suggested retail — used as compareAtPrice
  vat: number;
  category: string;
  brand: string;
  color: string;
  images: string[];
  properties: BBProperty[];
  description: string;
  tags?: { name: string }[];
  active: boolean;
}

// ──────────── API Fetcher ────────────

async function fetchJson(path: string, retries = 3): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(`${API_URL}${path}`, { headers: { akey: API_KEY! } });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, attempt * 3000));
      continue;
    }
    if (!res.ok) throw new Error(`Blueberry API error ${res.status} on ${path}`);
    return res.json();
  }
  throw new Error(`Max retries exceeded for ${path}`);
}

async function fetchInStockProducts(maxProducts: number): Promise<BBProduct[]> {
  const results: BBProduct[] = [];
  let page = 0;

  while (results.length < maxProducts) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_LIMIT),
      stock_min: '1',
      category: 'Sunglasses,Optical Frames',
    });
    const res = await fetchJson(`/products?${params.toString()}`);
    const items: BBProduct[] = res?.data || [];
    if (items.length === 0) break;

    results.push(...items);
    if (items.length < PAGE_LIMIT) break; // last page
    page++;
  }

  return results.slice(0, maxProducts);
}

// ──────────── Property Helpers ────────────

function getProp(properties: BBProperty[], name: string): string | undefined {
  const match = properties.find((p) => p.propertyName.toLowerCase() === name.toLowerCase());
  return match?.propertyValue?.trim() || undefined;
}

function getPropNum(properties: BBProperty[], name: string): number {
  const val = getProp(properties, name);
  const num = val ? parseFloat(val) : 0;
  return Number.isFinite(num) ? num : 0;
}

function mapGender(raw: string | undefined): Gender[] {
  if (!raw) return [Gender.UNISEX];
  const lower = raw.toLowerCase();
  if (lower.includes('women')) return [Gender.WOMEN];
  if (lower.includes('men')) return [Gender.MEN];
  if (lower.includes('kid') || lower.includes('child')) return [Gender.KIDS];
  return [Gender.UNISEX];
}

// ──────────── Color Mapping (reused from BigBuy sync) ────────────

const COLOR_MAP: Record<string, { hex: string; family: string }> = {
  black: { hex: '#1A1A1A', family: 'Black' },
  white: { hex: '#FFFFFF', family: 'White' },
  red: { hex: '#CC0000', family: 'Red' },
  blue: { hex: '#1A3A8F', family: 'Blue' },
  navy: { hex: '#000080', family: 'Blue' },
  green: { hex: '#2D6A4F', family: 'Green' },
  yellow: { hex: '#F7C948', family: 'Yellow' },
  brown: { hex: '#8B4513', family: 'Brown' },
  tortoise: { hex: '#5C3A21', family: 'Brown' },
  havana: { hex: '#6B4226', family: 'Brown' },
  grey: { hex: '#808080', family: 'Grey' },
  gray: { hex: '#808080', family: 'Grey' },
  gold: { hex: '#C9A84C', family: 'Gold' },
  silver: { hex: '#A8A9AD', family: 'Silver' },
  pink: { hex: '#E75480', family: 'Pink' },
  rose: { hex: '#E75480', family: 'Pink' },
  purple: { hex: '#6A0572', family: 'Purple' },
  orange: { hex: '#E8722A', family: 'Orange' },
  clear: { hex: '#E8E8E8', family: 'Clear' },
  transparent: { hex: '#E8E8E8', family: 'Clear' },
  beige: { hex: '#F5F0E8', family: 'Beige' },
  copper: { hex: '#B87333', family: 'Brown' },
  burgundy: { hex: '#800020', family: 'Red' },
};

function getMapColor(colorStr: string | undefined): { hex: string; family: string } {
  if (!colorStr) return { hex: '#1A1A1A', family: 'Other' };
  const lower = colorStr.toLowerCase().trim();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return val;
  }
  return { hex: '#1A1A1A', family: 'Other' };
}

// ──────────── Pricing (same margin formula used for BigBuy) ────────────

function calculateRetailPrice(wholesalePrice: number): number {
  if (wholesalePrice <= 0) return 0;
  return Math.round(wholesalePrice * 2.5 * 100) / 100;
}

// ──────────── Slug ────────────

function buildSlug(brand: string, model: string, number: string): string {
  const raw = `${brand}-${model || number}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${raw}-bb2-${number}`;
}

// ──────────── Process Single Product ────────────

async function processProduct(p: BBProduct, defaultCategoryId: string) {
  const isSunglasses = p.category === 'Sunglasses';
  const props = p.properties || [];

  const frameMaterial = getProp(props, 'Frame material') || 'Unknown';
  const lensMaterial = getProp(props, 'Lenses Material') || undefined;
  const uvProtection = getProp(props, 'Protection') || 'UV400';
  const glassShape = getProp(props, 'Style') || null;
  const frameColorRaw = getProp(props, 'Frame color') || getProp(props, 'Main color') || p.color;
  const lensColor = getProp(props, 'Lenses Color') || 'Grey';
  const genderRaw = getProp(props, 'Gender');
  const lensEffect = getProp(props, 'Lenses Effect') || '';
  const isPolarized = /polar/i.test(lensEffect);
  const isUVProtection = /uv/i.test(uvProtection);

  const lensWidth = getPropNum(props, 'Lenses width');
  const lensHeight = getPropNum(props, 'Lenses Height');
  const bridgeWidth = getPropNum(props, 'Bridge width');
  const frameWidth = getPropNum(props, 'Frame width');
  const templeLength = getPropNum(props, 'Temples Length');

  const slug = buildSlug(p.brand, p.model, p.number);
  const { hex, family } = getMapColor(frameColorRaw);

  const calculatedRetailPrice = calculateRetailPrice(p.priceNet);
  const compareAtPrice = p.priceRrp > 0 ? p.priceRrp : null;

  // Quality gate: if the core physical attributes are missing, flag for manual review
  // instead of trusting incomplete data straight to the storefront.
  const hasCoreData = frameMaterial !== 'Unknown' && lensWidth > 0 && frameWidth > 0;
  const status: ProductStatus = hasCoreData ? 'PUBLISHED' : 'NEEDS_REVIEW';

  const tags = (p.tags || []).map((t) => t.name).filter(Boolean);

  const commonData = {
    name: p.name,
    slug,
    brand: p.brand || 'Unknown',
    description: p.description || '',
    basePrice: p.priceNet,
    compareAtPrice,
    calculatedRetailPrice,
    status,
    supplier: 'BLUEBERRY' as const,
    gender: mapGender(genderRaw),
    tags,
    frameWidth,
    lensWidth,
    lensHeight,
    bridgeWidth,
    templeLength,
    weightBg: 0,
    frameMaterial,
    lensMaterial,
    uvProtection,
    glassShape,
    isPolarized,
    isUVProtection,
    warranty: `${p.brand} Manufacturer Warranty`,
    categoryId: defaultCategoryId,
  };

  const variantData = {
    name: frameColorRaw || 'Default',
    sku: p.number,
    colorName: frameColorRaw || 'Default',
    colorHex: hex,
    colorFamily: family,
    lensColor,
    stock: p.stock,
  };

  const assetCreates = p.images.map((url, i) => ({
    url,
    type: 'GALLERY' as const,
    isPrimary: i === 0,
  }));

  if (isSunglasses) {
    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        calculatedRetailPrice,
        compareAtPrice,
        ProductVariant: {
          updateMany: { where: { sku: p.number }, data: { stock: p.stock } },
        },
      },
      create: {
        ...commonData,
        ProductVariant: {
          create: [{ ...variantData, ProductAsset: { create: assetCreates } }],
        },
      },
    });
    console.log(`  ✅ [Sunglasses] ${product.id} — ${p.name} (stock: ${p.stock})`);
  } else {
    const rx = await prisma.prescriptionGlasses.upsert({
      where: { slug },
      update: {
        calculatedRetailPrice,
        compareAtPrice,
        PrescriptionGlassesVariant: {
          updateMany: { where: { sku: p.number }, data: { stock: p.stock } },
        },
      },
      create: {
        ...commonData,
        PrescriptionGlassesVariant: {
          create: [{ ...variantData, PrescriptionGlassesAsset: { create: assetCreates } }],
        },
      },
    });
    console.log(`  ✅ [Optical Frame] ${rx.id} — ${p.name} (stock: ${p.stock})`);
  }
}

// ──────────── Main Runner ────────────

async function syncBlueberry() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   Blueberry → FocusRobin Sync            ║');
  console.log('╚══════════════════════════════════════════╝');

  let defaultCategory = await prisma.category.findUnique({ where: { name: 'Unisex' } });
  if (!defaultCategory) {
    defaultCategory = await prisma.category.create({ data: { name: 'Unisex' } });
  }

  console.log(`\n📥 Fetching up to ${MAX_PRODUCTS} in-stock products (Sunglasses + Optical Frames)...`);
  const products = await fetchInStockProducts(MAX_PRODUCTS);
  console.log(`Fetched ${products.length} in-stock products.\n`);

  let ok = 0;
  let failed = 0;
  for (const p of products) {
    try {
      await processProduct(p, defaultCategory.id);
      ok++;
    } catch (err) {
      console.error(`  ❌ Error processing ${p.number} (${p.name}):`, err);
      failed++;
    }
  }

  console.log('\n╔══════════════════════════════════════════╗');
  console.log(`║  Done. Imported: ${ok}  Failed: ${failed}`.padEnd(45) + '║');
  console.log('╚══════════════════════════════════════════╝');
}

syncBlueberry()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
