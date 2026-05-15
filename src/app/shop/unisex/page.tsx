import type { Metadata } from 'next';
import Footer from "@/components/Landing/footer";
import ShopPageClient from "../ShopPageClient";
import CategoryBanner from "@/components/shop/category-banner";
import { Gender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSunglassesSubpageData } from "@/lib/subpage-data";

export const metadata: Metadata = {
  title: 'Unisex Sunglasses & Eyewear',
  description: 'Shop versatile unisex sunglasses and eyewear at FocusRobin. Polarized lenses, UV400 protection, minimalist frames designed in Lithuania. Fast shipping to Vilnius, Kaunas, and EU.',
  keywords: [
    'unisex sunglasses',
    'unisex eyewear Lithuania',
    'universal sunglasses',
    'minimalist sunglasses',
    'polarized unisex sunglasses',
    'designer unisex eyewear',
  ],
  alternates: {
    canonical: 'https://focusrobin.lt/shop/unisex',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IE',
    url: 'https://focusrobin.lt/shop/unisex',
    siteName: 'FocusRobin',
    title: 'Unisex Sunglasses & Eyewear | FocusRobin Lithuania',
    description: 'Shop versatile unisex sunglasses and eyewear. Polarized lenses, UV400 protection, minimalist frames designed in Lithuania.',
  },
};

interface UnisexShopPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function UnisexShopPage({ searchParams }: UnisexShopPageProps) {
  const params = await searchParams;

  const { products, priceRange, genderCounts, brands } =
    await getSunglassesSubpageData(params, Gender.UNISEX);

  let shopBanner: any = null;
  try {
    // @ts-ignore
    if (prisma.shopBanner && typeof prisma.shopBanner.findUnique === 'function') {
      // @ts-ignore
      shopBanner = await prisma.shopBanner.findUnique({
        where: { category: 'UNISEX' },
      });
    }
  } catch (error) {
    console.error('Error fetching shop banner:', error);
  }

  const bannerTitle = "Unisex Sunglasses";
  const bannerDescription = "Versatile eyewear designed for everyone";
  const bannerImage = shopBanner?.imageUrl || "/shopcategory/Men.jpg";
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
          title="Unisex Sunglasses"
          priceRange={priceRange}
          genderCounts={genderCounts}
          brands={brands}
        />
      </main>
      <Footer />
    </div>
  );
}
