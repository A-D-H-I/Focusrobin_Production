import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.BIGBUY_API_KEY;
const API_URL = 'https://api.bigbuy.eu';
const headers = { 'Authorization': `Bearer ${API_KEY}` };

async function fetchJson(endpoint: string) {
  const res = await fetch(`${API_URL}${endpoint}`, { headers });
  if (res.status === 429) {
    console.warn(`Rate limited! Waiting 5s...`);
    await new Promise(r => setTimeout(r, 5000));
    return fetchJson(endpoint);
  }
  if (!res.ok) throw new Error(`API error ${res.status} on ${endpoint}`);
  return res.json();
}

async function run() {
  const pid = 36079; // The Polaroid sunglasses from the screenshot
  
  console.log('=== RAW PRODUCT DATA ===');
  const prod = await fetchJson(`/rest/catalog/product/${pid}.json`);
  console.log(JSON.stringify(prod, null, 2));
  
  await new Promise(r => setTimeout(r, 1500));
  
  console.log('\n=== RAW PRODUCT INFO (EN) ===');
  const info = await fetchJson(`/rest/catalog/productinformation/${pid}.json?isoCode=en`);
  console.log(JSON.stringify(info, null, 2));
  
  await new Promise(r => setTimeout(r, 1500));
  
  console.log('\n=== RAW PRODUCT IMAGES ===');
  const imgs = await fetchJson(`/rest/catalog/productimages/${pid}.json`);
  console.log(JSON.stringify(imgs, null, 2));

  await new Promise(r => setTimeout(r, 1500));

  console.log('\n=== MANUFACTURERS (first 20) ===');
  try {
    const mfg = await fetchJson(`/rest/catalog/manufacturer/${prod.manufacturer || 0}.json`);
    console.log(JSON.stringify(mfg, null, 2));
  } catch(e) {
    console.log('Manufacturer endpoint failed, trying manufacturers list...');
    // Try fetching a few manufacturers
  }

  await new Promise(r => setTimeout(r, 1500));

  console.log('\n=== PRODUCT VARIATIONS ===');
  try {
    const vars = await fetchJson(`/rest/catalog/productvariations/${pid}.json`);
    console.log(JSON.stringify(vars, null, 2));
  } catch(e) {
    console.log('Variations endpoint failed:', (e as Error).message);
  }

  await new Promise(r => setTimeout(r, 1500));

  console.log('\n=== PRODUCT STOCK ===');
  try {
    const stock = await fetchJson(`/rest/catalog/productstockbyhandlingdays/${pid}.json`);
    console.log(JSON.stringify(stock, null, 2));
  } catch(e) {
    console.log('Stock endpoint failed:', (e as Error).message);
  }
}

run().catch(console.error);
