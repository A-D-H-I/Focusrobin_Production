import type { Metadata } from 'next';
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { prisma } from "@/lib/prisma";
import { mapPrismaProductToProduct } from "@/lib/prisma-product-mapper";
import ShopPageClient from "../ShopPageClient";
import CategoryBanner from "@/components/shop/category-banner";
import { Gender } from "@prisma/client";

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
  // Await searchParams (required in Next.js 15)
  const params = await searchParams;
  
  // Get color filter from URL
  const colorFilter = params.color as string | undefined;
  const colorHex = colorFilter ? decodeURIComponent(colorFilter) : undefined;

  // Build where clause
  const whereClause: any = {
    gender: {
      has: Gender.KIDS,
    },
  };

  // Filter by frame color if provided
  if (colorHex) {
    const normalizedColorHex = colorHex.startsWith('#') 
      ? colorHex.toLowerCase() 
      : `#${colorHex.toLowerCase()}`;
    
    whereClause.ProductVariant = {
      some: {
        colorHex: normalizedColorHex,
        stock: {
          gt: 0,
        },
      },
    };
  }

  // Fetch products filtered by KIDS gender
  const prismaProducts = (await prisma.product.findMany({
    where: whereClause,
    include: {
      ProductVariant: {
        include: {
          ProductAsset: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  } as any)) as any;

  // Map Prisma products to frontend Product type
  const products = prismaProducts.map(mapPrismaProductToProduct);

  // Fetch shop banner from database
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

  // Fallback to default values if no shop banner found
  const bannerTitle = "Shop for Kids";
  const bannerDescription = "Fun and durable eyewear designed with kids in mind";
  const bannerImage = shopBanner?.imageUrl || "/shopcategory/kids.jpg";
  const bannerAlt = shopBanner?.alt || bannerTitle;
  const bannerLink = shopBanner?.link || undefined;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-background">
        <CategoryBanner
          title={bannerTitle}
          imageSrc={bannerImage}
          description={bannerDescription}
          alt={bannerAlt}
          link={bannerLink}
        />
        <ShopPageClient products={products} />
      </main>
      <Footer />
    </div>
  );
}

