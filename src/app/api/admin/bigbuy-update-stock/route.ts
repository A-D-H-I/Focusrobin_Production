import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import https from 'https';

const API_KEY = process.env.BIGBUY_API_KEY;

function fetchBigBuy(path: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.bigbuy.eu',
      port: 443,
      path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode!, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode!, data }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// BigBuy retail price formula (same as CSV import)
function calcRetailPrice(wholesalePrice: number): number {
  let p = wholesalePrice * 1.10 + 13.5;
  p = p * 1.21;
  p = p * 1.015;
  return Math.round(p * 100) / 100;
}

export async function POST(_req: NextRequest) {
  try {
    // Step 1: Download full catalog to build SKU → {BigBuy ID, wholesale price} map
    console.log('[Stock Update] Downloading BigBuy catalog...');
    const catalogRes = await fetchBigBuy('/rest/catalog/products.json');

    if (catalogRes.status !== 200 || !Array.isArray(catalogRes.data)) {
      return NextResponse.json({ error: 'Failed to fetch BigBuy product catalog' }, { status: 500 });
    }

    // Build SKU → { id, wholesalePrice } map
    const skuMap = new Map<string, { id: number; wholesalePrice: number }>();
    for (const item of catalogRes.data) {
      if (item.sku && item.id) {
        skuMap.set(item.sku, {
          id: item.id,
          wholesalePrice: parseFloat(item.pvd || item.wholesalePrice || item.price || '0'),
        });
      }
    }
    console.log(`[Stock Update] Catalog loaded: ${skuMap.size} SKUs.`);

    // Step 2: Get all DB variants with their parent product info
    const variants = await prisma.productVariant.findMany({
      select: {
        id: true,
        sku: true,
        Product: {
          select: {
            id: true,
            name: true,
            brand: true,
            basePrice: true,
            calculatedRetailPrice: true,
            frameMaterial: true,
          },
        },
      },
    });

    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const priceChanges: Array<{
      sku: string;
      productName: string;
      oldWholesale: number;
      newWholesale: number;
      oldRetail: number;
      newRetail: number;
      diffPct: number;
    }> = [];

    // Step 3: For each variant, fetch stock and detect price changes
    for (const variant of variants) {
      const entry = skuMap.get(variant.sku);
      if (!entry) { skipped++; continue; }

      const { id: bigbuyId, wholesalePrice } = entry;
      const product = variant.Product;

      // --- Price change detection (alert-only, no auto-update) ---
      if (wholesalePrice > 0 && product) {
        const currentBasePrice = Number(product.basePrice);
        const priceDiff = Math.abs(wholesalePrice - currentBasePrice);

        // Only flag if price changed by more than €0.01
        if (priceDiff > 0.01) {
          const oldRetail = Number(product.calculatedRetailPrice) || calcRetailPrice(currentBasePrice);
          const newRetail = calcRetailPrice(wholesalePrice);
          const diffPct = Math.round(((wholesalePrice - currentBasePrice) / currentBasePrice) * 100 * 10) / 10;

          // Record in PriceHistory table
          await prisma.priceHistory.create({
            data: {
              productId: product.id,
              productName: product.name,
              sku: variant.sku,
              oldPrice: currentBasePrice,
              newPrice: wholesalePrice,
              source: 'bigbuy-sync',
            },
          });

          priceChanges.push({
            sku: variant.sku,
            productName: product.name,
            oldWholesale: currentBasePrice,
            newWholesale: wholesalePrice,
            oldRetail,
            newRetail,
            diffPct,
          });
        }
      }

      // --- Stock update ---
      let retries = 0;
      let success = false;

      while (!success && retries < 3) {
        const res = await fetchBigBuy(`/rest/catalog/productstockbyhandlingdays/${bigbuyId}.json`);

        if (res.status === 200 && res.data?.stocks) {
          const totalStock = res.data.stocks.reduce((sum: number, wh: any) => sum + (wh.quantity || 0), 0);
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: { stock: totalStock },
          });
          updated++;
          success = true;
        } else if (res.status === 429 || (typeof res.data === 'string' && res.data.includes('rate limit'))) {
          await delay(5000);
          retries++;
        } else {
          failed++;
          success = true;
        }
      }

      await delay(500);
    }

    console.log(`[Stock Update] Done. Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}, Price changes: ${priceChanges.length}`);
    return NextResponse.json({
      success: true,
      updated,
      skipped,
      failed,
      priceChanges,
    });
  } catch (err: any) {
    console.error('[Stock Update] FATAL:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
