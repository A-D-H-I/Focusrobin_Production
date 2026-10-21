import { prisma } from '@/lib/prisma';
import { calculateRetailPrice } from '@/lib/price-utils';
import { SITE_URL } from '@/i18n/config';

/**
 * /llms.txt — a Markdown summary of the store for AI assistants and LLM crawlers
 * (format: https://llmstxt.org). Built per request from the database so new
 * products and brands appear without a redeploy.
 */
export const dynamic = 'force-dynamic';

const PRODUCT_LIMIT = 40;

function formatPrice(calculated: unknown, base: unknown, brand: string): string {
  const price = calculated ? Number(calculated) : calculateRetailPrice(Number(base), brand);
  return `€${price.toFixed(2)}`;
}

async function getCatalogSections(): Promise<string> {
  const inStock = { status: 'PUBLISHED' as const };
  const [sunglasses, eyeglasses, sunglassBrands, eyeglassBrands] = await Promise.all([
    prisma.product.findMany({
      where: { ...inStock, ProductVariant: { some: { stock: { gt: 0 } } } },
      select: { name: true, slug: true, brand: true, basePrice: true, calculatedRetailPrice: true },
      orderBy: [{ reviewCount: 'desc' }, { updatedAt: 'desc' }],
      take: PRODUCT_LIMIT,
    }),
    prisma.prescriptionGlasses.findMany({
      where: { ...inStock, PrescriptionGlassesVariant: { some: { stock: { gt: 0 } } } },
      select: { name: true, slug: true, brand: true, basePrice: true, calculatedRetailPrice: true },
      orderBy: [{ reviewCount: 'desc' }, { updatedAt: 'desc' }],
      take: PRODUCT_LIMIT,
    }),
    prisma.product.findMany({ where: inStock, select: { brand: true }, distinct: ['brand'] }),
    prisma.prescriptionGlasses.findMany({ where: inStock, select: { brand: true }, distinct: ['brand'] }),
  ]);

  const brands = [...new Set([...sunglassBrands, ...eyeglassBrands].map((b) => b.brand.trim()).filter(Boolean))].sort();
  const line = (p: (typeof sunglasses)[number]) =>
    `- [${p.name}](${SITE_URL}/shop/${p.slug}): ${p.brand}, ${formatPrice(p.calculatedRetailPrice, p.basePrice, p.brand)}`;

  return [
    `## Brands\n\n${brands.join(', ')}`,
    `## Sunglasses (selection)\n\n${sunglasses.map(line).join('\n')}`,
    `## Prescription glasses frames (selection)\n\n${eyeglasses.map(line).join('\n')}`,
  ].join('\n\n');
}

export async function GET() {
  let catalog = '';
  try {
    catalog = await getCatalogSections();
  } catch (error) {
    console.error('[llms.txt] Failed to load catalog:', error);
  }

  const body = `# FocusRobin

> FocusRobin (MB Focusrobin optika) is a Lithuanian online eyewear store at focusrobin.lt selling sunglasses and prescription glasses — its own FocusRobin brand plus designer brands — with fast delivery across Lithuania and the EU/Schengen area. Prices are in euros and include VAT.

Key facts:

- Free standard shipping; delivery within about 2 days in Lithuania, longer for EU countries and for made-to-order prescription glasses
- 14-day returns on unused items in original packaging; custom prescription lenses are not returnable unless defective
- 2-year warranty on FocusRobin glasses and prescription lenses; other brands follow the manufacturer's warranty
- Payment by card (Visa, Mastercard, American Express), PayPal, Apple Pay and Google Pay
- Virtual try-on with the device camera on product pages
- Site languages: English (${SITE_URL}), Lithuanian (${SITE_URL}/lt), Russian (${SITE_URL}/ru)
- Contact: support@focusrobin.com — Elektrėnų g. 1S, 51192 Kaunas, Lithuania

## Shop

- [All sunglasses](${SITE_URL}/shop): polarized sunglasses with UV400 protection
- [Men's sunglasses](${SITE_URL}/shop/men)
- [Women's sunglasses](${SITE_URL}/shop/women)
- [Kids' sunglasses](${SITE_URL}/shop/kids)
- [Unisex sunglasses](${SITE_URL}/shop/unisex)
- [Prescription glasses](${SITE_URL}/shop/prescription-glasses): frames with made-to-order prescription lenses

## Policies

- [Shipping](${SITE_URL}/shipping): carriers, delivery times and costs
- [Returns and refunds](${SITE_URL}/returns): 14-day return process
- [Warranty](${SITE_URL}/warranty): coverage and how to make a claim
- [FAQ](${SITE_URL}/faq): common questions about orders, shipping and products
- [Terms of service](${SITE_URL}/terms)
- [Privacy policy](${SITE_URL}/privacy)

## About

- [About FocusRobin](${SITE_URL}/about)
- [Contact](${SITE_URL}/contact)
${catalog ? `\n${catalog}\n` : ''}
## Optional

- [Sitemap](${SITE_URL}/sitemap.xml): every product page in all languages
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
