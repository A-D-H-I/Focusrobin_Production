import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
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

  // Get lens image URLs for prescription preview
  const lensBaseImageUrl = prismaProduct.lensBaseImageUrl || null;
  const lensMaskImageUrl = prismaProduct.lensMaskImageUrl || null;
  const lensBackgroundImageUrl = prismaProduct.lensBackgroundImageUrl || null;

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
                <BreadcrumbPage>Prescription</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <PrescriptionPageClient 
            product={product} 
            productSlug={slug}
            lensBaseImageUrl={lensBaseImageUrl}
            lensMaskImageUrl={lensMaskImageUrl}
            lensBackgroundImageUrl={lensBackgroundImageUrl}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
