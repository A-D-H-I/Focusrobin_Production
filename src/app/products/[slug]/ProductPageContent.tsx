"use client";

import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import type { Product, ProductColorVariant } from "@/lib/productData";
import ProductPageClient from "./ProductPageClient";
import ProductPageClientWrapper from "./ProductPageClientWrapper";
import ProductPurchaseForm from "@/components/shop/product-purchase-form";
import ProductGalleryDesktopStack from "@/components/shop/product-gallery-desktop-stack";

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
  createdAt: string;
  Product?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

interface ProductPageContentProps {
  product: Product;
  reviews: Review[];
  relatedProducts: Product[];
}

export default function ProductPageContent({ product, reviews, relatedProducts }: ProductPageContentProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductColorVariant>(product.variants[0]);

  return (
    <div className="relative">
      {/* Desktop Layout - Two Column with Sticky Right (Images Only) */}
      <div className="hidden lg:block">
        <div 
          className="flex gap-12"
          style={{ alignItems: 'flex-start' }}
        >
          {/* Left Column - 60% - Product Images Only */}
          <div className="w-[60%]">
            <ProductGalleryDesktopStack 
              product={product} 
              selectedVariant={selectedVariant}
            />
          </div>
          
          {/* Right Column - 40% - STICKY (stops when images end) */}
          <div 
            className="w-[40%]"
            style={{
              position: 'sticky',
              top: '140px',
              alignSelf: 'flex-start',
              height: 'fit-content'
            }}
          >
            <ProductPurchaseForm 
              product={product} 
              selectedVariant={selectedVariant}
              onVariantChange={setSelectedVariant} 
            />
          </div>
        </div>
      </div>

      {/* Mobile Layout - Stacked */}
      <div className="lg:hidden space-y-12">
        <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
          <ProductPageClient product={product} />
        </Suspense>
      </div>

      {/* Full Width Sections - Product Details, Reviews, etc. */}
      <div className="mt-12 lg:mt-12 space-y-12">
        {/* Product Details Tabs - Full Width */}
        <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded-lg" />}>
          <ProductDetailsTabs product={product} selectedVariant={selectedVariant} />
        </Suspense>
        
        {/* Customer Reviews - Full Width */}
        <Suspense fallback={<div className="h-48 bg-muted animate-pulse rounded-lg" />}>
          <CustomerReviews reviews={reviews} />
        </Suspense>
      </div>

      {/* Full Width Sections - Below Main Product Content */}
      <div className="mt-24 w-full overflow-hidden">
        <Suspense fallback={<div className="h-48 bg-muted animate-pulse" />}>
          <PackagingSection />
        </Suspense>
      </div>
      <div className="py-24">
        <Suspense fallback={<div className="h-64 bg-muted animate-pulse" />}>
          <ThingsToKnow />
        </Suspense>
      </div>
      <div className="bg-secondary/50 w-full overflow-hidden py-6 mt-12">
        <Suspense fallback={<div className="h-64 bg-muted animate-pulse" />}>
          <RelatedProducts products={relatedProducts} />
        </Suspense>
      </div>
    </div>
  );
}
