import Header from '@/components/Landing/header.tsx';
import HeroSection from '@/components/Landing/hero-section.tsx';
import IconicSection from '@/components/Landing/iconic-section.tsx';
import GiftCategoriesSection from '@/components/Landing/gift-categories-section.tsx';
import GiftBannerSection from '@/components/Landing/gift-banner-section.tsx';
import BestsellersCarousel from '@/components/Landing/BestsellersCarousel.tsx';
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

  // Fetch active hero image from database
  let heroImage: any = null;
  try {
    // @ts-ignore - heroImage may not exist until Prisma client is regenerated
    if (prisma.heroImage && typeof prisma.heroImage.findFirst === 'function') {
      // @ts-ignore
      heroImage = await prisma.heroImage.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
      });
    }
  } catch (error) {
    console.error('Error fetching hero image:', error);
  }

  // Only show hero section if there's an active hero image
  const heroData = heroImage;

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

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {heroData && <HeroSection heroData={heroData} />}
        {iconicImage && <IconicSection iconicImage={iconicImage} />}
        {categoryImages.length > 0 && <GiftCategoriesSection categoryImages={categoryImages} />}
        <BestsellersCarousel products={products} />
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
