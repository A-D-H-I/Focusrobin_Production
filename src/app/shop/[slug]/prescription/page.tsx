import { getBundlePrices } from "@/app/actions/bundlePricing";
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { prisma } from "@/lib/prisma";
import { mapPrismaProductToProduct } from "@/lib/prisma-product-mapper";
import PrescriptionPageClient from "./PrescriptionPageClient";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  return {
    title: 'Enter Prescription | FocusRobin',
    description: 'Enter your prescription details for your sunglasses',
  };
}

export default async function PrescriptionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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
    },
  })) as any;

  // Track if we found by ID (for redirect logic)
  let foundById = false;

  // Fallback: if not found by slug, try to find by ID (in case slug is missing in DB or URL uses ID)
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
    foundById = !!prismaProduct;
  }

  // Handle 404 if product not found
  if (!prismaProduct) {
    console.error(`Product not found with slug: "${decodedSlug}" (original: "${slug}")`);
    notFound();
  }

  // Use the actual slug from the product (not the URL parameter)
  // This ensures we always use the proper slug, even if the URL used an ID
  const productSlug = prismaProduct.slug || slug;

  // If product was found by ID but has a slug, redirect to proper slug URL
  if (foundById && prismaProduct.slug && prismaProduct.slug !== decodedSlug) {
    const { redirect } = await import('next/navigation');
    redirect(`/shop/${encodeURIComponent(prismaProduct.slug)}/prescription`);
  }

  // Map Prisma product to frontend Product type
  const product = mapPrismaProductToProduct(prismaProduct);

  // Get lens image URLs for prescription preview
  const lensBaseImageUrl = prismaProduct.lensBaseImageUrl || null;
  const lensMaskImageUrl = prismaProduct.lensMaskImageUrl || null;
  const lensBackgroundImageUrl = prismaProduct.lensBackgroundImageUrl || null;

  // Fetch dynamic bundle prices
  const bundlePricesResult = await getBundlePrices();
  const bundlePrices = bundlePricesResult.success ? bundlePricesResult.data : undefined;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-[120px] sm:pt-[124px] xl:pt-[124px] bg-background">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb className="mb-4">
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
                <BreadcrumbLink href={`/shop/${productSlug}`}>{product.name}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Prescription</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <PrescriptionPageClient
            product={product}
            productSlug={productSlug}
            lensBaseImageUrl={lensBaseImageUrl}
            lensMaskImageUrl={lensMaskImageUrl}
            lensBackgroundImageUrl={lensBackgroundImageUrl}
            bundlePrices={bundlePrices}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
