import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
dotenv.config();

const prisma = new PrismaClient();

async function wipeAll() {
  console.log('🗑️  Wiping all products, variants, assets, brands...');

  // Delete in dependency order
  await prisma.productAsset.deleteMany({});
  console.log('  ✅ ProductAsset');
  await prisma.productVariant.deleteMany({});
  console.log('  ✅ ProductVariant');
  await prisma.review.deleteMany({});
  console.log('  ✅ Review');
  await prisma.wishlist.deleteMany({});
  console.log('  ✅ Wishlist');
  await prisma.cartItem.deleteMany({});
  console.log('  ✅ CartItem');
  await prisma.offer.deleteMany({});
  console.log('  ✅ Offer');
  await prisma.productHighlight.deleteMany({});
  console.log('  ✅ ProductHighlight');
  await prisma.product.deleteMany({});
  console.log('  ✅ Product');

  // Prescription glasses
  await prisma.prescriptionGlassesAsset.deleteMany({});
  console.log('  ✅ PrescriptionGlassesAsset');
  await prisma.prescriptionGlassesVariant.deleteMany({});
  console.log('  ✅ PrescriptionGlassesVariant');
  await prisma.prescriptionGlasses.deleteMany({});
  console.log('  ✅ PrescriptionGlasses');

  // Categories
  await prisma.category.deleteMany({});
  console.log('  ✅ Category');

  console.log('\n✅ Database fully wiped.');
}

wipeAll()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
