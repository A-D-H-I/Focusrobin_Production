import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setAdmin() {
  try {
    // Find user by email or create if doesn't exist
    const email = 'adaikkappanhariharan@gmail.com';
    
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'ADMIN',
      },
      create: {
        email,
        name: 'Admin User',
        role: 'ADMIN',
      },
    });

    console.log(`✅ User ${email} is now an ADMIN`);
    console.log(`User ID: ${user.id}`);
    console.log(`Role: ${user.role}`);
  } catch (error) {
    console.error('Error setting admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setAdmin();

