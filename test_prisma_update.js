import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const p = await prisma.product.findFirst({
        where: { slug: 'the-test1' }
    });
    if (p) {
        console.log("Updating test1 to empty string");
        await prisma.product.update({
            where: { id: p.id },
            data: { frameMaterial: "", lensMaterial: "" }
        });
        const after = await prisma.product.findFirst({ where: { slug: 'the-test1' } });
        console.log("After update:", after?.frameMaterial, after?.lensMaterial);
    }

    const pg = await prisma.prescriptionGlasses.findFirst({
        where: { slug: 'the-zips-zp4105' }
    });
    if (pg) {
        console.log("Updating zp4105 to empty string");
        await prisma.prescriptionGlasses.update({
            where: { id: pg.id },
            data: { frameMaterial: "", lensMaterial: "" }
        });
        const afterPg = await prisma.prescriptionGlasses.findFirst({ where: { slug: 'the-zips-zp4105' } });
        console.log("After PG update:", afterPg?.frameMaterial, afterPg?.lensMaterial);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
