import { PrismaClient, AssetType, Gender } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Seeding...');
  await prisma.review.deleteMany();
  await prisma.productAsset.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const user1 = await prisma.user.create({
    data: { email: 'alex@example.com', name: 'Alex V.', role: 'USER' },
  });
  const user2 = await prisma.user.create({
    data: { email: 'sarah@example.com', name: 'Sarah J.', role: 'USER' },
  });

  const catUnisex = await prisma.category.create({ data: { name: 'Unisex' } });
  const catWomen = await prisma.category.create({ data: { name: 'Women' } });

  const product1 = await prisma.product.create({
    data: {
      name: 'The Horizon', slug: 'the-horizon-aviator', description: 'Minimalist aviators.',
      basePrice: 129.00, gender: Gender.UNISEX, tags: ['bestseller'], categoryId: catUnisex.id,
      frameWidth: 140, lensWidth: 58, lensHeight: 50, bridgeWidth: 14, templeLength: 145, weightBg: 24,
      frameMaterial: 'Titanium', uvProtection: 'UV400 Polarized', averageRating: 4.5, reviewCount: 2
    },
  });

  await prisma.productVariant.create({
    data: {
      productId: product1.id, name: 'Jet Blue', sku: 'HRZ-JET-001', colorName: 'Jet Blue', colorHex: '#1C3142', lensColor: 'Black Smoke', stock: 50,
      ProductAsset: { create: [{ url: '/images/products/horizon-blue-main.jpg', type: AssetType.IMAGE_NORMAL, isPrimary: true }, { url: '/images/products/horizon-blue-nobg.png', type: AssetType.IMAGE_NO_BG }, { url: '/models/horizon.glb', type: AssetType.MODEL_GLB }] },
    },
  });

  await prisma.productVariant.create({
    data: {
      productId: product1.id, name: 'Atomic Pink', sku: 'HRZ-PNK-002', colorName: 'Atomic Pink', colorHex: '#F56278', lensColor: 'Rose Gold Mirror', stock: 15,
      ProductAsset: { create: [{ url: '/images/products/horizon-pink-main.jpg', type: AssetType.IMAGE_NORMAL, isPrimary: true }] },
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: 'The Urban Drifter', slug: 'urban-drifter', description: 'Bold frames.',
      basePrice: 89.00, gender: Gender.WOMEN, tags: ['new-arrival'], categoryId: catWomen.id,
      frameWidth: 142, lensWidth: 52, lensHeight: 48, bridgeWidth: 18, templeLength: 140, weightBg: 32,
      frameMaterial: 'Acetate', uvProtection: 'UV400',
      Offer: { create: { name: 'Summer Launch', discountPct: 15, startDate: new Date(), endDate: new Date('2025-12-31') } }
    },
  });

  await prisma.productVariant.create({
    data: {
      productId: product2.id, name: 'Teal', sku: 'URB-TEAL-001', colorName: 'Teal', colorHex: '#4DCECA', lensColor: 'Grey Gradient', stock: 100,
      ProductAsset: { create: [{ url: '/images/products/urban-teal-main.jpg', type: AssetType.IMAGE_NORMAL, isPrimary: true }] },
    },
  });

  await prisma.review.create({
    data: { productId: product1.id, userId: user1.id, rating: 5, title: 'Love clarity!', comment: 'Great design.', images: ['/images/reviews/u1.jpg'] },
  });

  console.log('✅ Seeding Complete!');
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });

