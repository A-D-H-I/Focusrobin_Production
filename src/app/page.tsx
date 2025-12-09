import Header from '@/components/Landing/header.tsx';
import HeroSection from '@/components/Landing/hero-section.tsx';
import IconicSection from '@/components/Landing/iconic-section.tsx';
import ScrollingBanner from '@/components/Landing/scrolling-banner.tsx';
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

export default async function Home() {
  // Fetch any 5 products from database for bestseller section
  let products: any[] = [];
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
      take: 5,
    })) as any;

    // Map Prisma products to frontend Product type
    products = prismaProducts.map(mapPrismaProductToProduct);
  } catch (error) {
    console.error('Error fetching products:', error);
    products = [];
  }

  // Fetch single product and duplicate it 10 times for 3D section
  let products3D: any[] = [];
  try {
    const prismaProduct = (await prisma.product.findFirst({
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
    })) as any;

    if (prismaProduct) {
      const mappedProduct = mapPrismaProductToProduct(prismaProduct);
      // Duplicate the product 10 times with unique keys but keep original data
      products3D = Array.from({ length: 10 }, (_, index) => {
        // Create a deep copy to avoid reference issues
        const productCopy = JSON.parse(JSON.stringify(mappedProduct));
        // Only change the ID for uniqueness, keep all other data intact
        productCopy.id = `${mappedProduct.id}-3d-${index}`;
        // Ensure variants have proper price data
        if (productCopy.variants && productCopy.variants.length > 0) {
          productCopy.variants.forEach((variant: any) => {
            // If variant doesn't have price, use product price
            if (!variant.price && mappedProduct.price) {
              variant.price = mappedProduct.price;
            }
          });
        }
        return productCopy;
      });
    }
  } catch (error) {
    console.error('Error fetching product for 3D section:', error);
    products3D = [];
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

  // Fetch all active scrolling banners from database
  let scrollingBanners: any[] = [];
  try {
    // @ts-ignore
    if (prisma.scrollingBanner && typeof prisma.scrollingBanner.findMany === 'function') {
      // @ts-ignore
      scrollingBanners = await prisma.scrollingBanner.findMany({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
      });
    }
  } catch (error) {
    console.error('Error fetching scrolling banners:', error);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {heroImages.length > 0 && <HeroSection heroData={heroImages} />}
        {iconicImage && <IconicSection iconicImage={iconicImage} />}
        {scrollingBanners.length > 0 && <ScrollingBanner banners={scrollingBanners} />}
        {categoryImages.length > 0 && <GiftCategoriesSection categoryImages={categoryImages} />}
        <BestsellersCarousel products={products} />
        {/* 3D Products Section */}
        {products3D.length > 0 && <Products3DSection products={products3D} />}
        {/* Gift for Loved Ones Banner - Always show below best sellers */}
        <GiftForLovedOnesBanner bannerData={giftForLovedOnesBanner} />
        {giftBanner && <GiftBannerSection giftBanner={giftBanner} />}
        <div className="bg-background">
          <ValuePropsSection />
          <LensFeatureSection />
          {instagramImages.length > 0 && <InstagramFeedSection instagramImages={instagramImages} />}
        </div>
      </main>
      <Footer />
    </div>
  );
}
