import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up any possible Wishlist duplicates before pushing...');
  try {
    // Delete older duplicates and keep newest
    await prisma.$executeRawUnsafe(`
      DELETE FROM "Wishlist"
      WHERE id IN (
        SELECT id
        FROM (
          SELECT id, ROW_NUMBER() OVER (partition BY "userId", "productId" ORDER BY "id" DESC) as rnum
          FROM "Wishlist"
        ) t
        WHERE t.rnum > 1
      );
    `);
    console.log('Wishlist duplicates cleaned.');
  } catch (e: any) {
    console.log('No wishlist duplicates or error:', e.message);
  }

  // Push the schema changes directly
  console.log('\\nNow applying DB PUSH via command line...');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
