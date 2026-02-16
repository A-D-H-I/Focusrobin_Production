
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // List all categories
    const categories = await prisma.category.findMany();
    console.log('=== ALL CATEGORIES ===');
    categories.forEach(c => console.log(`  ID: ${c.id}, Name: "${c.name}"`));

    // Find Rupert product and its category
    const rupert = await prisma.product.findFirst({
        where: { name: { contains: 'Rupert', mode: 'insensitive' } },
        include: { Category: true },
    });

    if (rupert) {
        console.log('\n=== RUPERT PRODUCT ===');
        console.log(`  Name: ${rupert.name}`);
        console.log(`  CategoryId: ${rupert.categoryId}`);
        console.log(`  Category Name: "${rupert.Category.name}"`);
    } else {
        console.log('\nRupert product NOT FOUND');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
