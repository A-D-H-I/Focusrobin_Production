import Header from '@/components/Landing/header.tsx';
import HeroSection from '@/components/Landing/hero-section.tsx';
import IconicSection from '@/components/Landing/iconic-section.tsx';
import GiftCategoriesSection from '@/components/Landing/gift-categories-section.tsx';
import GiftBannerSection from '@/components/Landing/gift-banner-section.tsx';
import GiftForLovedOnesBanner from '@/components/Landing/gift-for-loved-ones-banner.tsx';
import BestsellersCarousel from '@/components/Landing/BestsellersCarousel.tsx';
import Products3DSection from '@/components/Landing/products-3d-section.tsx';
import ValuePropsSection from '@/components/Landing/value-props-section.tsx';
import LensFeatureSection from '@/components/Landing/lens-feature-section.tsx';
import InstagramFeedSection from '@/components/Landing/instagram-feed-section.tsx';
import Footer from '@/components/Landing/footer.tsx';
import { prisma } from '@/lib/prisma';
import { mapPrismaProductToProduct } from '@/lib/prisma-product-mapper';

// Revalidate this page every 60 seconds to show updated products
export const revalidate = 60;

export default async function Home() {
  // Fetch products marked as unique designs (formerly best sellers)
  let products: any[] = [];
  try {
    const prismaProducts = (await prisma.product.findMany({
      where: {
        isUniqueDesign: true,
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
      take: 10, // Allow more products for unique designs
    })) as any;

    // Map Prisma products to frontend Product type
    products = prismaProducts.map(mapPrismaProductToProduct);
    
    // Debug log
    if (products.length === 0) {
      console.log('No unique design products found. Checking if any products exist...');
      const allProducts = await prisma.product.count();
      const uniqueDesignCount = await prisma.product.count({ where: { isUniqueDesign: true } });
      console.log(`Total products: ${allProducts}, Unique design products: ${uniqueDesignCount}`);
      
      // Fallback: If no unique designs selected, show recent products
      if (uniqueDesignCount === 0 && allProducts > 0) {
        console.log('No unique designs selected. Showing recent products as fallback.');
        const fallbackProducts = (await prisma.product.findMany({
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
          take: 5,
        })) as any;
        products = fallbackProducts.map(mapPrismaProductToProduct);
      }
    }
  } catch (error: any) {
    // If schema fields don't exist (migration not run), fall back to recent products
    if (error?.message?.includes("Unknown column") || 
        error?.message?.includes("does not exist") ||
        error?.code === "P2001") {
      console.warn('Database migration not run yet. Fetching recent products instead.');
      try {
        const prismaProducts = (await prisma.product.findMany({
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
          take: 5, // Fallback to 5 recent products
        })) as any;
        products = prismaProducts.map(mapPrismaProductToProduct);
      } catch (fallbackError) {
        console.error('Error fetching fallback products:', fallbackError);
        products = [];
      }
    } else {
      console.error('Error fetching unique design products:', error);
    products = [];
    }
  }

  // Fetch products marked as newly added
  let products3D: any[] = [];
  try {
    const prismaProducts = (await prisma.product.findMany({
      where: {
        isNewlyAdded: true,
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
      take: 12, // Show up to 12 newly added products
    })) as any;

    // Map Prisma products to frontend Product type
    products3D = prismaProducts.map(mapPrismaProductToProduct);
    
    // Debug log
    if (products3D.length === 0) {
      console.log('No newly added products found. Checking if any products exist...');
      const allProducts = await prisma.product.count();
      const newlyAddedCount = await prisma.product.count({ where: { isNewlyAdded: true } });
      console.log(`Total products: ${allProducts}, Newly added products: ${newlyAddedCount}`);
      
      // Fallback: If no newly added products selected, show recent products
      if (newlyAddedCount === 0 && allProducts > 0) {
        console.log('No newly added products selected. Showing recent products as fallback.');
        const fallbackProducts = (await prisma.product.findMany({
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
          take: 8,
        })) as any;
        products3D = fallbackProducts.map(mapPrismaProductToProduct);
      }
    }
  } catch (error: any) {
    // If schema fields don't exist (migration not run), fall back to recent products
    if (error?.message?.includes("Unknown column") || 
        error?.message?.includes("does not exist") ||
        error?.code === "P2001") {
      console.warn('Database migration not run yet. Fetching recent products instead.');
      try {
        const prismaProducts = (await prisma.product.findMany({
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
          take: 8, // Fallback to 8 recent products
        })) as any;
        products3D = prismaProducts.map(mapPrismaProductToProduct);
      } catch (fallbackError) {
        console.error('Error fetching fallback products:', fallbackError);
        products3D = [];
      }
    } else {
      console.error('Error fetching newly added products:', error);
    products3D = [];
    }
  }

  // Fetch all active hero images from database
  let heroImages: any[] = [];
  try {
    // @ts-ignore - heroImage may not exist until Prisma client is regenerated
    if (prisma.heroImage && typeof prisma.heroImage.findMany === 'function') {
      // @ts-ignore
      heroImages = await prisma.heroImage.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      });
    }
  } catch (error) {
    console.error('Error fetching hero images:', error);
  }

  // Fetch Instagram images from database
  let instagramImages: any[] = [];
  try {
    // @ts-ignore
    if (prisma.instagramImage && typeof prisma.instagramImage.findMany === 'function') {
      // @ts-ignore
      instagramImages = await prisma.instagramImage.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      });
    }
  } catch (error) {
    console.error('Error fetching instagram images:', error);
  }

  // Fetch category images from database
  let categoryImages: any[] = [];
  try {
    // @ts-ignore
    if (prisma.categoryImage && typeof prisma.categoryImage.findMany === 'function') {
      // @ts-ignore
      categoryImages = await prisma.categoryImage.findMany({
        where: { isActive: true },
      });
    }
  } catch (error) {
    console.error('Error fetching category images:', error);
  }

  // Fetch active iconic image from database
  let iconicImage: any = null;
  try {
    // @ts-ignore
    if (prisma.iconicImage && typeof prisma.iconicImage.findFirst === 'function') {
      // @ts-ignore
      iconicImage = await prisma.iconicImage.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
      });
    }
  } catch (error) {
    console.error('Error fetching iconic image:', error);
  }

  // Fetch active gift banner from database
  let giftBanner: any = null;
  try {
    // @ts-ignore
    if (prisma.giftBanner && typeof prisma.giftBanner.findFirst === 'function') {
      // @ts-ignore
      giftBanner = await prisma.giftBanner.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
      });
    }
  } catch (error) {
    console.error('Error fetching gift banner:', error);
  }

  // Fetch gift for loved ones banner from database
  let giftForLovedOnesBanner: any = null;
  try {
    // @ts-ignore
    if (prisma.giftForLovedOnesBanner && typeof prisma.giftForLovedOnesBanner.findFirst === 'function') {
      // @ts-ignore
      giftForLovedOnesBanner = await prisma.giftForLovedOnesBanner.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
      });
    }
  } catch (error) {
    console.error('Error fetching gift for loved ones banner:', error);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {heroImages.length > 0 && <HeroSection heroData={heroImages} />}
        <BestsellersCarousel products={products} />
        {categoryImages.length > 0 && <GiftCategoriesSection categoryImages={categoryImages} />}
        {/* 3D Products Section - New Arrivals */}
        {products3D.length > 0 && <Products3DSection products={products3D} />}
        {/* Gift for Loved Ones Banner - Always show below best sellers */}
        <GiftForLovedOnesBanner bannerData={giftForLovedOnesBanner} />
        {giftBanner && <GiftBannerSection giftBanner={giftBanner} />}
        <div className="bg-background">
          <ValuePropsSection />
          <LensFeatureSection />
          {iconicImage && <IconicSection iconicImage={iconicImage} />}
          {instagramImages.length > 0 && <InstagramFeedSection instagramImages={instagramImages} />}
        </div>
      </main>
      <Footer />
    </div>
  );
}
