import dotenv from 'dotenv';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';

dotenv.config();

const API_KEY = process.env.BIGBUY_API_KEY;
const API_URL = 'https://api.bigbuy.eu';

async function run() {
  const filePath = './taxonomies.json';
  
  if (!fs.existsSync(filePath)) {
    console.log('Downloading productstaxonomies.json...');
    const res = await fetch(`${API_URL}/rest/catalog/productstaxonomies.json`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    
    // Write stream to avoid memory bloat from fetch
    const fileStream = createWriteStream(filePath);
    await pipeline(res.body as any, fileStream);
    console.log('Download complete.');
  } else {
    console.log('File already downloaded.');
  }

  console.log('Parsing JSON...');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // 10110 is the taxonomy ID for Prescription Eyewear Frames
  const rxFrames = data.filter((item: any) => item.taxonomy === 10110);
  console.log(`Found ${rxFrames.length} prescription frames!`);
  
  const ids = rxFrames.map((item: any) => item.product).slice(0, 10);
  console.log('\nTop 10 IDs:', ids);
}

run().catch(console.error);
