import { PrismaClient } from '@prisma/client';

// Flat, standalone CMS/content tables with no dependency on Product/Category
// (those are handled separately by copy-prod-products-to-dev.ts)
const CONTENT_MODELS = [
  'heroImage',
  'instagramImage',
  'categoryImage',
  'iconicImage',
  'prescriptionGlassesLandingImage',
  'giftBanner',
  'giftForLovedOnesBanner',
  'scrollingBanner',
  'shopBanner',
  'prescriptionShopBanner',
  'settings',
  'navbarSettings',
  'glassShape',
  'brand',
  'splitBanner',
  'colorFamily',
] as const;

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
  for (const model of CONTENT_MODELS) {
    const prodModel = (prod as any)[model];
    const devModel = (dev as any)[model];
    if (!prodModel || !devModel) {
      console.log(`Skipping ${model} (model not found on client)`);
      continue;
    }

    const rows = await prodModel.findMany();
    await devModel.deleteMany({});
    if (rows.length > 0) {
      await devModel.createMany({ data: rows });
    }
    console.log(`${model}: copied ${rows.length} row(s)`);
  }

  await prod.$disconnect();
  await dev.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prod.$disconnect();
  await dev.$disconnect();
  process.exit(1);
});
