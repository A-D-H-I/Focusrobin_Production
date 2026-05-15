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

async function testMapping() {
  const taxonomyId = 31866; // Sunglasses

  console.log('Fetching products...');
  const products = await fetchJson(`/rest/catalog/products.json?parentTaxonomy=${taxonomyId}`);
  const sampleProducts = products.slice(0, 5); // Take first 5 products

  console.log('Fetching product information (English)...');
  const info = await fetchJson(`/rest/catalog/productsinformation.json?parentTaxonomy=${taxonomyId}&isoCode=en`);
  
  console.log('Fetching product images...');
  const images = await fetchJson(`/rest/catalog/productsimages.json?parentTaxonomy=${taxonomyId}`);
  
  console.log('Fetching product variations...');
  const variations = await fetchJson(`/rest/catalog/productsvariations.json?parentTaxonomy=${taxonomyId}`);
  
  console.log('Fetching variation attributes...');
  const varAttributes = await fetchJson(`/rest/catalog/variations.json?parentTaxonomy=${taxonomyId}`);
  
  console.log('Fetching attributes...');
  const attributes = await fetchJson(`/rest/catalog/attributes.json?parentTaxonomy=${taxonomyId}&isoCode=en`);
  
  console.log('\n--- ANALYSIS OF SAMPLE PRODUCTS ---\n');

  for (const p of sampleProducts) {
    const pInfo = info.find((i: any) => i.id === p.id);
    const pImages = images.find((i: any) => i.id === p.id);
    const pVariations = variations.filter((v: any) => v.product === p.id);
    
    // Stitch variations with attributes
    const detailedVariations = pVariations.map((v: any) => {
      const vAttrs = varAttributes.find((va: any) => va.id === v.id);
      const attrDetails = (vAttrs?.attributes || []).map((a: any) => {
        return attributes.find((attr: any) => attr.id === a.id);
      });
      return {
        id: v.id,
        sku: v.sku,
        wholesalePrice: v.wholesalePrice,
        attributes: attrDetails
      };
    });

    const productOutput = {
      id: p.id,
      sku: p.sku,
      category: p.category,
      brand: p.brand || 'No brand specified',
      weight_package: p.weight,
      width_package: p.width,
      height_package: p.height,
      depth_package: p.depth,
      wholesalePrice: p.wholesalePrice,
      retailPrice: p.retailPrice,
      name: pInfo?.name,
      description: pInfo?.description ? 'HTML Description exists (length: ' + pInfo.description.length + ')' : 'No desc',
      images_count: pImages?.images?.length || 0,
      tags: p.tags,
      variations: detailedVariations
    };

    console.log(JSON.stringify(productOutput, null, 2));
    console.log('\n=================================\n');
  }
}

testMapping().catch(console.error);
