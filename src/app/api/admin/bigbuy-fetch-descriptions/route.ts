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

export async function POST(_req: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      include: { ProductVariant: true },
    });

    let updated = 0;
    let failed = 0;
    let skipped = 0;

    for (const product of products) {
      const sku = product.ProductVariant[0]?.sku;
      if (!sku) { skipped++; continue; }

      let retries = 0;
      let success = false;

      while (!success && retries < 3) {
        const res = await fetchBigBuy(`/rest/catalog/productinformationbysku/${sku}.json?isoCode=en`);

        if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
          const html = res.data[0].description;
          if (html) {
            await prisma.product.update({
              where: { id: product.id },
              data: { description: html },
            });
            updated++;
          } else {
            skipped++;
          }
          success = true;
        } else if (res.status === 429 || (typeof res.data === 'string' && res.data.includes('rate limit'))) {
          await delay(5000);
          retries++;
        } else {
          failed++;
          success = true;
        }
      }

      await delay(1000);
    }

    return NextResponse.json({ success: true, updated, failed, skipped });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
