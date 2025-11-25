import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { prisma } from "@/lib/prisma";
import { mapPrismaProductToProduct } from "@/lib/prisma-product-mapper";
import ShopPageClient from "../ShopPageClient";
import CategoryBanner from "@/components/shop/category-banner";
import { Gender } from "@prisma/client";

export default async function MenShopPage() {
  // Fetch products filtered by MEN gender
  const prismaProducts = (await prisma.product.findMany({
    where: {
      gender: {
        has: Gender.MEN, // Products that include MEN in their gender array
      },
    },
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

