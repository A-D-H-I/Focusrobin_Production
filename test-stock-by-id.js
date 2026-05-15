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

const delay = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  // Check: Does the bulk catalog products.json include stock info?
  console.log('Checking if products.json has stock field...');
  const catRes = await fetchJson('/rest/catalog/products.json');
  if (catRes.status === 200 && Array.isArray(catRes.data)) {
    const sample = catRes.data[0];
    console.log('Sample product keys:', Object.keys(sample).join(', '));
    console.log('Has stocks field:', 'stocks' in sample);
    console.log('Has stock field:', 'stock' in sample);
    console.log('Sample:', JSON.stringify(sample).slice(0, 300));
  }
  await prisma.$disconnect();
}
main().catch(console.error);
