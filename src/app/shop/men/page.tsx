import type { Metadata } from 'next';
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { prisma } from "@/lib/prisma";
import { mapPrismaProductToProduct } from "@/lib/prisma-product-mapper";
import ShopPageClient from "../ShopPageClient";
import CategoryBanner from "@/components/shop/category-banner";
import { Gender } from "@prisma/client";

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
  // Await searchParams (required in Next.js 15)
  const params = await searchParams;
  
  // Get color filter from URL
  const colorFilter = params.color as string | undefined;
  const colorHex = colorFilter ? decodeURIComponent(colorFilter) : undefined;

  // Build where clause
  const whereClause: any = {
    gender: {
      has: Gender.MEN, // Products that include MEN in their gender array
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

  // Fetch products filtered by MEN gender
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
        where: { category: 'MEN' },
      });
    }
  } catch (error) {
    console.error('Error fetching shop banner:', error);
  }

  // Fallback to default values if no shop banner found
  const bannerTitle = "Shop for Men";
  const bannerDescription = "Discover our premium collection of eyewear designed for the modern gentleman";
  const bannerImage = shopBanner?.imageUrl || "/shopcategory/Men.jpg";
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

