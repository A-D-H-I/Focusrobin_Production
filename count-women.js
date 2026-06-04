const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const womenCount = await prisma.product.count({
    where: {
      gender: {
        has: 'WOMEN'
      }
    }
  });
  
  const unisexCount = await prisma.product.count({
    where: {
      gender: {
        has: 'UNISEX'
      }
    }
  });

  const totalCount = await prisma.product.count();

  console.log(`Total Products: ${totalCount}`);
  console.log(`Women's products (including Unisex): ${womenCount + unisexCount} (Strictly Women: ${womenCount}, Unisex: ${unisexCount})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
