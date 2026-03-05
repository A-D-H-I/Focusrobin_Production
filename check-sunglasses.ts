import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function run() {
    const sunglasses = await prisma.productVariant.findMany({ select: { id: true, colorFamily: true } });
    const sunglassesWithColor = sunglasses.filter(s => s.colorFamily !== null);
    console.log(`Sunglasses variants: ${sunglasses.length}, with colorFamily: ${sunglassesWithColor.length}`);
}

run();
