import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
dotenv.config();

const prisma = new PrismaClient();

function calculateRetailPrice(wholesalePrice: number): number {
  if (wholesalePrice <= 0) return 0;
  return Math.round(wholesalePrice * 2.5 * 100) / 100;
}

async function main() {
  const products = await prisma.product.findMany({
    where: { supplier: 'BLUEBERRY' },
    select: { id: true, basePrice: true },
  });
  let updated = 0;
  for (const p of products) {
    await prisma.product.update({
      where: { id: p.id },
      data: { calculatedRetailPrice: calculateRetailPrice(Number(p.basePrice)) },
    });
    updated++;
  }
  console.log(`Products updated: ${updated}`);

  const rx = await prisma.prescriptionGlasses.findMany({
    where: { supplier: 'BLUEBERRY' },
    select: { id: true, basePrice: true },
  });
  let rxUpdated = 0;
  for (const p of rx) {
    await prisma.prescriptionGlasses.update({
      where: { id: p.id },
      data: { calculatedRetailPrice: calculateRetailPrice(Number(p.basePrice)) },
    });
    rxUpdated++;
  }
  console.log(`PrescriptionGlasses updated: ${rxUpdated}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
