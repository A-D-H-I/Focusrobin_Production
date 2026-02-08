
import { prisma } from '../src/lib/prisma';

async function main() {
    const category = await prisma.category.findUnique({
        where: { name: 'Prescription' },
    });
    console.log('Category:', category);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
