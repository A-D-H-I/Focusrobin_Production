import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.BIGBUY_API_KEY;
const API_URL = 'https://api.bigbuy.eu';
const headers = { 'Authorization': `Bearer ${API_KEY}` };

async function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJson(endpoint: string) {
  const res = await fetch(`${API_URL}${endpoint}`, { headers });
  if (res.status === 429) { await delay(5000); return fetchJson(endpoint); }
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function run() {
  console.log('Fetching products in Category 3000 (Eyewear)...');
  const products = await fetchJson('/rest/catalog/products.json?category=3000');
  console.log(`Found ${products.length} products in Category 3000.`);
  
  const found: { id: number; name: string }[] = [];
  
  // We want to find 5 spectacle frames
  for (let i = 0; i < products.length; i++) {
    if (found.length >= 5) break;
    
    const p = products[i];
    try {
      await delay(800);
      const info = await fetchJson(`/rest/catalog/productinformation/${p.id}.json?isoCode=en`);
      const name = Array.isArray(info) ? info[0]?.name : info?.name;
      if (name && (name.toLowerCase().includes('spectacle') || name.toLowerCase().includes('optical frame'))) {
        found.push({ id: p.id, name });
        console.log(`✅ ${p.id}: "${name}"`);
      }
    } catch {
      // skip
    }
  }
  
  console.log('\n=== VERIFIED SPECTACLE FRAME IDS ===');
  console.log(found.map(f => f.id));
}

run().catch(console.error);
