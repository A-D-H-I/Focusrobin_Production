import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from "react";
import dynamic from "next/dynamic";
import Footer from "@/components/Landing/footer";
import { prisma } from "@/lib/prisma";
import { mapPrismaProductToProduct } from "@/lib/prisma-product-mapper";
import type { ProductColorVariant } from "@/lib/productData";
import { getRelatedProducts } from "@/app/actions/getRelatedProducts";
import { Gender } from "@prisma/client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from "next/link";
import ProductPageContent from "./ProductPageContent";
import { normalizeImageUrl } from "@/lib/normalize-image-url";

// Helper to get OG image with fallback
function getOGImageUrl(productImage?: string): string {
  if (productImage) {
    const normalized = normalizeImageUrl(productImage);
    return normalized.startsWith('http') ? normalized : `https://focusrobin.lt${normalized}`;
  }
  // TODO: Add /og.png (1200x630) for better social sharing
  return 'https://focusrobin.lt/Symbol Wide Primary light (Teal).svg';
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const prismaProduct = (await prisma.product.findUnique({
    where: { slug: decodedSlug },
    include: {
      ProductVariant: {
        include: {
          ProductAsset: true,
        },
      },
      highlights: true,
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

  // Build SEO-optimized description
  let description = `Buy ${product.name} from FocusRobin Lithuania.`;
  if (product.uvProtection && product.uvProtection.includes('UV')) {
    description += ` Features UV400 protection.`;
  }
  description += ` Premium polarized sunglasses with fast delivery to Vilnius, Kaunas, Klaipėda and EU.`;
  if (product.description) {
    description += ` ${product.description.substring(0, 100)}`;
  }

  // Build SEO-optimized title
  const seoTitle = `${product.name} | FocusRobin Sunglasses Lithuania`;

  // Keywords for product pages
  const productKeywords = [
    `${product.name}`,
    `${product.name} sunglasses`,
    `buy ${product.name}`,
    'FocusRobin',
    'FocusRobin sunglasses',
    'sunglasses Lithuania',
    'buy sunglasses online Lithuania',
    'polarized sunglasses',
    'UV400 sunglasses',
    'premium sunglasses Lithuania',
    'sunglasses Vilnius',
    'sunglasses Kaunas',
    'saulės akiniai',
    'saulės akiniai internetu',
  ];

  return {
    title: seoTitle,
    description,
    keywords: productKeywords,
    alternates: {
      canonical: `https://focusrobin.lt/shop/${slug}`,
    },
    openGraph: {
      type: 'website',
      title: seoTitle,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${product.name} - FocusRobin Premium Sunglasses Lithuania`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description,
      images: [ogImage],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  // Await params (required in Next.js 15)
  const { slug } = await params;

  // Decode the slug in case it's URL-encoded (handles spaces and special characters)
  const decodedSlug = decodeURIComponent(slug);

  // Fetch product by slug from database (primary lookup)
  let prismaProduct = (await prisma.product.findUnique({
    where: { slug: decodedSlug },
    include: {
      ProductVariant: {
        include: {
          ProductAsset: true,
        },
      },
      highlights: true,
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
        highlights: true,
      },
    })) as any;
  }

  // Handle 404 if product not found
  if (!prismaProduct) {
    console.error(`Product not found with slug: "${decodedSlug}" (original: "${slug}")`);
    notFound();
  }

  // Map Prisma product to frontend Product type
  const product = mapPrismaProductToProduct(prismaProduct);

  // Fetch related products based on gender tags
  const relatedProducts = await getRelatedProducts(
    prismaProduct.id,
    (prismaProduct.gender as Gender[]) || []
  );

  // Fetch reviews explicitly by productId to ensure we get all reviews
  // This is more reliable than relying on the relation
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

  // Serialize reviews to ensure all Date and nested objects are properly converted
  const reviews = productReviews.map((review: any) => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    images: review.images || [],
    User: {
      name: review.User?.name || null,
      email: review.User?.email || "",
      image: review.User?.image || null,
    },
    createdAt: review.createdAt instanceof Date ? review.createdAt.toISOString() : review.createdAt,
    // Only include Product relation if it exists, and ensure it's serialized
    Product: review.Product ? {
      id: review.Product.id,
      name: review.Product.name,
      slug: review.Product.slug,
    } : null,
  }));

  // Build structured data
  const productImage = product.variants[0]?.thumbnail || product.variants[0]?.images[0];
  const productImages = product.variants.flatMap(v => v.images || [v.thumbnail]).filter(Boolean);
  const allImages = productImages.length > 0
    ? productImages.map(img => {
      const normalized = normalizeImageUrl(img);
      return normalized.startsWith('http') ? normalized : `https://focusrobin.lt${normalized}`;
    })
    : ['https://focusrobin.lt/Symbol Wide Primary light (Teal).svg'];

  // Calculate price - TODO: Use actual price from product data if available
  const basePrice = Number(product.price.replace(/[^\d.]/g, '')) || 0;
  const priceCurrency = 'EUR';

  // Product schema
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
    // Only include offers if we have real price data
    ...(basePrice > 0 && {
      offers: {
        '@type': 'Offer',
        url: `https://focusrobin.lt/shop/${slug}`,
        priceCurrency,
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
    // Aggregate rating if available
    ...(product.averageRating && product.reviewCount ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.averageRating.toString(),
        reviewCount: product.reviewCount.toString(),
      },
    } : {}),
  };

  // Breadcrumb schema
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

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main className="pt-[120px] sm:pt-[124px] xl:pt-[124px] bg-background">
        <div className="container mx-auto px-4 py-8">
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

          {/* Main Product Content */}
          <ProductPageContent
            product={product}
            reviews={reviews}
            relatedProducts={relatedProducts}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

