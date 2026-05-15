import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.BIGBUY_API_KEY;
const API_URL = 'https://api.bigbuy.eu';

const headers = { 'Authorization': `Bearer ${API_KEY}` };

async function fetchJson(endpoint: string) {
  console.log(`Fetching ${endpoint}...`);
  const res = await fetch(`${API_URL}${endpoint}`, { headers });
  if (!res.ok) {
    console.error(`Failed ${endpoint}: ${res.status}`);
    return null;
  }
  return res.json();
}

async function testEndpoints() {
  const t = 31866;
  
  const endpointsToTest = [
    `/rest/catalog/products.json?category=${t}`,
    `/rest/catalog/products.json?taxonomy=${t}`,
    `/rest/catalog/products.json?parentTaxonomy=${t}`,
    `/rest/catalog/products.json?firstLevel=true`,
    `/rest/catalog/productsvariations.json?parentTaxonomy=${t}`
  ];
  
  for (const ep of endpointsToTest) {
    const data = await fetchJson(ep);
    if (data) {
      console.log(`Success! Got ${Array.isArray(data) ? data.length : 'an object'} items from ${ep}`);
    }
  }
}

testEndpoints().catch(console.error);
