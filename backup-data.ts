import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Querying for data at risk of being dropped...');
  
  // 1. OrderItem - prescriptionGlassesId
  const orderItemsWithPrescription = await prisma.orderItem.findMany({
    where: { prescriptionGlassesId: { not: null } }
  });
  
  // 2. PrescriptionGlasses - compareAtPrice
  const prescriptionGlassesWithCompare = await prisma.prescriptionGlasses.findMany({
    where: { compareAtPrice: { not: null } }
  });
  
  // 3. Product - compareAtPrice
  const productsWithCompare = await prisma.product.findMany({
    where: { compareAtPrice: { not: null } }
  });
  
  const backupData = {
    orderItems: orderItemsWithPrescription,
    prescriptionGlasses: prescriptionGlassesWithCompare,
    products: productsWithCompare
  };
  
  fs.writeFileSync('db-backup-v1.json', JSON.stringify(backupData, null, 2));
  console.log('Backed up data to db-backup-v1.json successfully.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
