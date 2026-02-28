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
  let prismaProduct: any = await prisma.product.findUnique({
    where: { slug: decodedSlug },
    include: {
      ProductVariant: { include: { ProductAsset: true } },
      Category: true,
    },
  });

  let isPrescriptionGlass = false;

  // Fallback: search by ID
  if (!prismaProduct) {
    prismaProduct = await prisma.product.findUnique({
      where: { id: decodedSlug },
      include: {
        ProductVariant: { include: { ProductAsset: true } },
        Category: true,
      },
    });
  }

  // Fallback: search PrescriptionGlasses table
  if (!prismaProduct) {
    prismaProduct = await prisma.prescriptionGlasses.findUnique({
      where: { slug: decodedSlug },
      include: {
        PrescriptionGlassesVariant: { include: { PrescriptionGlassesAsset: true } },
        Category: true,
      },
    });
    if (prismaProduct) isPrescriptionGlass = true;
  }

  if (!prismaProduct && !isPrescriptionGlass) {
    prismaProduct = await prisma.prescriptionGlasses.findUnique({
      where: { id: decodedSlug },
      include: {
        PrescriptionGlassesVariant: { include: { PrescriptionGlassesAsset: true } },
        Category: true,
      },
    });
    if (prismaProduct) isPrescriptionGlass = true;
  }

  // Handle 404 if product not found
  if (!prismaProduct) {
    notFound();
  }

  // If product was found by ID but has a slug, redirect to proper slug URL
  if (prismaProduct.slug && prismaProduct.slug !== decodedSlug) {
    const { redirect } = await import('next/navigation');
    redirect(`/products/${encodeURIComponent(prismaProduct.slug)}/prescription/confirmation`);
  }

  let product: any;

  if (isPrescriptionGlass) {
    const variants = prismaProduct.PrescriptionGlassesVariant.map((v: any) => {
      const assets = v.PrescriptionGlassesAsset;
      const thumbnail = assets.find((a: any) => a.type === 'GALLERY' && a.isPrimary)?.url || assets.find((a: any) => a.type === 'GALLERY')?.url || '';
      const tilted = assets.find((a: any) => a.type === 'HOVER')?.url || '';
      const nobg = assets.find((a: any) => a.type === 'NO_BG')?.url;
      const tryOn = assets.find((a: any) => a.type === 'TRY_ON_2D')?.url;
      const images = assets.filter((a: any) => a.type === 'GALLERY').map((a: any) => a.url);

      const normalizeUrl = (u: string) => {
        if (!u) return '';
        if (u.includes('drive.google.com/file/d/')) {
          const match = u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
          return match ? `https://lh3.googleusercontent.com/d/${match[1]}` : u;
        }
        return u.startsWith('./') ? u.slice(1) : (u.startsWith('/') || u.startsWith('http') ? u : '/' + u);
      };

      return {
        name: v.name,
        hex: v.colorHex,
        sku: v.sku,
        stock: v.stock,
        thumbnail: normalizeUrl(thumbnail),
        tilted: normalizeUrl(tilted),
        nobg: nobg ? normalizeUrl(nobg) : undefined,
        images: images.map(normalizeUrl),
        tryOn: tryOn ? normalizeUrl(tryOn) : undefined,
        textureImageUrl: v.textureImageUrl ? normalizeUrl(v.textureImageUrl) : undefined,
      };
    });

    const isFocusRobin = (prismaProduct.brand || 'FocusRobin').trim().toLowerCase() === 'focusrobin';
    let effectiveBasePrice = Number(prismaProduct.basePrice);

    if (!isFocusRobin && effectiveBasePrice > 0) {
      effectiveBasePrice = (effectiveBasePrice * 1.10) + 13.5;
      effectiveBasePrice = effectiveBasePrice * 1.21;
      effectiveBasePrice = effectiveBasePrice * 1.015;
    }

    const price = effectiveBasePrice * (1 - (prismaProduct.discountPct || 0) / 100);

    product = {
      id: prismaProduct.id,
      slug: prismaProduct.slug,
      name: prismaProduct.name,
      productType: 'eyeglasses',
      price: price.toFixed(2),
      originalPrice: prismaProduct.discountPct ? effectiveBasePrice.toFixed(2) : undefined,
      discountPct: prismaProduct.discountPct || 0,
      cashback: prismaProduct.cashbackAmount && Number(prismaProduct.cashbackAmount) > 0 ? Number(prismaProduct.cashbackAmount).toFixed(2) : undefined,
      variants,
      categories: [prismaProduct.Category?.name || "Eyeglasses"],
      description: prismaProduct.description || "",
      lensMaterial: prismaProduct.lensMaterial,
      frameMaterial: prismaProduct.frameMaterial,
      uvProtection: prismaProduct.uvProtection,
      averageRating: prismaProduct.averageRating || 0,
      reviewCount: prismaProduct.reviewCount || 0,
      size: {
        lensWidth: prismaProduct.lensWidth?.toString() || "",
        bridge: prismaProduct.bridgeWidth?.toString() || "",
        temple: prismaProduct.templeLength?.toString() || ""
      },
      weight: prismaProduct.weightBg || 0,
      frameWidth: prismaProduct.frameWidth || 0,
      lensWidth: prismaProduct.lensWidth || 0,
      lensHeight: prismaProduct.lensHeight || 0,
      bridgeWidth: prismaProduct.bridgeWidth || 0,
      templeLength: prismaProduct.templeLength || 0,
      isUVProtection: prismaProduct.isUVProtection ?? true,
      isPolarized: prismaProduct.isPolarized ?? true,
      isHydrophobic: prismaProduct.isHydrophobic ?? true,
      isAntiScratch: prismaProduct.isAntiScratch ?? false,
      isBioBased: prismaProduct.isBioBased ?? true,
      warranty: prismaProduct.warranty || "2 Years Warranty",
    };
  } else {
    // Map Prisma product to frontend Product type
    product = mapPrismaProductToProduct(prismaProduct);
  }

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
