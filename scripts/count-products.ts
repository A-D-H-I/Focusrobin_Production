import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const [productTotal, rxTotal, productBySupplier, rxBySupplier] = await Promise.all([
    prisma.product.count(),
    prisma.prescriptionGlasses.count(),
    prisma.product.groupBy({ by: ["supplier"], _count: true }),
    prisma.prescriptionGlasses.groupBy({ by: ["supplier"], _count: true }),
  ]);
  console.log("=== Product (Sunglasses) ===");
  console.log("Total:", productTotal);
  console.log(productBySupplier);
  console.log("=== PrescriptionGlasses (Optical Frames) ===");
  console.log("Total:", rxTotal);
  console.log(rxBySupplier);
  console.log("=== Combined Total ===", productTotal + rxTotal);
}
main().catch(console.error).finally(() => prisma.$disconnect());
