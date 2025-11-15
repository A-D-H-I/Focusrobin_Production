
"use client";

import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { productCatalog } from "@/lib/productData";
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
import ProductPageClient from "./ProductPageClient";
import ProductGallery from "@/components/shop/product-gallery";
import ProductPurchaseForm from "@/components/shop/product-purchase-form";

// Dynamically import heavy components for better performance
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

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = productCatalog.find((p) => p.id === params.id);
  const [selectedVariant, setSelectedVariant] = useState<ProductColorVariant | null>(
    product ? product.variants[0] : null
  );
  
  if (!product || !selectedVariant) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow pt-24 bg-background">
          <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl font-bold">Product not found</h1>
            <Link href="/shop" prefetch={true} className="text-primary hover:underline mt-4 inline-block">
              Back to Shop
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-24 bg-background">
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
          <div className="lg:grid lg:grid-cols-5 lg:gap-12 lg:space-y-0 space-y-12">
            {/* Left Column - Product Gallery, Details, and Reviews */}
            <div className="lg:col-span-3 space-y-12">
              {/* Mobile: Full Product Page Client */}
              <div className="lg:hidden">
                <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
                  <ProductPageClient product={product} />
                </Suspense>
              </div>
              
              {/* Desktop: Gallery Only */}
              <div className="hidden lg:block">
                <ProductGallery product={product} selectedVariant={selectedVariant} />
              </div>
              
              {/* Product Details Tabs */}
              <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded-lg" />}>
                <ProductDetailsTabs product={product} />
              </Suspense>
              
              {/* Customer Reviews */}
              <Suspense fallback={<div className="h-48 bg-muted animate-pulse rounded-lg" />}>
                <CustomerReviews />
              </Suspense>
            </div>
            
            {/* Right Column - Sticky Purchase Form */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-28">
                <div className="hidden lg:block">
                  <ProductPurchaseForm 
                    product={product} 
                    selectedVariant={selectedVariant}
                    onVariantChange={(variant) => setSelectedVariant(variant)} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Sections - Lazy Loaded */}
        <div className="mt-24">
          <Suspense fallback={<div className="h-48 bg-muted animate-pulse" />}>
            <PackagingSection />
          </Suspense>
        </div>
        <div className="py-24">
          <Suspense fallback={<div className="h-64 bg-muted animate-pulse" />}>
            <ThingsToKnow />
          </Suspense>
        </div>
        <div className="bg-secondary/50 py-24 mt-12">
          <Suspense fallback={<div className="h-64 bg-muted animate-pulse" />}>
            <RelatedProducts />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
