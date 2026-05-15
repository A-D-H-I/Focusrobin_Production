import { NextRequest, NextResponse } from 'next/server';

// ─── Name Cleaning ────────────────────────────────────────────────────────────
const PREFIXES_TO_STRIP = [
  "ladies' sunglasses",
  "ladies sunglasses",
  "unisex sunglasses",
  "men's sunglasses",
  "mens sunglasses",
  "women's sunglasses",
  "womens sunglasses",
  "ladies' spectacle frame",
  "ladies spectacle frame",
  "unisex spectacle frame",
  "men's spectacle frame",
  "mens spectacle frame",
];

function cleanName(raw: string): string {
  let name = raw.trim();
  for (const prefix of PREFIXES_TO_STRIP) {
    if (name.toLowerCase().startsWith(prefix)) {
      name = name.slice(prefix.length).trim();
      break;
    }
  }
  // Handle :: delimiter — keep both parts as "Brand Model" for the display name
  if (name.includes('::')) {
    name = name.replace('::', ' ');
  }
  const tokens = name.split(/\s+/);
  while (tokens.length > 0) {
    const last = tokens[tokens.length - 1];
    if (last.includes('_')) break;
    const isColorCode = /^\d{2}[A-Z0-9]{1,}/i.test(last);
    const isPlainColor = /^(black|golden|gold|white|red|blue|green|grey|gray|brown|pink|silver|nude|beige|clear|transparent|purple|violet|orange|copper|navy|ivory|rose|burgundy)$/i.test(last);
    if (isColorCode || isPlainColor) tokens.pop();
    else break;
  }
  return tokens.join(' ').trim().replace(/[-_]+$/, '');
}

// ─── Brand Extraction ─────────────────────────────────────────────────────────
function extractBrand(name: string): string {
  // 1. If the user's LLM separated brand and model using "::" (e.g., "Tommy Hilfiger::TH 2344_S")
  if (name.includes('::')) {
    return name.split('::')[0].trim();
  }

  // 2. Fallback heuristic: take words until we hit a number or a likely model prefix
  const tokens = cleanName(name).split(' ');
  const brandTokens = [];
  for (const token of tokens) {
    // If token has a digit, it's the start of the model (e.g., GU00216)
    if (/\d/.test(token)) break;
    
    // If token is fully uppercase and we already have a brand word, 
    // it's likely a model prefix (e.g., "Polaroid PLD" -> "PLD", "Tommy Hilfiger TH" -> "TH")
    // Note: This heuristic might mistakenly split brands like "LIU JO" into "LIU".
    if (/^[A-Z]{2,}$/.test(token) && brandTokens.length > 0) break;
    
    brandTokens.push(token);
  }
  return brandTokens.join(' ').trim() || 'Unknown';
}

// ─── Parse CSV text ────────────────────────────────────────────────────────────
function parseCSVText(text: string): Array<{
  sku: string;
  name: string;
  cleanedName: string;
  brand: string;
  imageUrl: string;
  stockA: number;
  pvd: number;
  pvr: number;
  category: string;
}> {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    if (cols.length < 15) continue;
    const pvd = parseFloat(cols[11]);
    const pvr = parseFloat(cols[14]);
    if (isNaN(pvd) || pvd <= 0) continue;

    const name = cols[1]?.trim() || '';
    // We'll determine brand after collecting all brands
    rows.push({
      sku: cols[0]?.trim() || '',
      name,
      cleanedName: cleanName(name),
      brand: '',
      imageUrl: cols[2]?.trim() || '',
      stockA: parseInt(cols[4]) || 0,
      pvd,
      pvr: isNaN(pvr) ? 0 : pvr,
      category: cols[16]?.trim().replace(/\r/g, '') || 'Sunglasses',
    });
  }
  return rows;
}

// ─── GET: Parse CSV and return available brands ───────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSVText(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid rows found in CSV' }, { status: 400 });
    }

    // Auto-detect brands from all product names
    const brandCounts: Record<string, number> = {};
    for (const row of rows) {
      const brand = extractBrand(row.name);
      row.brand = brand;
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    }

    const brands = Object.entries(brandCounts)
      .filter(([b]) => b !== 'Unknown' && b.length > 1)
      .sort((a, b) => b[1] - a[1]) // sort by count desc
      .map(([brand, count]) => ({ brand, count }));

    return NextResponse.json({ brands, totalRows: rows.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
