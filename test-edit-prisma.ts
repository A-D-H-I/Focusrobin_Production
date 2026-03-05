import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function run() {
  const variant = await prisma.prescriptionGlassesVariant.findFirst({
    where: { colorFamily: { not: null } }
  });
  console.log("Variant with family:", variant);
}

run();
