import dotenv from 'dotenv';
import { PrismaClient, Gender, ProductStatus } from '@prisma/client';
import OpenAI from 'openai';

dotenv.config();

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const API_KEY = process.env.BIGBUY_API_KEY;
const API_URL = 'https://api.bigbuy.eu';
const headers = { 'Authorization': `Bearer ${API_KEY}` };

// ──────────── Helpers ────────────

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateRetailPrice(basePrice: number, brand: string): number {
  const isFocusRobin = (brand || "").trim().toLowerCase() === "focusrobin";
  if (isFocusRobin || basePrice <= 0) return basePrice;
  let price = basePrice * 1.1 + 13.5;
  price = price * 1.21;
  price = price * 1.015;
  return price;
}

function calculateFinalPrice(retailPrice: number, discountPct: number = 0): number {
  if (discountPct <= 0) return retailPrice;
  return retailPrice * (1 - discountPct / 100);
}

// ──────────── Color Mapping ────────────

const COLOR_MAP: Record<string, { hex: string; family: string }> = {
  'black':       { hex: '#1A1A1A', family: 'Black' },
  'white':       { hex: '#FFFFFF', family: 'White' },
  'red':         { hex: '#FF0000', family: 'Red' },
  'blue':        { hex: '#0000FF', family: 'Blue' },
  'navy':        { hex: '#000080', family: 'Blue' },
  'green':       { hex: '#008000', family: 'Green' },
  'yellow':      { hex: '#FFFF00', family: 'Yellow' },
  'brown':       { hex: '#A52A2A', family: 'Brown' },
  'tortoise':    { hex: '#5C3A21', family: 'Brown' },
  'havana':      { hex: '#6B4226', family: 'Brown' },
  'grey':        { hex: '#808080', family: 'Grey' },
  'gray':        { hex: '#808080', family: 'Grey' },
  'gold':        { hex: '#FFD700', family: 'Gold' },
  'silver':      { hex: '#C0C0C0', family: 'Silver' },
  'pink':        { hex: '#FFC0CB', family: 'Pink' },
  'purple':      { hex: '#800080', family: 'Purple' },
  'orange':      { hex: '#FFA500', family: 'Orange' },
  'clear':       { hex: '#E8E8E8', family: 'Clear' },
  'transparent': { hex: '#E8E8E8', family: 'Clear' },
  'multicolour': { hex: '#1A1A1A', family: 'Multicolour' },
  'multicolor':  { hex: '#1A1A1A', family: 'Multicolour' },
  'beige':       { hex: '#F5F5DC', family: 'Beige' },
  'ivory':       { hex: '#FFFFF0', family: 'White' },
  'rose':        { hex: '#FF007F', family: 'Pink' },
  'burgundy':    { hex: '#800020', family: 'Red' },
  'copper':      { hex: '#B87333', family: 'Brown' },
  'gunmetal':    { hex: '#2A3439', family: 'Grey' },
  'matte black': { hex: '#28282B', family: 'Black' },
};

function getMapColor(colorStr: string): { hex: string; family: string } {
  if (!colorStr) return { hex: '#1A1A1A', family: 'Black' };
  const lower = colorStr.toLowerCase().trim();
  // Exact match first
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  // Partial match
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return val;
  }
  return { hex: '#1A1A1A', family: 'Other' };
}

// ──────────── Manufacturer Cache ────────────

const manufacturerCache: Record<number, string> = {};

async function getManufacturerName(manufacturerId: number): Promise<string> {
  if (!manufacturerId) return 'Unknown';
  if (manufacturerCache[manufacturerId]) return manufacturerCache[manufacturerId];
  try {
    await delay(1500);
    const mfg = await fetchJson(`/rest/catalog/manufacturer/${manufacturerId}.json`);
    const name = mfg?.name || 'Unknown';
    manufacturerCache[manufacturerId] = name;
    return name;
  } catch {
    return 'Unknown';
  }
}

// ──────────── API Fetcher with retry ────────────

async function fetchJson(endpoint: string, retries = 3): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(`${API_URL}${endpoint}`, { headers });
    if (res.status === 429) {
      const waitTime = attempt * 3000;
      console.warn(`  ⏳ Rate limited (attempt ${attempt}/${retries}). Waiting ${waitTime / 1000}s...`);
      await delay(waitTime);
      continue;
    }
    if (!res.ok) throw new Error(`API error ${res.status} on ${endpoint}`);
    return res.json();
  }
  throw new Error(`Max retries exceeded for ${endpoint}`);
}

// ──────────── LLM Extraction ────────────

async function parseHTMLWithLLM(htmlString: string, productName: string, brandName: string) {
  const fallback = {
    confidenceScore: 0,
    gender: ['UNISEX'],
    primaryColor: 'Black',
    lensColor: 'Grey',
    frameMaterial: 'Unknown',
    lensMaterial: 'Unknown',
    uvProtection: 'Unknown',
    glassShape: null,
    lensWidth: 0,
    bridgeWidth: 0,
    templeLength: 0,
    frameWidth: 0,
    isPolarized: false,
    isUVProtection: false,
  };

  if (!htmlString || htmlString.trim() === '') return fallback;

  const prompt = `You are an expert eyewear product data extractor. Extract structured data from the HTML description below.

RULES:
1. "frameMaterial" comes from the field labeled "Material:" in the HTML (NOT "Lens material:"). If multiple materials listed, join with " / " (e.g. "Polycarbonate / Resin").
2. "lensMaterial" comes ONLY from the field labeled "Lens material:" in the HTML.
3. "primaryColor" must be a SINGLE dominant frame color (e.g. "Black", "Brown", "Red"). Do NOT return "Multicolour" — pick the first specific color listed after it. If only "Multicolour" is listed, infer from the product name or images.
4. "lensColor" is the tint of the lens (e.g. "Grey", "Brown", "Green"). If not specified, infer from "Type of lens:" or default to "Grey".
5. For dimensions: extract from "Approx. dimensions: X x Y x Z mm" where X=lensWidth, Y=bridgeWidth, Z=templeLength. Also check "Bridge:", "Legs:", "Lenses: Ø" fields. "frameWidth" is usually not given — leave 0 if missing.
6. "glassShape" — infer from the product name or shape visible in context (e.g. "Rectangle", "Round", "Cat Eye", "Aviator", "Wrap", "Square", "Oval", "Wayfarer", "Pilot"). If genuinely uncertain, use null.
7. "isPolarized" — true only if the name contains "Polaroid" or "Polarized", or the description explicitly mentions polarized lenses.
8. For confidenceScore (0-100): deduct 10 for each Unknown/missing field, deduct 15 if color is ambiguous, deduct 20 if no dimensions found.

Respond with ONLY a valid JSON object:
{
  "confidenceScore": number,
  "gender": ["MEN" | "WOMEN" | "UNISEX" | "KIDS"],
  "primaryColor": string,
  "lensColor": string,
  "frameMaterial": string,
  "lensMaterial": string,
  "uvProtection": string,
  "glassShape": string | null,
  "lensWidth": number (mm),
  "bridgeWidth": number (mm),
  "templeLength": number (mm),
  "frameWidth": number (mm, 0 if unknown),
  "isPolarized": boolean,
  "isUVProtection": boolean
}

Brand: ${brandName}
Product Name: ${productName}
HTML Description: ${htmlString}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0,
    });
    const content = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);
    // Merge with fallback for any missing fields
    return { ...fallback, ...parsed };
  } catch (error) {
    console.error('  ❌ LLM Error:', error);
    return fallback;
  }
}

// ──────────── Build Clean Slug ────────────

function buildSlug(brand: string, productName: string, bigbuyId: number): string {
  // Try to extract model number from name (e.g. "S8443-CWY")
  const modelMatch = productName.match(/([A-Z]{1,3}[\d]{2,}[\w-]*)/i);
  const model = modelMatch ? modelMatch[1] : '';

  let slug: string;
  if (model) {
    slug = `${brand}-${model}`.toLowerCase();
  } else {
    // Fallback: use brand + first few meaningful words
    const words = productName
      .replace(/[Øø×]/g, '')
      .split(/\s+/)
      .filter(w => !['unisex', 'men\'s', 'women\'s', 'sunglasses', 'spectacle', 'frame', 'mm', 'ø'].includes(w.toLowerCase()))
      .slice(0, 3);
    slug = [brand, ...words].join('-').toLowerCase();
  }

  slug = slug
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Append short BigBuy ID to guarantee uniqueness
  return `${slug}-bb${bigbuyId}`;
}

// ──────────── Get Real Stock ────────────

async function getRealStock(pid: number): Promise<number> {
  try {
    await delay(1500);
    const stockData = await fetchJson(`/rest/catalog/productstockbyhandlingdays/${pid}.json`);
    if (stockData?.stocks && Array.isArray(stockData.stocks)) {
      return stockData.stocks.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0);
    }
    return 0;
  } catch {
    return 0;
  }
}

// ──────────── Process Single Product ────────────

async function processProduct(pid: number, type: 'SUNGLASSES' | 'PRESCRIPTION', defaultCategoryId: string) {
  try {
    console.log(`\n════════════════════════════════════════`);
    console.log(`  Fetching BigBuy #${pid} [${type}]`);
    console.log(`════════════════════════════════════════`);

    // 1. Fetch product base data
    await delay(1500);
    const prod = await fetchJson(`/rest/catalog/product/${pid}.json`);
    if (!prod || !prod.sku) {
      console.log(`  ⚠️ No product data for ${pid}, skipping.`);
      return;
    }

    // 2. Fetch product info (name + description)
    await delay(1500);
    const infoList = await fetchJson(`/rest/catalog/productinformation/${pid}.json?isoCode=en`);
    const info = Array.isArray(infoList) ? infoList[0] : infoList;
    if (!info || !info.name) {
      console.log(`  ⚠️ No product info for ${pid}, skipping.`);
      return;
    }

    // 3. Fetch images
    await delay(1500);
    const imageData = await fetchJson(`/rest/catalog/productimages/${pid}.json`);
    const images = imageData?.images || [];

    // 4. Fetch REAL brand from manufacturer endpoint
    const brand = await getManufacturerName(prod.manufacturer);
    console.log(`  🏷️  Brand: ${brand}`);

    // 5. Fetch REAL stock
    const realStock = await getRealStock(pid);
    console.log(`  📦 Stock: ${realStock}`);

    // 6. Parse HTML with LLM
    const name = info.name;
    const htmlDesc = info.description || '';
    console.log(`  🤖 Analyzing: "${name}"...`);
    const parsed = await parseHTMLWithLLM(htmlDesc, name, brand);

    // 7. Build clean slug
    const slug = buildSlug(brand, name, pid);
    console.log(`  🔗 Slug: ${slug}`);

    // 8. Map color
    const { hex, family } = getMapColor(parsed.primaryColor);
    console.log(`  🎨 Color: ${parsed.primaryColor} → ${hex} (${family})`);

    // 9. Dimensions
    console.log(`  📐 Dimensions: lens=${parsed.lensWidth}mm bridge=${parsed.bridgeWidth}mm temple=${parsed.templeLength}mm frame=${parsed.frameWidth}mm`);

    // 10. Materials
    console.log(`  🔧 Frame: ${parsed.frameMaterial} | Lens: ${parsed.lensMaterial}`);

    // 11. Gender
    let finalGenders: Gender[] = [];
    if (parsed.gender && Array.isArray(parsed.gender)) {
      parsed.gender.forEach((g: string) => {
        if (Object.values(Gender).includes(g as Gender)) {
          finalGenders.push(g as Gender);
        }
      });
    }
    if (finalGenders.length === 0) finalGenders.push(Gender.UNISEX);

    // 12. Pricing
    const basePrice = prod.wholesalePrice || 0;
    const compareAtPrice = prod.inShopsPrice && prod.inShopsPrice > 0 ? prod.inShopsPrice : null;
    const retailPrice = calculateRetailPrice(basePrice, brand);
    const calculatedRetailPrice = calculateFinalPrice(retailPrice, 0);
    console.log(`  💰 Base: €${basePrice} → Retail: €${calculatedRetailPrice.toFixed(2)} | Was: €${compareAtPrice || 'N/A'}`);

    // 13. Weight (BigBuy sends kg, we need grams)
    const weightGrams = (prod.weight || 0) * 1000;

    // 14. Status
    const status: ProductStatus = parsed.confidenceScore >= 80 ? 'PUBLISHED' : 'NEEDS_REVIEW';
    console.log(`  ✅ Confidence: ${parsed.confidenceScore}/100 → Status: ${status}`);

    // 15. Warranty
    const warranty = brand !== 'Unknown' ? `${brand} Manufacturer Warranty` : '2 Years Warranty';

    // 16. Variant name from color
    const variantName = parsed.primaryColor !== 'Unknown' ? parsed.primaryColor : name.split(' ').slice(-3).join(' ');

    // 17. Map images: cover → NO_BG, others → GALLERY
    const assetCreates = images.map((img: any, i: number) => ({
      url: img.url,
      type: img.isCover ? 'NO_BG' : 'GALLERY',
      isPrimary: img.isCover || i === 0,
    }));

    // ──── SAVE TO DB ────
    const commonData = {
      name,
      slug,
      brand,
      description: htmlDesc,
      basePrice,
      compareAtPrice,
      calculatedRetailPrice,
      status,
      confidenceScore: parsed.confidenceScore,
      gender: finalGenders,
      frameWidth: parsed.frameWidth || 0,
      lensWidth: parsed.lensWidth || 0,
      lensHeight: 0,
      bridgeWidth: parsed.bridgeWidth || 0,
      templeLength: parsed.templeLength || 0,
      weightBg: weightGrams,
      frameMaterial: parsed.frameMaterial,
      lensMaterial: parsed.lensMaterial,
      uvProtection: parsed.uvProtection,
      glassShape: parsed.glassShape || null,
      isPolarized: parsed.isPolarized,
      isUVProtection: parsed.isUVProtection,
      warranty,
      categoryId: defaultCategoryId,
    };

    const variantData = {
      name: variantName,
      sku: prod.sku,
      colorName: parsed.primaryColor || 'Default',
      colorHex: hex,
      colorFamily: family,
      lensColor: parsed.lensColor || 'Grey',
      stock: realStock,
    };

    if (type === 'SUNGLASSES') {
      const product = await prisma.product.upsert({
        where: { slug },
        update: {},
        create: {
          ...commonData,
          ProductVariant: {
            create: [{
              ...variantData,
              ProductAsset: { create: assetCreates },
            }],
          },
        },
      });
      console.log(`  ✅ Created Sunglasses: ${product.id}`);
    } else {
      const rx = await prisma.prescriptionGlasses.upsert({
        where: { slug },
        update: {},
        create: {
          ...commonData,
          PrescriptionGlassesVariant: {
            create: [{
              ...variantData,
              PrescriptionGlassesAsset: { create: assetCreates },
            }],
          },
        },
      });
      console.log(`  ✅ Created Prescription Frames: ${rx.id}`);
    }

  } catch (err) {
    console.error(`  ❌ Error processing ${pid}:`, err);
  }
}

// ──────────── Main Runner ────────────

async function syncBigBuyProducts() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   BigBuy → FocusRobin Sync (v2 Fixed)   ║');
  // Delete old test data first
  console.log('\n🗑️  Cleaning old test data...');
  await prisma.product.deleteMany({ where: { confidenceScore: { not: null } } });
  await prisma.prescriptionGlasses.deleteMany({ where: { confidenceScore: { not: null } } });

  let defaultCategory = await prisma.category.findUnique({ where: { name: 'Unisex' } });
  if (!defaultCategory) {
    defaultCategory = await prisma.category.create({ data: { name: 'Unisex' } });
  }

  // Hardcoded IDs for this test batch (verified they exist in BigBuy)
  const sunIds = [34540, 36061, 36079, 35264, 34542];
  const rxIds  = [70601, 111824, 111826, 111827, 111831];

  console.log(`\n📋 Processing ${sunIds.length} sunglasses + ${rxIds.length} prescription frames\n`);

  for (const pid of sunIds) {
    await processProduct(pid, 'SUNGLASSES', defaultCategory.id);
  }

  for (const pid of rxIds) {
    await processProduct(pid, 'PRESCRIPTION', defaultCategory.id);
  }

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║              Sync Complete!              ║');
  console.log('╚══════════════════════════════════════════╝');
}

syncBigBuyProducts().catch(console.error);
