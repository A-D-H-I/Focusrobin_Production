import { PrismaClient, AssetType, Gender } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Seeding...');
  
  // Delete in order respecting foreign key constraints
  // Delete records that reference other records first
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.productAsset.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  
  // CurrencyRate might not exist if migration hasn't run yet
  try {
    await prisma.currencyRate.deleteMany();
  } catch (error: any) {
    if (error.code !== 'P2021') { // P2021 = table does not exist
      throw error;
    }
    console.log('⚠️  CurrencyRate table does not exist yet (migration not run). Skipping delete.');
  }

  // Seed Currency Rates (Base currency: EUR)
  console.log('💱 Seeding Currency Rates...');
  const currencyRates = [
    // Euro Zone (all use EUR)
    { code: 'EUR', rate: 1.0, symbol: '€', name: 'Euro' },
    
    // Non-Euro European Countries
    { code: 'BGN', rate: 1.96, symbol: 'лв', name: 'Bulgarian Lev' },
    { code: 'CZK', rate: 25.21, symbol: 'Kč', name: 'Czech Koruna' },
    { code: 'DKK', rate: 7.46, symbol: 'kr', name: 'Danish Krone' },
    { code: 'HUF', rate: 395.50, symbol: 'Ft', name: 'Hungarian Forint' },
    { code: 'ISK', rate: 150.0, symbol: 'kr', name: 'Icelandic Króna' },
    { code: 'PLN', rate: 4.32, symbol: 'zł', name: 'Polish Złoty' },
    { code: 'RON', rate: 4.97, symbol: 'lei', name: 'Romanian Leu' },
    { code: 'SEK', rate: 11.42, symbol: 'kr', name: 'Swedish Krona' },
    { code: 'NOK', rate: 11.78, symbol: 'kr', name: 'Norwegian Krone' },
    { code: 'CHF', rate: 0.94, symbol: 'Fr', name: 'Swiss Franc' },
    
    // Additional currencies
    { code: 'USD', rate: 1.08, symbol: '$', name: 'US Dollar' },
    { code: 'GBP', rate: 0.86, symbol: '£', name: 'British Pound' },
  ];

  for (const currency of currencyRates) {
    await prisma.currencyRate.upsert({
      where: { code: currency.code },
      update: { rate: currency.rate, symbol: currency.symbol, name: currency.name },
      create: currency,
    });
  }
  console.log('✅ Currency Rates seeded!');

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
      basePrice: 129.00, gender: [Gender.UNISEX], tags: ['bestseller'], categoryId: catUnisex.id,
      frameWidth: 140, lensWidth: 58, lensHeight: 50, bridgeWidth: 14, templeLength: 145, weightBg: 24,
      frameMaterial: 'Titanium', uvProtection: 'UV400 Polarized', averageRating: 4.5, reviewCount: 2
    },
  });

  await prisma.productVariant.create({
    data: {
      productId: product1.id, name: 'Jet Blue', sku: 'HRZ-JET-001', colorName: 'Jet Blue', colorHex: '#1C3142', lensColor: 'Black Smoke', stock: 50,
      ProductAsset: { create: [{ url: '/images/products/horizon-blue-main.jpg', type: AssetType.GALLERY, isPrimary: true }, { url: '/images/products/horizon-blue-nobg.png', type: AssetType.NO_BG }, { url: '/models/horizon.glb', type: AssetType.GLB }] },
    },
  });

  await prisma.productVariant.create({
    data: {
      productId: product1.id, name: 'Atomic Pink', sku: 'HRZ-PNK-002', colorName: 'Atomic Pink', colorHex: '#F56278', lensColor: 'Rose Gold Mirror', stock: 15,
      ProductAsset: { create: [{ url: '/images/products/horizon-pink-main.jpg', type: AssetType.GALLERY, isPrimary: true }] },
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: 'The Urban Drifter', slug: 'urban-drifter', description: 'Bold frames.',
      basePrice: 89.00, gender: [Gender.WOMEN], tags: ['new-arrival'], categoryId: catWomen.id,
      frameWidth: 142, lensWidth: 52, lensHeight: 48, bridgeWidth: 18, templeLength: 140, weightBg: 32,
      frameMaterial: 'Acetate', uvProtection: 'UV400',
      Offer: { create: { name: 'Summer Launch', discountPct: 15, startDate: new Date(), endDate: new Date('2025-12-31') } }
    },
  });

  await prisma.productVariant.create({
    data: {
      productId: product2.id, name: 'Teal', sku: 'URB-TEAL-001', colorName: 'Teal', colorHex: '#4DCECA', lensColor: 'Grey Gradient', stock: 100,
      ProductAsset: { create: [{ url: '/images/products/urban-teal-main.jpg', type: AssetType.GALLERY, isPrimary: true }] },
    },
  });

  await prisma.review.create({
    data: { productId: product1.id, userId: user1.id, rating: 5, title: 'Love clarity!', comment: 'Great design.', images: ['/images/reviews/u1.jpg'] },
  });

  console.log('✅ Seeding Complete!');
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });

