import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from "react";
import Footer from "@/components/Landing/footer";
import { prisma } from "@/lib/prisma";
import { mapPrismaProductToProduct } from "@/lib/prisma-product-mapper";
import PrescriptionConfirmationContent from "./PrescriptionConfirmationContent";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return {
    title: 'Prescription Confirmation | FocusRobin',
    description: 'Your prescription has been saved successfully',
  };
}

export default async function PrescriptionConfirmationPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ product?: string }>;
}) {
  const { slug } = await params;
  const { product: productSlugParam } = await searchParams;
  const decodedSlug = decodeURIComponent(slug);
  
  // Use slug from params or searchParams
  const productSlug = slug || productSlugParam || '';
  
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
    notFound();
  }

  // Map Prisma product to frontend Product type
  const product = mapPrismaProductToProduct(prismaProduct);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] bg-background">
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
                <BreadcrumbLink href={`/products/${slug}`}>{product.name}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Prescription Confirmation</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
            <PrescriptionConfirmationContent product={product} productSlug={slug} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
