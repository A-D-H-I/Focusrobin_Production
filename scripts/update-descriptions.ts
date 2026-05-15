import { PrismaClient } from '@prisma/client';
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const API_KEY = process.env.BIGBUY_API_KEY;

function fetchJson(path: string): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.bigbuy.eu',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data || '{}') });
        } catch (err) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function main() {
  console.log('Fetching entire BigBuy catalog for dimensions (this may take a minute)...');
  const catalogRes = await fetchJson('/rest/catalog/products.json');
  
  const boxMap = new Map();
  if (catalogRes.status === 200 && Array.isArray(catalogRes.data)) {
    console.log(`Loaded ${catalogRes.data.length} products from BigBuy catalog.`);
    for (const item of catalogRes.data) {
      if (item.sku) boxMap.set(item.sku, item);
    }
  } else {
    console.log('Failed to fetch BigBuy catalog, cannot append dimensions.', catalogRes.status);
    return;
  }

  console.log('Fetching all products from DB...');
  const products = await prisma.product.findMany({
    include: { ProductVariant: true }
  });

  console.log(`Found ${products.length} products to update.`);
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const sku = product.ProductVariant[0]?.sku;

    if (!sku) {
      console.log(`[${i+1}/${products.length}] ⏭️ No SKU for ${product.slug}, skipping.`);
      continue;
    }

    let success = false;
    let retries = 0;
    while (!success && retries < 3) {
      try {
        const res = await fetchJson(`/rest/catalog/productinformationbysku/${sku}.json?isoCode=en`);
        
        if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
          let descriptionHtml = res.data[0].description || '';
          
          const box = boxMap.get(sku);
          if (box && (box.weight || box.width || box.height || box.depth)) {
            descriptionHtml += `
            <br>
            <br>
            <h4 style="font-weight: bold; margin-bottom: 8px;">Shipping & Packaging Info:</h4>
            <ul style="list-style-type: disc; padding-left: 20px;">
               ${box.weight ? `<li>Weight: ${box.weight} kg</li>` : ''}
               ${box.width && box.height && box.depth ? `<li>Package Dimensions: ${box.width} x ${box.height} x ${box.depth} cm</li>` : ''}
            </ul>`;
          }

          if (descriptionHtml) {
            await prisma.product.update({
              where: { id: product.id },
              data: { description: descriptionHtml }
            });
            console.log(`[${i+1}/${products.length}] ✅ Updated ${product.slug} (${sku})`);
            updated++;
          } else {
            console.log(`[${i+1}/${products.length}] ⏭️ No description in BigBuy for ${sku}`);
          }
          success = true;
        } else if (res.status === 429 || (typeof res.data === 'string' && res.data.includes('rate limit'))) {
          console.log(`[${i+1}/${products.length}] ⏳ Rate limited, sleeping for 5s...`);
          await delay(5000);
          retries++;
        } else {
          console.log(`[${i+1}/${products.length}] ❌ Failed to fetch ${sku} from BigBuy (Status: ${res.status})`);
          failed++;
          success = true; // Not a rate limit, just move on
        }
      } catch (e) {
        console.error(`[${i+1}/${products.length}] ⚠️ Error for ${sku}:`, e);
        failed++;
        success = true;
      }
    }

    // Delay to respect rate limits
    await delay(1000);
  }

  console.log(`\n🎉 Done! Updated: ${updated}, Failed: ${failed}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
