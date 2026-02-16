import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning up all seeded color data...');

    // 1. Delete all ColorFamily records
    const deleted = await prisma.colorFamily.deleteMany({});
    console.log(`Deleted ${deleted.count} ColorFamily records.`);

    // 2. Clear colorFamily from all ProductVariants
    const pvResult = await prisma.productVariant.updateMany({
        where: { colorFamily: { not: null } },
        data: { colorFamily: null },
    });
    console.log(`Cleared colorFamily from ${pvResult.count} ProductVariants.`);

    // 3. Clear colorFamily from all PrescriptionGlassesVariants
    const pgvResult = await prisma.prescriptionGlassesVariant.updateMany({
        where: { colorFamily: { not: null } },
        data: { colorFamily: null },
    });
    console.log(`Cleared colorFamily from ${pgvResult.count} PrescriptionGlassesVariants.`);

    console.log('Done! You can now create color families from scratch in the admin panel.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
