import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { locales, localizedUrl } from '@/i18n/config';

// Build per request instead of once during `next build`: the Docker build has no
// database, so a build-time sitemap silently lost every product.
export const dynamic = 'force-dynamic';

type ChangeFrequency = MetadataRoute.Sitemap[number]['changeFrequency'];

// Static pages with their priorities and change frequencies
const STATIC_PAGES: { path: string; changeFrequency: ChangeFrequency; priority: number }[] = [
  { path: '/', changeFrequency: 'daily', priority: 1.0 },
  { path: '/shop', changeFrequency: 'daily', priority: 0.9 },
  { path: '/shop/prescription-glasses', changeFrequency: 'daily', priority: 0.9 },
  // Category pages
  { path: '/shop/men', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/shop/women', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/shop/kids', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/shop/unisex', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/shop/prescription-glasses/men', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/shop/prescription-glasses/women', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/shop/prescription-glasses/kids', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/shop/prescription-glasses/unisex', changeFrequency: 'weekly', priority: 0.8 },
  // Informational pages
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.7 },
  // Policy pages
  { path: '/shipping', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/returns', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/warranty', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/terms', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'monthly', priority: 0.5 },
];

/** One entry per locale, each listing every language version (hreflang) */
function localizedEntries(
  path: string,
  lastModified: Date,
  changeFrequency: ChangeFrequency,
  priority: number
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(locales.map((l) => [l, localizedUrl(path, l)]));
  return locales.map((locale) => ({
    url: localizedUrl(path, locale),
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries = STATIC_PAGES.flatMap((p) =>
    localizedEntries(p.path, now, p.changeFrequency, p.priority)
  );

  try {
    // Sunglasses and prescription glasses both live under /shop/[slug]
    const [products, prescriptionGlasses] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.prescriptionGlasses.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const productEntries = [...products, ...prescriptionGlasses].flatMap((p) =>
      localizedEntries(`/shop/${p.slug}`, p.updatedAt, 'weekly', 0.8)
    );

    return [...staticEntries, ...productEntries];
  } catch (error) {
    // If database query fails, return static pages only
    console.error('Error fetching products for sitemap:', error);
    return staticEntries;
  }
}
