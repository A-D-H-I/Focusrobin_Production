import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { prisma } from "@/lib/prisma";
import { mapPrismaProductToProduct } from "@/lib/prisma-product-mapper";
import ShopPageClient from "../ShopPageClient";
import CategoryBanner from "@/components/shop/category-banner";
import { normalizeImageUrl } from "@/lib/normalize-image-url";
import ProductPageContent from "@/app/products/[slug]/ProductPageContent";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getPriceRange } from "@/app/actions/getPriceRange";

// Helper to get OG image with fallback
function getOGImageUrl(productImage?: string): string {
  if (productImage) {
    const normalized = normalizeImageUrl(productImage);
    return normalized.startsWith('http') ? normalized : `https://focusrobin.lt${normalized}`;
  }
  return 'https://focusrobin.lt/og.png';
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  // First check if it's a custom shop page
  let customPage: any = null;
  try {
    // @ts-ignore
    if (prisma.customShopPage && typeof prisma.customShopPage.findUnique === 'function') {
      // @ts-ignore
      customPage = await prisma.customShopPage.findUnique({
        where: { slug: decodedSlug },
      });
    }
  } catch (error) {
    console.error('Error fetching custom shop page for metadata:', error);
  }

  if (customPage && customPage.isVisible) {
    return {
      title: customPage.name,
      description: customPage.description || `Shop ${customPage.name} at FocusRobin. Premium sunglasses and eyewear.`,
      alternates: {
        canonical: `https://focusrobin.lt/shop/${slug}`,
      },
      openGraph: {
        type: 'website',
        title: `${customPage.name} | FocusRobin Lithuania`,
        description: customPage.description || `Shop ${customPage.name} at FocusRobin. Premium sunglasses and eyewear.`,
        images: customPage.bannerImage ? [{ url: getOGImageUrl(customPage.bannerImage) }] : undefined,
      },
    };
  }

  // Try to find a product
  const prismaProduct = (await prisma.product.findUnique({
    where: { slug: decodedSlug },
    include: {
      ProductVariant: {
        include: {
          ProductAsset: true,
        },
      },
    },
  })) as any;

  if (!prismaProduct) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
    };
  }

  const product = mapPrismaProductToProduct(prismaProduct);
  const productImage = product.variants[0]?.thumbnail || product.variants[0]?.images[0];
  const ogImage = getOGImageUrl(productImage);

  // Build description with polarized/UV info if available
  let description = `${product.name} - Premium sunglasses by FocusRobin.`;
  if (product.uvProtection && product.uvProtection.includes('UV')) {
    description += ` UV protection included.`;
  }
  if (product.description) {
    description += ` ${product.description.substring(0, 120)}...`;
  }
  description += ' Fast shipping to Lithuania and EU/Schengen.';

  return {
    title: product.name,
    description,
    alternates: {
      canonical: `https://focusrobin.lt/shop/${slug}`,
    },
    openGraph: {
      type: 'website',
      title: `${product.name} | FocusRobin Lithuania`,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: [ogImage],
    },
  };
}

// Dynamically import product page components
const ProductDetailsTabs = dynamic(() => import("@/components/shop/product-details-tabs"), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg" />,
});

const CustomerReviews = dynamic(() => import("@/components/shop/customer-reviews"), {
  loading: () => <div className="h-48 bg-muted animate-pulse rounded-lg" />,
});

const ThingsToKnow = dynamic(() => import("@/components/shop/things-to-know"), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg" />,
});

const PackagingSection = dynamic(() => import("@/components/shop/packaging-section"), {
  loading: () => <div className="h-48 bg-muted animate-pulse rounded-lg" />,
});

const RelatedProducts = dynamic(() => import("@/components/shop/related-products"), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg" />,
});

export default async function ShopSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  // Await params (required in Next.js 15)
  const { slug } = await params;

  // Decode the slug
  const decodedSlug = decodeURIComponent(slug);

  // First, try to fetch custom shop page from database
  let customPage: any = null;
  try {
    // @ts-ignore
    if (prisma.customShopPage && typeof prisma.customShopPage.findUnique === 'function') {
      // @ts-ignore
      customPage = await prisma.customShopPage.findUnique({
        where: { slug: decodedSlug },
      });
    }
  } catch (error) {
    console.error('Error fetching custom shop page:', error);
  }

  // If custom page exists and is visible, render it
  if (customPage && customPage.isVisible) {
    // Fetch products by their slugs
    const productSlugs = customPage.products || [];
    let prismaProducts: any[] = [];

    if (productSlugs.length > 0) {
      try {
        prismaProducts = await prisma.product.findMany({
          where: {
            slug: {
              in: productSlugs,
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
        });
      } catch (error) {
        console.error('Error fetching products for custom shop page:', error);
      }
    }

    // Map Prisma products to frontend Product type
    const products = prismaProducts.map(mapPrismaProductToProduct);

    // Banner data
    const bannerTitle = customPage.name;
    const bannerDescription = customPage.description || '';
    const bannerImage = normalizeImageUrl(customPage.bannerImage);
    const bannerAlt = customPage.name || 'Shop page banner';

    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow bg-background">
          {/* Banner */}
          <CategoryBanner
            title={bannerTitle}
            imageSrc={bannerImage}
            description={bannerDescription}
            alt={bannerAlt}
          />

          {/* Video Section */}
          {customPage.videoUrl && (
            <section className="w-full py-12 bg-background">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    {customPage.videoUrl.includes('youtube.com') || customPage.videoUrl.includes('youtu.be') ? (
                      <iframe
                        src={customPage.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                        title={customPage.name}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={customPage.videoUrl}
                        controls
                        className="w-full h-full object-contain"
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Products Grid */}
          <div className="bg-background py-8">
            <div className="container mx-auto px-4">
              {products.length > 0 ? (
                <ShopPageClient
                  products={products}
                  title={customPage.name}
                  priceRange={await getPriceRange()}
                />
              ) : (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-lg">No products found for this page.</p>
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If not a custom page, try to find a product
  // Fetch product by slug from database (primary lookup)
  let prismaProduct = (await prisma.product.findUnique({
    where: { slug: decodedSlug },
    include: {
      ProductVariant: {
        include: {
          ProductAsset: true,
        },
      },
    },
  })) as any;

  // Fallback: if not found by slug, try to find by ID (in case slug is missing in DB)
  if (!prismaProduct) {
    // Try to find by ID if the slug parameter looks like an ID
    prismaProduct = (await prisma.product.findUnique({
      where: { id: decodedSlug },
      include: {
        ProductVariant: {
          include: {
            ProductAsset: true,
          },
        },
      },
    })) as any;
  }

  // Handle 404 if product not found
  if (!prismaProduct) {
    notFound();
  }

  // Map Prisma product to frontend Product type
  const product = mapPrismaProductToProduct(prismaProduct);

  // Fetch reviews explicitly by productId to ensure we get all reviews
  const productReviews = await prisma.review.findMany({
    where: {
      productId: prismaProduct.id
    },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      Product: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch related products (same gender)
  const currentProductGenders = prismaProduct.gender || [];
  const relatedProducts = await prisma.product.findMany({
    where: {
      AND: [
        { id: { not: prismaProduct.id } },
        currentProductGenders.length > 0 ? {
          gender: { hasSome: currentProductGenders },
        } : {},
      ],
    },
    include: {
      ProductVariant: {
        include: {
          ProductAsset: true,
        },
      },
    },
    take: 8,
    orderBy: {
      createdAt: 'desc',
    },
  });

  const relatedProductsMapped = relatedProducts.map(mapPrismaProductToProduct);

  // Build structured data for product
  const productImage = product.variants[0]?.thumbnail || product.variants[0]?.images[0];
  const productImages = product.variants.flatMap(v => v.images || [v.thumbnail]).filter(Boolean);
  const allImages = productImages.length > 0
    ? productImages.map(img => {
      const normalized = normalizeImageUrl(img);
      return normalized.startsWith('http') ? normalized : `https://focusrobin.lt${normalized}`;
    })
    : ['https://focusrobin.lt/Symbol Wide Primary light (Teal).svg'];

  const basePrice = Number(product.price.replace(/[^\d.]/g, '')) || 0;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} - Premium sunglasses by FocusRobin`,
    image: allImages,
    brand: {
      '@type': 'Brand',
      name: 'FocusRobin',
    },
    ...(basePrice > 0 && {
      offers: {
        '@type': 'Offer',
        url: `https://focusrobin.lt/shop/${slug}`,
        priceCurrency: 'EUR',
        price: basePrice.toFixed(2),
        availability: product.variants.some(v => (v.stock ?? 0) > 0)
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'FocusRobin',
        },
      },
    }),
    ...(product.averageRating && product.reviewCount ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.averageRating.toString(),
        reviewCount: product.reviewCount.toString(),
      },
    } : {}),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://focusrobin.lt',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Shop',
        item: 'https://focusrobin.lt/shop',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `https://focusrobin.lt/shop/${slug}`,
      },
    ],
  };

  // Render product page
  return (
    <div className="min-h-screen overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Header />
      <main className="pt-[120px] sm:pt-[124px] xl:pt-[124px] bg-background overflow-x-hidden">
        <div className="container mx-auto px-4 py-8 overflow-x-hidden">
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/shop">Shop</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Main Product Content - outside container for full-width sections */}
        <ProductPageContent
          product={product}
          reviews={productReviews}
          relatedProducts={relatedProductsMapped}
        />
      </main>
      <Footer />
    </div>
  );
}
