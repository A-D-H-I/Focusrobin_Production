import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const p = await prisma.product.findFirst({
        where: { slug: 'the-test1' },
        select: { frameMaterial: true, lensMaterial: true, uvProtection: true }
    });
    console.log("Sunglasses test1:", p);

    const pg = await prisma.prescriptionGlasses.findFirst({
        where: { slug: 'the-zips-zp4105' },
        select: { frameMaterial: true, lensMaterial: true, uvProtection: true }
    });
    console.log("Prescription zp4105:", pg);

    // Print any that have "Plastic"
    const plastic = await prisma.product.findMany({
        where: { frameMaterial: 'Plastic' },
        select: { slug: true }
    });
    console.log("Products with Plastic frame:", plastic);

}
main().catch(console.error).finally(() => prisma.$disconnect());
