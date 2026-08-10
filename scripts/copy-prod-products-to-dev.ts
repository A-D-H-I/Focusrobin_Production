import { PrismaClient } from '@prisma/client';

const SAMPLE_SIZE = Number(process.argv[2] ?? 50);

const prodUrl = process.env.PROD_DATABASE_URL;
const devUrl = process.env.DATABASE_URL;

if (!prodUrl || !devUrl) {
  throw new Error('PROD_DATABASE_URL and DATABASE_URL must both be set');
}
if (prodUrl === devUrl) {
  throw new Error('PROD_DATABASE_URL and DATABASE_URL are identical — refusing to run to avoid overwriting production');
}

const prod = new PrismaClient({ datasources: { db: { url: prodUrl } } });
const dev = new PrismaClient({ datasources: { db: { url: devUrl } } });

async function main() {
  console.log(`Fetching up to ${SAMPLE_SIZE} published products from production (read-only)...`);
  const products = await prod.product.findMany({
    where: { status: 'PUBLISHED', ProductVariant: { some: { stock: { gt: 0 } } } },
    take: SAMPLE_SIZE,
    orderBy: { createdAt: 'desc' },
    include: {
      Category: true,
      Offer: true,
      highlights: true,
      ProductVariant: { include: { ProductAsset: true } },
    },
  });
  console.log(`Fetched ${products.length} products.`);

  console.log('Removing placeholder demo products from dev (if present)...');
  await dev.product.deleteMany({ where: { slug: { in: ['the-horizon-aviator', 'urban-drifter'] } } });

  const categoryIdMap = new Map<string, string>();
  let created = 0;
  let skipped = 0;

  for (const p of products) {
    const existing = await dev.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      skipped++;
      continue;
    }

    let devCategoryId = categoryIdMap.get(p.Category.name);
    if (!devCategoryId) {
      const cat = await dev.category.upsert({
        where: { name: p.Category.name },
        create: { name: p.Category.name },
        update: {},
      });
      devCategoryId = cat.id;
      categoryIdMap.set(p.Category.name, devCategoryId);
    }

    await dev.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        description: p.description,
        basePrice: p.basePrice,
        compareAtPrice: p.compareAtPrice,
        calculatedRetailPrice: p.calculatedRetailPrice,
        status: p.status,
        confidenceScore: p.confidenceScore,
        discountPct: p.discountPct,
        cashbackAmount: p.cashbackAmount,
        gender: p.gender,
        tags: p.tags,
        frameWidth: p.frameWidth,
        lensWidth: p.lensWidth,
        lensHeight: p.lensHeight,
        bridgeWidth: p.bridgeWidth,
        templeLength: p.templeLength,
        weightBg: p.weightBg,
        frameMaterial: p.frameMaterial,
        lensMaterial: p.lensMaterial,
        uvProtection: p.uvProtection,
        glassShape: p.glassShape,
        lensBaseImageUrl: p.lensBaseImageUrl,
        lensMaskImageUrl: p.lensMaskImageUrl,
        lensBackgroundImageUrl: p.lensBackgroundImageUrl,
        averageRating: p.averageRating,
        reviewCount: p.reviewCount,
        isNewlyAdded: p.isNewlyAdded,
        isUniqueDesign: p.isUniqueDesign,
        isPolarized: p.isPolarized,
        isUVProtection: p.isUVProtection,
        isHydrophobic: p.isHydrophobic,
        isAntiScratch: p.isAntiScratch,
        isBioBased: p.isBioBased,
        showHighlights: p.showHighlights,
        warranty: p.warranty,
        customFeatures: p.customFeatures,
        categoryId: devCategoryId,
        Offer: p.Offer
          ? {
              create: {
                name: p.Offer.name,
                discountPct: p.Offer.discountPct,
                discountAmt: p.Offer.discountAmt,
                startDate: p.Offer.startDate,
                endDate: p.Offer.endDate,
                isActive: p.Offer.isActive,
              },
            }
          : undefined,
        highlights: {
          create: p.highlights.map((h) => ({
            title: h.title,
            description: h.description,
            imageUrl: h.imageUrl,
            order: h.order,
          })),
        },
        ProductVariant: {
          create: p.ProductVariant.map((v) => ({
            name: v.name,
            sku: v.sku,
            colorName: v.colorName,
            colorHex: v.colorHex,
            colorFamily: v.colorFamily,
            textureImageUrl: v.textureImageUrl,
            lensColor: v.lensColor,
            stock: v.stock,
            price: v.price,
            ProductAsset: {
              create: v.ProductAsset.map((a) => ({
                url: a.url,
                type: a.type,
                isPrimary: a.isPrimary,
              })),
            },
          })),
        },
      },
    });
    created++;
  }

  console.log(`Done. Created ${created} products in dev, skipped ${skipped} already present.`);
  await prod.$disconnect();
  await dev.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prod.$disconnect();
  await dev.$disconnect();
  process.exit(1);
});
