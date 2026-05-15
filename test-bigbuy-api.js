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
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  const res = await fetchJson('/rest/catalog/productsinformations.json?isoCode=en');
  console.log('Status:', res.status);
  console.log('Data sample:', Array.isArray(res.data) ? res.data.slice(0, 2) : res.data);
}

run();
