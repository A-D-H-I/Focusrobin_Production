const https = require('https');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function fetchJson(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.bigbuy.eu',
      port: 443,
      path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.BIGBUY_API_KEY}`,
        'Accept': 'application/json'
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // 1. Check descriptions: count products with vs without description
  const total = await prisma.product.count();
  const withDesc = await prisma.product.count({ where: { description: { not: null } } });
  console.log(`\n📝 DESCRIPTIONS:`);
  console.log(`  Total products: ${total}`);
  console.log(`  With description: ${withDesc}`);
  console.log(`  Without description: ${total - withDesc}`);

  // 2. Sample a product description to verify HTML is there
  const sample = await prisma.product.findFirst({
    where: { description: { not: null } },
    select: { slug: true, description: true }
  });
  if (sample) {
    const hasHtml = sample.description.includes('<');
    const hasShipping = sample.description.includes('Shipping');
    console.log(`\n  Sample product: ${sample.slug}`);
    console.log(`  Contains HTML tags: ${hasHtml ? '✅' : '❌'}`);
    console.log(`  Contains Shipping info: ${hasShipping ? '✅' : '❌'}`);
    console.log(`  First 200 chars: ${sample.description.slice(0, 200)}`);
  }

  // 3. Check stock levels
  const variants = await prisma.productVariant.findMany({ select: { stock: true } });
  const hardcoded10 = variants.filter(v => v.stock === 10).length;
  const zeroStock = variants.filter(v => v.stock === 0).length;
  const realStock = variants.filter(v => v.stock > 0 && v.stock !== 10).length;
  console.log(`\n📦 STOCK LEVELS:`);
  console.log(`  Total variants: ${variants.length}`);
  console.log(`  Stock = 10 (possibly hardcoded): ${hardcoded10}`);
  console.log(`  Stock = 0: ${zeroStock}`);
  console.log(`  Other real stock values: ${realStock}`);

  // 4. Quick test BigBuy stock endpoint
  console.log(`\n🌐 TESTING BigBuy Stock API...`);
  const res = await fetchJson('/rest/catalog/productstockbyhandlingdays.json');
  if (res.status === 200 && Array.isArray(res.data)) {
    console.log(`  ✅ BigBuy stock API works — returned ${res.data.length} items`);
    const sample2 = res.data[0];
    console.log(`  Sample: SKU=${sample2.sku}, stocks=${JSON.stringify(sample2.stocks || sample2.quantity)}`);
  } else {
    console.log(`  ❌ Failed: status=${res.status}`);
  }

  await prisma.$disconnect();
}
main().catch(console.error);

async function testStockEndpoints() {
  const endpoints = [
    '/rest/catalog/productstockbyhandlingdays.json',
    '/rest/catalog/productsstock.json',
    '/rest/catalog/productsstockbyreference.json',
  ];
  require('dotenv').config();
  for (const ep of endpoints) {
    const r = await fetchJson(ep);
    console.log(`${ep} => status=${r.status}, isArray=${Array.isArray(r.data)}, first=${JSON.stringify(Array.isArray(r.data) ? r.data[0] : r.data).slice(0, 100)}`);
  }
}
testStockEndpoints().catch(console.error);
