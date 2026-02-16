import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting color family backfill...');

    // 1. Update ProductVariant
    const productVariants = await prisma.productVariant.findMany();
    console.log(`Found ${productVariants.length} product variants.`);

    for (const variant of productVariants) {
        if (!variant.colorName) continue;
        const family = determineColorFamily(variant.colorName, variant.colorHex);
        let textureUrl = null;

        if (family === 'Tortoise') {
            // Placeholder texture
            textureUrl = 'https://placehold.co/50x50/5C4033/D2B48C/png?text=T';
        }

        if (family) {
            await prisma.productVariant.update({
                where: { id: variant.id },
                data: {
                    colorFamily: family,
                    textureImageUrl: textureUrl
                },
            });
            console.log(`Updated PV: ${variant.colorName} -> ${family}`);
        }
    }

    // 2. Update PrescriptionGlassesVariant
    const prescriptionVariants = await prisma.prescriptionGlassesVariant.findMany();
    console.log(`Found ${prescriptionVariants.length} prescription variants.`);

    for (const variant of prescriptionVariants) {
        if (!variant.colorName) continue;

        const family = determineColorFamily(variant.colorName, variant.colorHex);
        let textureUrl = null;

        if (family === 'Tortoise') {
            // Placeholder texture
            textureUrl = 'https://placehold.co/50x50/5C4033/D2B48C/png?text=T';
        }

        if (family) {
            await prisma.prescriptionGlassesVariant.update({
                where: { id: variant.id },
                data: {
                    colorFamily: family,
                    textureImageUrl: textureUrl
                },
            });
            console.log(`Updated PGV: ${variant.colorName} -> ${family}`);
        }
    }

    console.log('Backfill complete.');
}

function determineColorFamily(name: string, hex: string): string | null {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('black') || lowerName.includes('dark')) return 'Black';
    if (lowerName.includes('blue') || lowerName.includes('navy') || lowerName.includes('teal')) return 'Blue';
    if (lowerName.includes('brown') || lowerName.includes('coffee') || lowerName.includes('havana')) return 'Brown';
    if (lowerName.includes('tortoise') || lowerName.includes('demi')) return 'Tortoise';
    if (lowerName.includes('gold') || lowerName.includes('rose gold')) return 'Gold';
    if (lowerName.includes('silver') || lowerName.includes('grey') || lowerName.includes('gray') || lowerName.includes('gun')) return 'Silver';
    if (lowerName.includes('transparent') || lowerName.includes('crystal') || lowerName.includes('clear')) return 'Transparent';
    if (lowerName.includes('red') || lowerName.includes('burgundy') || lowerName.includes('pink')) return 'Red';
    if (lowerName.includes('green') || lowerName.includes('olive')) return 'Green';
    if (lowerName.includes('purple') || lowerName.includes('violet')) return 'Purple';
    if (lowerName.includes('orange') || lowerName.includes('amber')) return 'Orange';
    if (lowerName.includes('yellow')) return 'Yellow';
    if (lowerName.includes('white')) return 'White';

    return null;
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
