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
  console.log('Fetching /rest/catalog/productscategories.json...');
  try {
    const cats = await fetchJson('/rest/catalog/productscategories.json');
    console.log(`Success! Got ${cats.length} records. Example:`, cats[0]);
  } catch(e) { console.error('productscategories failed:', e.message); }

  console.log('Fetching /rest/catalog/productscategoriestaxonomies.json...');
  try {
    const cats = await fetchJson('/rest/catalog/productscategoriestaxonomies.json');
    console.log(`Success! Got ${cats.length} records. Example:`, cats[0]);
  } catch(e) { console.error('productscategoriestaxonomies failed:', e.message); }

  console.log('Fetching /rest/catalog/productstaxonomies.json...');
  try {
    const tax = await fetchJson('/rest/catalog/productstaxonomies.json');
    console.log(`Success! Got ${tax.length} records. Example:`, tax[0]);
  } catch(e) { console.error('productstaxonomies failed:', e.message); }
}

run().catch(console.error);
