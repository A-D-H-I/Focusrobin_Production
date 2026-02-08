import type { Metadata } from 'next';
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { prisma } from "@/lib/prisma";
import { mapPrismaProductToProduct } from "@/lib/prisma-product-mapper";
import ShopPageClient from "../ShopPageClient";
import { getPriceRange } from "@/app/actions/getPriceRange";
import { getAvailableGlassShapes } from "@/app/actions/getAvailableGlassShapes";
import { getAvailableGenderCounts } from "@/app/actions/getAvailableGenderCounts";
import { getAvailableMaterials } from "@/app/actions/getAvailableMaterials";
import { getAvailableFrameColors } from "@/app/actions/getAvailableColors";
import CategoryBanner from "@/components/shop/category-banner";
import { Gender } from "@prisma/client";

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
  // Await searchParams (required in Next.js 15)
  const params = await searchParams;

  // Get color filter from URL
  const colorFilter = params.color as string | undefined;
  const colorHex = colorFilter ? decodeURIComponent(colorFilter) : undefined;
  const minPriceParam = params.minPrice as string | undefined;
  const maxPriceParam = params.maxPrice as string | undefined;

  // Build where clause
  const whereClause: any = {
    gender: {
      has: Gender.UNISEX,
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

  // Fetch products and filters in parallel
  const [
    prismaProductsResult,
    priceRange,
    glassShapes,
    genderCounts,
    materials,
    colors
  ] = await Promise.all([
    prisma.product.findMany({
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
    }),
    getPriceRange(),
    getAvailableGlassShapes(),
    getAvailableGenderCounts(),
    getAvailableMaterials(),
    getAvailableFrameColors(),
  ]);

  let prismaProducts = prismaProductsResult as any;

  // Filter by price range (after fetching, since we need to calculate final price)
  if (minPriceParam || maxPriceParam) {
    const minPrice = minPriceParam ? parseFloat(minPriceParam) : undefined;
    const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined;

    prismaProducts = prismaProducts.filter((product: any) => {
      const basePrice = Number(product.basePrice);
      const discountPct = product.discountPct || 0;
      const finalPrice = basePrice * (1 - discountPct / 100);

      if (minPrice !== undefined && finalPrice < minPrice) return false;
      if (maxPrice !== undefined && finalPrice > maxPrice) return false;
      return true;
    });
  }

  // Map Prisma products to frontend Product type
  const products = prismaProducts.map(mapPrismaProductToProduct);

  // Fetch shop banner from database
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

  // Fallback to default values if no shop banner found
  const bannerTitle = "Unisex Collection";
  const bannerDescription = "Versatile eyewear designed for everyone";
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
        <ShopPageClient
          products={products}
          priceRange={priceRange}
          glassShapes={glassShapes}
          genderCounts={genderCounts}
          materials={materials}
          colors={colors}
        />
      </main>
      <Footer />
    </div>
  );
}

