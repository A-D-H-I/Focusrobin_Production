import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function run() {
  const products = await prisma.product.findMany({ select: { name: true, tags: true }, take: 1 });
  console.log("Sunglasses:", products);
  const px = await prisma.prescriptionGlasses.findMany({ select: { name: true, tags: true }, take: 1 });
  console.log("Prescription:", px);
}
run();
