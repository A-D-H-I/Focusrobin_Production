import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function run() {
    const variants = await prisma.prescriptionGlassesVariant.findMany({
        select: { id: true, name: true, colorHex: true, colorFamily: true }
    });
    console.log("Eyeglasses Variants:");
    console.log(JSON.stringify(variants, null, 2));
}

run();
