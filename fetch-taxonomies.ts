import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.BIGBUY_API_KEY;
const API_URL = 'https://api.bigbuy.eu';

async function fetchTaxonomies() {
  console.log('Fetching taxonomies from BigBuy...');
  
  // Try fetching with isoCode=en first
  const response = await fetch(`${API_URL}/rest/catalog/taxonomies.json?isoCode=en`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  });

  if (!response.ok) {
    console.error('Failed to fetch:', response.status, response.statusText);
    return;
  }

  const taxonomies = await response.json();
  console.log(`Total taxonomies fetched: ${taxonomies.length}`);
  
  // Filter for relevant keywords (English and Spanish)
  const keywords = ['sunglass', 'glass', 'eyewear', 'gafas', 'sol', 'optica', 'óptica', 'lente', 'prescription'];
  
  const matches = taxonomies.filter((t: any) => {
    const name = (t.name || '').toLowerCase();
    const url = (t.url || '').toLowerCase();
    return keywords.some(k => name.includes(k) || url.includes(k));
  });
  
  console.log(`\nFound ${matches.length} matching taxonomies:`);
  
  // If there are too many, we just show the relevant ones
  matches.forEach((t: any) => {
    console.log(`ID: ${t.id} | Name: ${t.name} | Parent: ${t.parentTaxonomy} | URL: ${t.url}`);
  });
}

fetchTaxonomies().catch(console.error);
