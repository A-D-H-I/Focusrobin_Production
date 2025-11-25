"use client";

import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import type { Product, ProductColorVariant } from "@/lib/productData";
import ProductPageClient from "./ProductPageClient";
import ProductPageClientWrapper from "./ProductPageClientWrapper";
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

type Review = {
  id: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  User: {
    name: string | null;
    email: string;
  };
  createdAt: Date;
};

interface ProductPageContentProps {
  product: Product;
  reviews: Review[];
  relatedProducts: Product[];
}

export default function ProductPageContent({ product, reviews, relatedProducts }: ProductPageContentProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductColorVariant>(product.variants[0]);

  return (
    <>
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
            <ProductPageClientWrapper 
              product={product} 
              selectedVariant={selectedVariant}
              onVariantChange={setSelectedVariant} 
            />
          </div>
          
          {/* Product Details Tabs */}
          <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded-lg" />}>
            <ProductDetailsTabs product={product} selectedVariant={selectedVariant} />
          </Suspense>
          
          {/* Customer Reviews */}
          <Suspense fallback={<div className="h-48 bg-muted animate-pulse rounded-lg" />}>
            <CustomerReviews reviews={reviews} />
          </Suspense>
        </div>
        
        {/* Right Column - Sticky Purchase Form */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-28">
            <div className="hidden lg:block">
              <ProductPurchaseForm 
                product={product} 
                selectedVariant={selectedVariant}
                onVariantChange={setSelectedVariant} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Sections - Lazy Loaded */}
      <div className="mt-24 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <Suspense fallback={<div className="h-48 bg-muted animate-pulse" />}>
          <PackagingSection />
        </Suspense>
      </div>
      <div className="py-24">
        <Suspense fallback={<div className="h-64 bg-muted animate-pulse" />}>
          <ThingsToKnow />
        </Suspense>
      </div>
      <div className="bg-secondary/50 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] py-6 mt-12">
        <Suspense fallback={<div className="h-64 bg-muted animate-pulse" />}>
          <RelatedProducts products={relatedProducts} />
        </Suspense>
      </div>
    </>
  );
}

