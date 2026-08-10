import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

const API_KEY = process.env.BLUEBERRY_API_KEY;
const API_URL = process.env.BLUEBERRY_API_URL || 'https://mbx.blue-berry.eu/api';
const PAGE_LIMIT = 100;

if (!API_KEY) {
  throw new Error('BLUEBERRY_API_KEY is required');
}

interface InventoryRow {
  number: string; // SKU
  stock: number;
  priceNet: number;
}

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

// Pull the whole live inventory (stock + price only — much lighter payload than /products)
// and index it by SKU so we can match against whatever subset of SKUs we've imported.
async function fetchInventoryMap(): Promise<Map<string, InventoryRow>> {
  const map = new Map<string, InventoryRow>();
  let page = 0;

  while (true) {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
    const res = await fetchJson(`/products/inventory?${params.toString()}`);
    const items: InventoryRow[] = res?.data || [];
    if (items.length === 0) break;

    for (const item of items) {
      map.set(item.number, item);
    }

    if (items.length < PAGE_LIMIT) break;
    page++;
  }

  return map;
}

function calculateRetailPrice(wholesalePrice: number): number {
  if (wholesalePrice <= 0) return 0;
  return Math.round(wholesalePrice * 2.5 * 100) / 100;
}

async function syncStock() {
  console.log(`[${new Date().toISOString()}] Downloading Blueberry inventory...`);
  const inventory = await fetchInventoryMap();
  console.log(`Inventory loaded: ${inventory.size} SKUs.`);

  let stockUpdated = 0;
  let priceFlagged = 0;
  let unmatched = 0;

  // ── Sunglasses (Product / ProductVariant) ──
  const variants = await prisma.productVariant.findMany({
    where: { Product: { supplier: 'BLUEBERRY' } },
    select: {
      id: true,
      sku: true,
      stock: true,
      Product: { select: { id: true, name: true, basePrice: true, calculatedRetailPrice: true } },
    },
  });

  for (const v of variants) {
    const entry = inventory.get(v.sku);
    if (!entry) {
      unmatched++;
      continue;
    }

    if (entry.stock !== v.stock) {
      await prisma.productVariant.update({ where: { id: v.id }, data: { stock: entry.stock } });
      stockUpdated++;
    }

    const currentBase = Number(v.Product.basePrice);
    if (entry.priceNet > 0 && Math.abs(entry.priceNet - currentBase) > 0.01) {
      await prisma.priceHistory.create({
        data: {
          productId: v.Product.id,
          productName: v.Product.name,
          sku: v.sku,
          oldPrice: currentBase,
          newPrice: entry.priceNet,
          source: 'blueberry-sync',
        },
      });
      priceFlagged++;
    }
  }

  // ── Optical Frames (PrescriptionGlasses / PrescriptionGlassesVariant) ──
  const rxVariants = await prisma.prescriptionGlassesVariant.findMany({
    where: { PrescriptionGlasses: { supplier: 'BLUEBERRY' } },
    select: {
      id: true,
      sku: true,
      stock: true,
      PrescriptionGlasses: { select: { id: true, basePrice: true } },
    },
  });

  for (const v of rxVariants) {
    const entry = inventory.get(v.sku);
    if (!entry) {
      unmatched++;
      continue;
    }
    if (entry.stock !== v.stock) {
      await prisma.prescriptionGlassesVariant.update({ where: { id: v.id }, data: { stock: entry.stock } });
      stockUpdated++;
    }
  }

  console.log(
    `[${new Date().toISOString()}] Done. Stock updated: ${stockUpdated} | Price changes flagged: ${priceFlagged} | Unmatched SKUs: ${unmatched}`
  );
}

syncStock()
  .catch((err) => {
    console.error('Blueberry stock sync failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
