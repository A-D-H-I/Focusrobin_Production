import fs from 'fs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({ select: { brand: true } });
  const allBrands = new Set(products.map(p => p.brand).filter(Boolean));
  console.log("DB BRANDS:", allBrands.size);
}
main().catch(console.error).finally(() => prisma.$disconnect());
