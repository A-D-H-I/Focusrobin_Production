const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const p = await prisma.product.findMany({ select: { name: true, basePrice: true, discountPct: true, slug: true }, take: 5, orderBy: { createdAt: 'desc' } });
    console.log(JSON.stringify(p, null, 2));
}
main().finally(() => prisma.$disconnect());
