import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';

const API_KEY = process.env.BLUEBERRY_API_KEY;
const API_URL = process.env.BLUEBERRY_API_URL || 'https://mbx.blue-berry.eu/api';
const CRON_SECRET = process.env.CRON_SECRET;
const PAGE_LIMIT = 100;

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

// Pull the whole live inventory (stock + price only) and index by SKU.
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

export async function GET(req: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!API_KEY) {
    return NextResponse.json({ error: 'BLUEBERRY_API_KEY not configured' }, { status: 500 });
  }

  try {
    const inventory = await fetchInventoryMap();

    let stockUpdated = 0;
    let priceFlagged = 0;
    let unmatched = 0;
    const changedSlugs = new Set<string>();

    // ── Sunglasses (Product / ProductVariant) ──
    const variants = await prisma.productVariant.findMany({
      where: { Product: { supplier: 'BLUEBERRY' } },
      select: {
        id: true,
        sku: true,
        stock: true,
        Product: { select: { id: true, slug: true, name: true, basePrice: true } },
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
        changedSlugs.add(v.Product.slug);
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
        PrescriptionGlasses: { select: { slug: true } },
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
        changedSlugs.add(v.PrescriptionGlasses.slug);
      }
    }

    // Bust caches so the storefront reflects the new stock immediately,
    // rather than waiting for the 5-min listing-page ISR window.
    if (stockUpdated > 0) {
      revalidateTag('products');
      revalidatePath('/shop');
      revalidatePath('/shop/prescription-glasses');
      for (const slug of changedSlugs) {
        revalidatePath(`/shop/${slug}`);
      }
    }

    return NextResponse.json({
      success: true,
      stockUpdated,
      priceFlagged,
      unmatched,
      revalidatedSlugs: changedSlugs.size,
    });
  } catch (err: any) {
    console.error('[Blueberry Cron Sync] FATAL:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
