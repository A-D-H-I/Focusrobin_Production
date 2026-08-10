import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const productResult = await prisma.productVariant.updateMany({
    where: { Product: { supplier: 'BIGBUY' } },
    data: { stock: 0 },
  });
  console.log(`ProductVariant (sunglasses) rows zeroed: ${productResult.count}`);

  const rxResult = await prisma.prescriptionGlassesVariant.updateMany({
    where: { PrescriptionGlasses: { supplier: 'BIGBUY' } },
    data: { stock: 0 },
  });
  console.log(`PrescriptionGlassesVariant (optical frames) rows zeroed: ${rxResult.count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
