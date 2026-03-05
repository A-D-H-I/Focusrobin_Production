import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function run() {
  const filterType = 'Bottega Veneta'; // Example from mega menu
  const whereClause: any = {};
  
  // What the existing code does:
  // if (!hasAdditionalFilters) {
  //   if (filterType === 'new-arrivals') {
  //     whereClause.isNewlyAdded = true;
  //   } else if (filterType === 'bestsellers') {
  //     whereClause.isUniqueDesign = true;
  //   }
  // }
  
  console.log("Empty whereClause:", await prisma.product.count({ where: whereClause }));
  
  // Real fix: filterType is a brand name
  whereClause.brand = {
      equals: filterType,
      mode: 'insensitive'
  };
  console.log("Filtered whereClause:", await prisma.product.count({ where: whereClause }));
}
run();
