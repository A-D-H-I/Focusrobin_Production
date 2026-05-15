import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.BIGBUY_API_KEY;
const API_URL = 'https://api.bigbuy.eu';

const headers = { 'Authorization': `Bearer ${API_KEY}` };

async function fetchJson(endpoint: string) {
  const res = await fetch(`${API_URL}${endpoint}`, { headers });
  if (!res.ok) throw new Error(`API error ${res.status} on ${endpoint}`);
  return res.json();
}

async function run() {
  const taxonomyId = 31866; // Sunglasses

  console.log('Fetching productstaxonomies.json...');
  const taxMap = await fetchJson('/rest/catalog/productstaxonomies.json');
  
  const productIds = taxMap
    .filter((t: any) => t.taxonomy === taxonomyId)
    .map((t: any) => t.product)
    .slice(0, 2); // Get 2 products
    
  console.log('Found product IDs:', productIds);
  
  for (const pid of productIds) {
    try {
      console.log(`\n--- Fetching details for Product ${pid} ---`);
      
      const prod = await fetchJson(`/rest/catalog/product/${pid}.json`);
      const info = await fetchJson(`/rest/catalog/productinformation/${pid}.json?isoCode=en`);
      const images = await fetchJson(`/rest/catalog/productimages/${pid}.json`);
      
      console.log('Product Base:', prod);
      console.log('Product Info:', info);
      console.log('Product Images:', images?.images?.length, 'images');
      
      // Let's also check variations for this product
      // By the guide, variations for a product are at /rest/catalog/productsvariations.json (bulk), but maybe there's a singular one?
    } catch(e) {
      console.error(`Failed to fetch details for ${pid}:`, e.message);
    }
  }
}

run().catch(console.error);
