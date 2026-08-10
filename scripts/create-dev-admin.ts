import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const EMAIL = process.argv[2] ?? 'admin@focusrobin.local';
const PASSWORD = process.argv[3] ?? 'DevAdmin123!';

async function main() {
  const prisma = new PrismaClient();
  const hashed = await bcrypt.hash(PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    create: { email: EMAIL, name: 'Dev Admin', password: hashed, role: 'ADMIN' },
    update: { password: hashed, role: 'ADMIN' },
  });

  console.log(`Admin user ready: ${user.email} / ${PASSWORD}`);
  await prisma.$disconnect();
}

main();
