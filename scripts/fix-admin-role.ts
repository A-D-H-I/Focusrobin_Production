import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAdminRole() {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.log('Usage: tsx scripts/fix-admin-role.ts <email>');
      console.log('Example: tsx scripts/fix-admin-role.ts user@example.com');
      process.exit(1);
    }

    console.log(`🔧 Setting ${email} as ADMIN...`);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      console.log(`❌ User with email ${email} not found!`);
      console.log('\nAvailable users:');
      const allUsers = await prisma.user.findMany({
        select: { email: true, role: true },
        take: 10,
      });
      allUsers.forEach((u) => {
        console.log(`   - ${u.email} (${u.role})`);
      });
      process.exit(1);
    }

    console.log(`Found user: ${user.email} (Current role: ${user.role})`);

    // Update to ADMIN
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    });

    console.log(`✅ User ${updated.email} is now ${updated.role}`);
    console.log('\n⚠️  IMPORTANT: You need to sign out and sign back in for the changes to take effect!');
    console.log('   The session needs to be refreshed to pick up the new role.');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminRole();

