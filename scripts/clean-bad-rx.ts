import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
  const badSlugs = [
    'ngs-wix30-bb1300129',
    'philips-shp2500-bb1300130',
    'xiaomi-ax3000t-bb1300128',
    'philips-shp2500-bb1300118', // guessing if others were created
    's05152146-bb1300105'
  ];

  console.log('Cleaning up bogus prescription glasses...');
  const res = await prisma.prescriptionGlasses.deleteMany({
    where: {
      OR: [
        { slug: { in: badSlugs } },
        { name: { contains: 'Headphone' } },
        { name: { contains: 'Powerbank' } },
        { name: { contains: 'Router' } }
      ]
    }
  });
  console.log(`Deleted ${res.count} bogus products.`);
}

clean()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
