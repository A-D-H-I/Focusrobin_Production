import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Copied from src/lib/color-palette.ts to ensure script runs independently
const COLOR_PALETTE: Record<string, string> = {
    // Basic Colors
    black: '#000000',
    blue: '#2563EB',
    brown: '#8B4513',
    gold: 'radial-gradient(ellipse at center, #FFD700 0%, #B8860B 100%)',
    green: '#228B22',
    grey: '#808080',
    gray: '#808080',
    orange: '#FFA500',
    pink: '#FFC0CB',
    purple: '#800080',
    red: '#EF4444',
    silver: 'linear-gradient(135deg, #E0E0E0 0%, #A0A0A0 100%)',
    white: '#FFFFFF',
    yellow: '#FACC15',
    beige: '#F5F5DC',

    // Special Finishes
    tortoise: 'linear-gradient(45deg, #3E2723 25%, #D7CCC8 25%, #D7CCC8 50%, #3E2723 50%, #3E2723 75%, #D7CCC8 75%, #D7CCC8 100%)',
    transparent: 'linear-gradient(45deg, #f3f4f6 25%, #ffffff 25%, #ffffff 50%, #f3f4f6 50%, #f3f4f6 75%, #ffffff 75%, #ffffff 100%)',
    "pale apricot": '#FFE5B4',

    // Metals
    rose: '#F43F5E',
    "rose gold": 'linear-gradient(135deg, #F43F5E 0%, #FECDD3 100%)',
    gunmetal: '#2F3542',
};

function capitalize(str: string) {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

async function main() {
    console.log('Seeding ColorFamily table...');

    for (const [key, value] of Object.entries(COLOR_PALETTE)) {
        const name = capitalize(key);

        await prisma.colorFamily.upsert({
            where: { name: name },
            update: {
                hex: value
            },
            create: {
                name: name,
                hex: value
            }
        });
        console.log(`Upserted ColorFamily: ${name}`);
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
