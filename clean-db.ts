import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Deleting CaretItems and Wishlist items with null productId...');
  
  const cartRes = await prisma.$executeRawUnsafe('DELETE FROM "CartItem" WHERE "productId" IS NULL;');
  console.log(`Deleted ${cartRes} CartItem(s)`);
  
  const wishRes = await prisma.$executeRawUnsafe('DELETE FROM "Wishlist" WHERE "productId" IS NULL;');
  console.log(`Deleted ${wishRes} Wishlist item(s)`);
  
  console.log('Cleanup completed successfully!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
