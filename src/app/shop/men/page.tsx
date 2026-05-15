import type { Metadata } from 'next';
import Footer from "@/components/Landing/footer";
import ShopPageClient from "../ShopPageClient";
import CategoryBanner from "@/components/shop/category-banner";
import { Gender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSunglassesSubpageData } from "@/lib/subpage-data";

export const metadata: Metadata = {
  title: 'Men\'s Sunglasses & Eyewear',
  description: 'Shop premium men\'s sunglasses and eyewear at FocusRobin. Polarized lenses, UV400 protection, stylish frames designed in Lithuania. Fast shipping to Vilnius, Kaunas, and EU. Akiniai vyrams.',
  keywords: [
    'men sunglasses',
    'mens sunglasses Lithuania',
    'akiniai vyrams',
    'vyriški saulės akiniai',
    'polarized sunglasses men',
    'designer sunglasses men',
    'UV400 sunglasses men',
  ],
  alternates: {
    canonical: 'https://focusrobin.lt/shop/men',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IE',
    url: 'https://focusrobin.lt/shop/men',
    siteName: 'FocusRobin',
    title: 'Men\'s Sunglasses & Eyewear | FocusRobin Lithuania',
    description: 'Shop premium men\'s sunglasses and eyewear. Polarized lenses, UV400 protection, stylish frames designed in Lithuania.',
  },
};

interface MenShopPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MenShopPage({ searchParams }: MenShopPageProps) {
  const params = await searchParams;

  const { products, priceRange, genderCounts, brands } =
    await getSunglassesSubpageData(params, Gender.MEN);

  let shopBanner: any = null;
  try {
    // @ts-ignore
    if (prisma.shopBanner && typeof prisma.shopBanner.findUnique === 'function') {
      // @ts-ignore
      shopBanner = await prisma.shopBanner.findUnique({
        where: { category: 'MEN' },
      });
    }
  } catch (error) {
    console.error('Error fetching shop banner:', error);
  }

  const bannerTitle = "Men's Sunglasses";
  const bannerDescription = "Discover our premium collection of eyewear designed for the modern gentleman";
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
          title="Men's Sunglasses"
          priceRange={priceRange}
          genderCounts={genderCounts}
          brands={brands}
        />
      </main>
      <Footer />
    </div>
  );
}
