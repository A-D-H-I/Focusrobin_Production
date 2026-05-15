import type { Metadata } from 'next';
import Footer from "@/components/Landing/footer";
import ShopPageClient from "../ShopPageClient";
import CategoryBanner from "@/components/shop/category-banner";
import { Gender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSunglassesSubpageData } from "@/lib/subpage-data";

export const metadata: Metadata = {
  title: 'Women\'s Sunglasses & Eyewear',
  description: 'Shop elegant women\'s sunglasses and eyewear at FocusRobin. Polarized lenses, UV400 protection, stylish frames designed in Lithuania. Fast shipping to Vilnius, Kaunas, and EU. Akiniai moterims.',
  keywords: [
    'women sunglasses',
    'womens sunglasses Lithuania',
    'akiniai moterims',
    'moteriški saulės akiniai',
    'polarized sunglasses women',
    'designer sunglasses women',
    'UV400 sunglasses women',
  ],
  alternates: {
    canonical: 'https://focusrobin.lt/shop/women',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IE',
    url: 'https://focusrobin.lt/shop/women',
    siteName: 'FocusRobin',
    title: 'Women\'s Sunglasses & Eyewear | FocusRobin Lithuania',
    description: 'Shop elegant women\'s sunglasses and eyewear. Polarized lenses, UV400 protection, stylish frames designed in Lithuania.',
  },
};

interface WomenShopPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function WomenShopPage({ searchParams }: WomenShopPageProps) {
  const params = await searchParams;

  // Fetch products and compute gender-scoped filter counts
  const { products, priceRange, genderCounts, brands } =
    await getSunglassesSubpageData(params, Gender.WOMEN);

  // Fetch shop banner
  let shopBanner: any = null;
  try {
    // @ts-ignore
    if (prisma.shopBanner && typeof prisma.shopBanner.findUnique === 'function') {
      // @ts-ignore
      shopBanner = await prisma.shopBanner.findUnique({
        where: { category: 'WOMEN' },
      });
    }
  } catch (error) {
    console.error('Error fetching shop banner:', error);
  }

  const bannerTitle = "Women's Sunglasses";
  const bannerDescription = "Elegant and stylish eyewear crafted for the contemporary woman";
  const bannerImage = shopBanner?.imageUrl || "/shopcategory/women.jpg";
  const bannerAlt = shopBanner?.alt || bannerTitle;
  const bannerLink = shopBanner?.link || undefined;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] bg-background overflow-x-hidden">
        <ShopPageClient
          banner={
            <CategoryBanner
              title={bannerTitle}
              imageSrc={bannerImage}
              description={bannerDescription}
              alt={bannerAlt}
              link={bannerLink}
              className="mt-0 sm:mt-0 mb-6"
              contentClassName="pb-2 sm:pb-3 md:pb-4 lg:pb-6 xl:pb-6"
            />
          }
          products={products}
          title="Women's Sunglasses"
          priceRange={priceRange}
          genderCounts={genderCounts}
          brands={brands}
        />
      </main>
      <Footer />
    </div>
  );
}
