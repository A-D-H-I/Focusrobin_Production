require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const total = await prisma.product.count();
  const withDesc = await prisma.product.count({ where: { description: { not: null } } });
  
  const variants = await prisma.productVariant.findMany({ select: { stock: true, sku: true, updatedAt: true } });
  const hardcoded10 = variants.filter(v => v.stock === 10).length;
  const zero = variants.filter(v => v.stock === 0).length;
  const real = variants.filter(v => v.stock > 0 && v.stock !== 10).length;

  // Get 5 most recently updated variants
  const sorted = [...variants].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

  console.log(`\n📝 DESCRIPTIONS: ${withDesc}/${total} products have HTML descriptions`);
  console.log(`\n📦 STOCK LEVELS (${variants.length} total variants):`);
  console.log(`  stock = 10 (possibly still hardcoded): ${hardcoded10}`);
  console.log(`  stock = 0 (out of stock): ${zero}`);
  console.log(`  other real stock values: ${real}`);
  console.log(`\n🕐 5 most recently updated variants (updatedAt):`);
  sorted.forEach(s => console.log(`  SKU: ${s.sku}, Stock: ${s.stock}, Updated: ${s.updatedAt}`));

  await prisma.$disconnect();
}
main().catch(console.error);
