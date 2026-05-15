/**
 * Fix product names in DB: 
 * "Ladies' Sunglasses Max Mara MM0096 5728Z" → "Max Mara MM0096"
 * Keep: Brand + Model Number only. Strip prefix + color/size suffix.
 */
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

// Strips: "Ladies' Sunglasses", "Unisex Sunglasses", "Men's Sunglasses", etc.
const PREFIXES = [
  "ladies' sunglasses",
  "ladies sunglasses",
  "unisex sunglasses",
  "men's sunglasses",
  "mens sunglasses",
  "women's sunglasses",
  "womens sunglasses",
];

// Model number pattern: uppercase letters + digits + optional separators (e.g. MM0096, GU00216, TH 2344_S)
// We keep everything up to and including the model number, drop trailing color/size codes
function cleanName(raw: string): string {
  let name = raw.trim();

  // 1. Remove known prefixes (case-insensitive)
  for (const prefix of PREFIXES) {
    if (name.toLowerCase().startsWith(prefix)) {
      name = name.slice(prefix.length).trim();
      break;
    }
  }

  // 2. Remove leading "by" junk (e.g. "by Marciano" is fine, keep it)
  // Nothing needed here

  // 3. Split into tokens and find where the model number ends
  //    Model tokens look like: MM0096, GU00216, TH, 2344_S, PLD6002, BOSS1653_S
  //    Color/size codes look like: 5728Z, 52807IR, 5674T, KB7MU (pure alphanumeric, no obvious brand/model pattern)
  //    Strategy: find the LAST token that looks like a model identifier (has digits + may have letters)
  //    and drop anything after the first "pure color code" token

  // 3. Strip trailing color/size codes
  // These are tokens at the END of the name that start with 2+ digits, e.g.: 5728Z, 52807IR, 5674T, 56NOA70
  // BUT NOT tokens that are model numbers with underscores like 2344_S, 3087_S, 4205_G_S_X
  // Rule: if a token contains an underscore, it's a model variant code → KEEP it
  const tokens = name.split(/\s+/);
  while (tokens.length > 0) {
    const last = tokens[tokens.length - 1];
    // Keep tokens that contain underscores (they're model variant codes like 2344_S)
    if (last.includes('_')) break;
    // Strip if it's a pure color/size code: starts with 2 digits
    const isColorCode = /^\d{2}[A-Z0-9]{1,}/i.test(last);
    // Strip if it's a plain color word
    const isPlainColor = /^(black|golden|gold|white|red|blue|green|grey|gray|brown|pink|silver|nude|beige|clear|transparent|purple|violet|orange|copper|navy|ivory|rose|burgundy)$/i.test(last);
    if (isColorCode || isPlainColor) {
      tokens.pop();
    } else {
      break;
    }
  }
  name = tokens.join(' ').trim();

  // 4. Clean trailing punctuation/spaces
  name = name.replace(/[,\-_]+$/, '').trim();

  return name;
}

async function run() {
  const products = await prisma.product.findMany({ select: { id: true, name: true } });
  console.log(`Updating ${products.length} product names...\n`);

  let updated = 0;
  for (const p of products) {
    const cleaned = cleanName(p.name);
    if (cleaned !== p.name) {
      await prisma.product.update({
        where: { id: p.id },
        data: { name: cleaned },
      });
      console.log(`  "${p.name}"`);
      console.log(`  → "${cleaned}"\n`);
      updated++;
    }
  }

  console.log(`\n✅ Updated ${updated} names.`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
