import type { Metadata } from 'next';
import Footer from "@/components/Landing/footer";
import ShopPageClient from "../ShopPageClient";
import CategoryBanner from "@/components/shop/category-banner";
import { Gender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSunglassesSubpageData } from "@/lib/subpage-data";

export const metadata: Metadata = {
  title: 'Kids\' Sunglasses & Eyewear',
  description: 'Shop fun and durable kids\' sunglasses at FocusRobin. Safe UV400 protection, colorful frames designed in Lithuania. Fast shipping to Vilnius, Kaunas, and EU. Akiniai vaikams.',
  keywords: [
    'kids sunglasses',
    'childrens sunglasses Lithuania',
    'akiniai vaikams',
    'vaikiški saulės akiniai',
    'UV protection kids sunglasses',
    'safe sunglasses for kids',
    'durable kids eyewear',
  ],
  alternates: {
    canonical: 'https://focusrobin.lt/shop/kids',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IE',
    url: 'https://focusrobin.lt/shop/kids',
    siteName: 'FocusRobin',
    title: 'Kids\' Sunglasses & Eyewear | FocusRobin Lithuania',
    description: 'Shop fun and durable kids\' sunglasses. Safe UV400 protection, colorful frames designed in Lithuania.',
  },
};

interface KidsShopPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function KidsShopPage({ searchParams }: KidsShopPageProps) {
  const params = await searchParams;

  const { products, priceRange, genderCounts, brands } =
    await getSunglassesSubpageData(params, Gender.KIDS);

  let shopBanner: any = null;
  try {
    // @ts-ignore
    if (prisma.shopBanner && typeof prisma.shopBanner.findUnique === 'function') {
      // @ts-ignore
      shopBanner = await prisma.shopBanner.findUnique({
        where: { category: 'KIDS' },
      });
    }
  } catch (error) {
    console.error('Error fetching shop banner:', error);
  }

  const bannerTitle = "Kids Sunglasses";
  const bannerDescription = "Fun and durable eyewear designed with kids in mind";
  const bannerImage = shopBanner?.imageUrl || "/shopcategory/kids.jpg";
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
          title="Kids Sunglasses"
          priceRange={priceRange}
          genderCounts={genderCounts}
          brands={brands}
        />
      </main>
      <Footer />
    </div>
  );
}
