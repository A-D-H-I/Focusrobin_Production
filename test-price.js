const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { brand: 'Hawkers' },
    take: 5,
    select: { name: true, basePrice: true, discountPct: true, compareAtPrice: true, brand: true }
  });
  console.log(products);
}

main().catch(console.error).finally(() => prisma.$disconnect());
