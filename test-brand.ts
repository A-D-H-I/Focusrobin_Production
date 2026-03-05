import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function run() {
  const products = await prisma.product.findMany({ select: { id: true, name: true, brand: true }, take: 5 });
  console.log("Products:", products);
  const px = await prisma.prescriptionGlasses.findMany({ select: { id: true, name: true, brand: true }, take: 5 });
  console.log("PG:", px);
}
run();
