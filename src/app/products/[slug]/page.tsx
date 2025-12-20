import { notFound } from 'next/navigation';
import { Suspense } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { prisma } from "@/lib/prisma";
import { mapPrismaProductToProduct } from "@/lib/prisma-product-mapper";
import type { ProductColorVariant } from "@/lib/productData";
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


export default async function ProductPage({ params }: { params: { slug: string } }) {
  // Decode the slug in case it's URL-encoded (handles spaces and special characters)
  const decodedSlug = decodeURIComponent(params.slug);
  
  // Fetch product by slug from database
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

  // Handle 404 if product not found
  if (!prismaProduct) {
    console.error(`Product not found with slug: "${decodedSlug}" (original: "${params.slug}")`);
    notFound();
  }

  // Map Prisma product to frontend Product type
  const product = mapPrismaProductToProduct(prismaProduct);

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

  // Fetch related products based on gender
  const currentProductGenders = prismaProduct.gender || [];
  const relatedPrismaProducts = (await prisma.product.findMany({
    where: {
      id: {
        not: prismaProduct.id,
      },
      gender: {
        hasSome: currentProductGenders, // Products that have at least one matching gender
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
    take: 8, // Show up to 8 related products
  })) as any;

  // If we don't have enough products with matching gender, fetch additional products
  let additionalProducts: any[] = [];
  if (relatedPrismaProducts.length < 8) {
    const remaining = 8 - relatedPrismaProducts.length;
    const existingIds = [prismaProduct.id, ...relatedPrismaProducts.map((p: any) => p.id)];
    
    additionalProducts = (await prisma.product.findMany({
      where: {
        id: {
          notIn: existingIds,
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
      take: remaining,
    })) as any;
  }

  // Combine and map related products
  const allRelatedProducts = [...relatedPrismaProducts, ...additionalProducts];
  const relatedProducts = allRelatedProducts.map(mapPrismaProductToProduct);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-36 sm:pt-40 bg-background">
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

