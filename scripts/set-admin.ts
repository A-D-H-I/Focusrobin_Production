/**
 * Script to set a user as ADMIN
 * 
 * Usage: npx ts-node scripts/set-admin.ts your-email@example.com
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.error("Usage: npx ts-node scripts/set-admin.ts your-email@example.com");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  console.log(`Current role for ${email}: ${user.role}`);

  if (user.role === "ADMIN") {
    console.log("User is already an ADMIN");
    process.exit(0);
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });

  console.log(`✅ Updated ${email} to ADMIN`);
  console.log("Please log out and log back in for changes to take effect");
}

setAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
