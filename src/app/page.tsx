import type { Metadata } from 'next';
import HeroSection from '@/components/Landing/hero-section.tsx';
// import IconicSection from '@/components/Landing/iconic-section.tsx';
import ShopByShapes from '@/components/Landing/shop-by-shapes.tsx';
import ShopByBrands from '@/components/Landing/shop-by-brands.tsx';
import GiftCategoriesSection from '@/components/Landing/gift-categories-section.tsx';
import GiftBannerSection from '@/components/Landing/gift-banner-section.tsx';
import GiftForLovedOnesBanner from '@/components/Landing/gift-for-loved-ones-banner.tsx';
import BestsellersCarousel from '@/components/Landing/BestsellersCarousel.tsx';
import Products3DSection from '@/components/Landing/products-3d-section.tsx';
import ValuePropsSection from '@/components/Landing/value-props-section.tsx';
import LensFeatureSection from '@/components/Landing/lens-feature-section.tsx';
import InstagramFeedSection from '@/components/Landing/instagram-feed-section.tsx';
import Footer from '@/components/Landing/footer.tsx';
import SplitBannerSection from '@/components/Landing/split-banner-section';
import FaqSection from '@/components/Landing/faq-section';
import { prisma } from '@/lib/prisma';
import { mapPrismaProductToProduct } from '@/lib/prisma-product-mapper';
import { getProductsByGlassShape } from '@/app/actions/getProductsByGlassShape';
import { createPageMetadata } from '@/lib/metadata';

// Revalidate this page every 60 seconds to show updated products
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const title = 'FocusRobin - Premium Sunglasses & Prescription Glasses Lithuania | Best Eyewear Shop';
  const description = "FocusRobin Lithuania - Shop premium polarized sunglasses and prescription glasses online. UV400 protection, designer eyewear with fast delivery to Vilnius, Kaunas, Klaipėda and EU. Buy FocusRobin sunglasses today!";

  return {
    title,
    description,
    metadataBase: new URL('https://focusrobin.lt'),
    keywords: [
      'FocusRobin',
      'FocusRobin Lithuania',
      'FocusRobin sunglasses',
      'FocusRobin prescription glasses',
      'sunglasses Lithuania',
      'prescription glasses Lithuania',
      'buy sunglasses online Lithuania',
      'polarized sunglasses',
      'UV400 sunglasses',
      'eyewear Lithuania',
      'saulės akiniai',
      'korekciniai akiniai',
    ],
    alternates: {
      canonical: 'https://focusrobin.lt',
    },
    ...createPageMetadata({
      title,
      description,
      url: 'https://focusrobin.lt',
      type: 'website',
      twitterCard: 'summary_large_image',
    }),
  };
}

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
  // let iconicImage: any = null;
  // try {
  //   // @ts-ignore
  //   if (prisma.iconicImage && typeof prisma.iconicImage.findFirst === 'function') {
  //     // @ts-ignore
  //     iconicImage = await prisma.iconicImage.findFirst({
  //       where: { isActive: true },
  //       orderBy: { updatedAt: 'desc' },
  //     });
  //   }
  // } catch (error) {
  //   console.error('Error fetching iconic image:', error);
  // }

  // Fetch products by glass shape for Shop By Shapes section
  let shapesData: any[] = [];
  try {
    shapesData = await getProductsByGlassShape();
  } catch (error) {
    console.error('Error fetching products by glass shape:', error);
  }

  // Fetch brands for Shop By Brands section
  let brandsData: any[] = [];
  try {
    brandsData = await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      select: {
        name: true,
        imageUrl: true,
        landingImageUrl: true,
      },
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
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

  // Fetch Split Banner (Eyeglasses/Sunglasses)
  let splitBanner: any = null;
  try {
    // @ts-ignore
    if (prisma.splitBanner && typeof prisma.splitBanner.findUnique === 'function') {
      // @ts-ignore
      splitBanner = await prisma.splitBanner.findUnique({
        where: { sectionKey: 'eyeglasses' },
      });
      // Fallback if not found by key, try finding first active
      if (!splitBanner) {
        // @ts-ignore
        splitBanner = await prisma.splitBanner.findFirst({
          where: { isActive: true },
        });
      }
    }
  } catch (error) {
    console.error('Error fetching split banner:', error);
  }

  // Structured data for Organization with enhanced SEO
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FocusRobin',
    alternateName: ['Focus Robin', 'FocusRobin Lithuania', 'FocusRobin Lietuva'],
    url: 'https://focusrobin.lt',
    logo: 'https://focusrobin.lt/Symbol Wide Primary light (Teal).svg',
    description: 'FocusRobin is Lithuania\'s premier online eyewear store. Shop premium polarized sunglasses and prescription glasses with UV400 protection. Fast delivery to Vilnius, Kaunas, Klaipėda and EU.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'LT',
      addressRegion: 'Lithuania',
    },
    areaServed: [
      {
        '@type': 'Country',
        name: 'Lithuania',
      },
      {
        '@type': 'Place',
        name: 'European Union',
      },
    ],
    sameAs: [
      'https://www.instagram.com/focus.robin',
      'https://www.facebook.com/share/1HKTxzU7XP/',
    ],
  };

  // LocalBusiness schema for local SEO
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'FocusRobin - Sunglasses & Prescription Glasses Lithuania',
    alternateName: ['FocusRobin', 'Focus Robin', 'FocusRobin Lietuva'],
    url: 'https://focusrobin.lt',
    logo: 'https://focusrobin.lt/Symbol Wide Primary light (Teal).svg',
    image: 'https://focusrobin.lt/og.png',
    description: 'FocusRobin offers premium polarized sunglasses and prescription glasses online in Lithuania. Fast delivery to Vilnius, Kaunas, Klaipėda. Shop designer eyewear with UV400 protection.',
    priceRange: '€€',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'LT',
      addressRegion: 'Lithuania',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '54.6872',
      longitude: '25.2797',
    },
    areaServed: [
      { '@type': 'City', name: 'Vilnius' },
      { '@type': 'City', name: 'Kaunas' },
      { '@type': 'City', name: 'Klaipėda' },
      { '@type': 'City', name: 'Šiauliai' },
      { '@type': 'City', name: 'Panevėžys' },
      { '@type': 'Country', name: 'Lithuania' },
      { '@type': 'Place', name: 'European Union' },
    ],
    paymentAccepted: ['Credit Card', 'PayPal', 'Apple Pay', 'Google Pay'],
    currenciesAccepted: 'EUR',
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FocusRobin',
    alternateName: 'FocusRobin Lithuania',
    url: 'https://focusrobin.lt',
    description: 'Shop premium sunglasses and prescription glasses online in Lithuania. FocusRobin offers polarized eyewear with UV400 protection and fast EU delivery.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://focusrobin.lt/shop?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="flex flex-col" style={{ minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <main className="flex-grow" style={{ minHeight: 0 }}>
        {/* Screen-reader-only H1 for SEO */}
        <h1 className="sr-only">FocusRobin - Premium Sunglasses & Prescription Glasses Lithuania | Buy Eyewear Online</h1>
        {heroImages.length > 0 && <HeroSection heroData={heroImages} />}

        <BestsellersCarousel products={products} />
        {/* NEW Split Banner */}
        {splitBanner && <SplitBannerSection banner={splitBanner} />}

        {categoryImages.length > 0 && <GiftCategoriesSection categoryImages={categoryImages} />}
        {/* 3D Products Section - New Arrivals */}
        {products3D.length > 0 && <Products3DSection products={products3D} />}
        {/* Gift for Loved Ones Banner - Always show below best sellers */}
        <GiftForLovedOnesBanner bannerData={giftForLovedOnesBanner} />
        {/* Shop By Brands Section */}
        {brandsData.length > 0 && <ShopByBrands brands={brandsData} />}
        {/* Shop By Shapes Section */}
        {shapesData.length > 0 && <ShopByShapes shapes={shapesData} />}
        {giftBanner && <GiftBannerSection giftBanner={giftBanner} />}
        <div className="bg-background">
          <ValuePropsSection />
          <LensFeatureSection />
          {/* {iconicImage && <IconicSection iconicImage={iconicImage} />} */}
          {instagramImages.length > 0 && <InstagramFeedSection instagramImages={instagramImages} />}

          <FaqSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
