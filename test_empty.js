import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const emptyFrames = await prisma.prescriptionGlasses.findMany({
        where: { frameMaterial: "" },
        select: { slug: true }
    });
    console.log("Prescription glasses with EMPTY frameMaterial:", emptyFrames);

    const emptyLens = await prisma.prescriptionGlasses.findMany({
        where: { lensMaterial: "" },
        select: { slug: true }
    });
    console.log("Prescription glasses with EMPTY lensMaterial:", emptyLens);

    const emptySpecsi = await prisma.product.findMany({
        where: { frameMaterial: "" },
        select: { slug: true }
    });
    console.log("Products with EMPTY frameMaterial:", emptySpecsi);
}

main().catch(console.error).finally(() => prisma.$disconnect());
