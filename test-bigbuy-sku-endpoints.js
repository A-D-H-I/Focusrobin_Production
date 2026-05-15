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
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data || '{}') }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  const sku = 'S0309975';
  let res = await fetchJson(`/rest/catalog/productinformationbysku/${sku}.json`);
  console.log('productinformationbysku:', res.status, res.data);
  
  if (res.status === 404 || res.status === 400) {
     res = await fetchJson(`/rest/catalog/productbysku/${sku}.json`);
     console.log('productbysku:', res.status, res.data);
  }
}

run();
