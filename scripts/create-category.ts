
import { prisma } from '@/lib/prisma';

async function main() {
    const category = await prisma.category.upsert({
        where: { name: 'Prescription' },
        update: {},
        create: {
            name: 'Prescription',
        },
    });
    console.log('Created Category:', category);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
