/**
 * Script to create an admin user with email and password
 * 
 * Usage: tsx scripts/create-admin-user.ts <email> <password> <name>
 * Example: tsx scripts/create-admin-user.ts adaikkappanhariharan@gmail.com hariharan Hariharan
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

async function createAdminUser() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || "Admin User";
  
  if (!email || !password) {
    console.error("Usage: tsx scripts/create-admin-user.ts <email> <password> [name]");
    console.error("Example: tsx scripts/create-admin-user.ts adaikkappanhariharan@gmail.com hariharan Hariharan");
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase();

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      console.log(`User ${normalizedEmail} already exists. Updating to ADMIN role...`);
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update user to ADMIN with new password
      const updated = await prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          role: "ADMIN",
          password: hashedPassword,
          name: name,
        },
      });

      console.log(`✅ Updated ${updated.email} to ADMIN with new password`);
      console.log(`   Name: ${updated.name}`);
      console.log(`   Role: ${updated.role}`);
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create new admin user
      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: name,
          password: hashedPassword,
          role: "ADMIN",
          emailVerified: new Date(), // Mark email as verified
        },
      });

      console.log(`✅ Created admin user:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
    }

    console.log("\n⚠️  IMPORTANT: You can now sign in with this account!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();

