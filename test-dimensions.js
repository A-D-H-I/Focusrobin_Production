const https = require('https');
require('dotenv').config();
const API_KEY = process.env.BIGBUY_API_KEY;

function fetchJson(path) {
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
         try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
         catch(e) { resolve({status: res.statusCode, data: data}); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  const sku = 'S72143608';
  console.log(await fetchJson(`/rest/catalog/product/${sku}.json`)); // try if it accepts sku?
  console.log(await fetchJson(`/rest/catalog/product.json?sku=${sku}`)); 
  console.log(await fetchJson(`/rest/catalog/products.json?sku=${sku}`)); // returns everything
}
run();
