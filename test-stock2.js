const https = require('https');
require('dotenv').config();

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
  const endpoints = [
    '/rest/catalog/productstockbyhandlingdays.json',
    '/rest/catalog/productsstock.json',
    '/rest/catalog/productstockbyhandlingdays/36079.json',
    '/rest/catalog/productsstock/36079.json',
  ];
  for (const ep of endpoints) {
    const r = await fetchJson(ep);
    console.log(`\n${ep}`);
    console.log(`  status=${r.status}`);
    if (r.status === 200) {
      const sample = Array.isArray(r.data) ? r.data[0] : r.data;
      console.log(`  sample: ${JSON.stringify(sample).slice(0, 200)}`);
    } else {
      console.log(`  error: ${JSON.stringify(r.data)}`);
    }
  }
}
main().catch(console.error);
