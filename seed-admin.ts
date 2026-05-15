import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  const productCount = await prisma.product.count();
  const categoryCount = await prisma.category.count();
  
  console.log('--- DATABASE CHECK (Dev Database) ---');
  console.log(`Users count: ${userCount}`);
  console.log(`Products count: ${productCount}`);
  console.log(`Categories count: ${categoryCount}`);
  console.log('-------------------------------------');
  
  const email = 'testemail@test.com';
  const password = await bcrypt.hash('test', 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN', password },
    create: {
      email,
      password,
      role: 'ADMIN',
      name: 'Test Admin',
    },
  });
  
  console.log('--- TEST ADMIN CREATED/UPDATED ---');
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
