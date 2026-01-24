"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { Product, ProductColorVariant } from "@/lib/productData";
import ProductPageClient from "./ProductPageClient";
import ProductPurchaseForm from "@/components/shop/product-purchase-form";
import ProductGalleryDesktopStack from "@/components/shop/product-gallery-desktop-stack";
import { trackViewContent } from "@/components/analytics/MetaPixel";
import { trackGA4ViewItem } from "@/components/analytics/GoogleAnalytics";
import { useCurrency } from "@/context/CurrencyContext";

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
    image: string | null;
  };
  createdAt: string | Date;
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
  const hasTrackedView = useRef(false);
  const { currency } = useCurrency();

  // Track ViewContent event with Meta Pixel when product page loads
  useEffect(() => {
    if (!hasTrackedView.current && product) {
      hasTrackedView.current = true;
      try {
        // Parse price from product.price string
        // Handle formats like: "€47.50", "47.50 €", "93.10 ЛВ", "47,50", etc.
        let priceStr = product.price;
        
        // Remove currency symbols and text, keep only numbers, dots, and commas
        priceStr = priceStr.replace(/[^\d.,]/g, '').trim();
        
        // Handle comma as decimal separator (European format: "47,50")
        if (priceStr.includes(',') && !priceStr.includes('.')) {
          priceStr = priceStr.replace(',', '.');
        }
        // Handle both comma and dot (thousands separator): "1.234,56" -> "1234.56"
        else if (priceStr.includes(',') && priceStr.includes('.')) {
          // If comma comes after dot, it's decimal: "47.50,00" -> "47.50"
          // If dot comes after comma, dot is thousands: "1.234,56" -> "1234.56"
          const lastComma = priceStr.lastIndexOf(',');
          const lastDot = priceStr.lastIndexOf('.');
          if (lastComma > lastDot) {
            // Comma is decimal separator
            priceStr = priceStr.replace(/\./g, '').replace(',', '.');
          } else {
            // Dot is decimal separator
            priceStr = priceStr.replace(/,/g, '');
          }
        }
        
        const parsedPrice = parseFloat(priceStr);
        
        // Validate price
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
          console.warn('[ProductPage] Invalid price for Meta Pixel:', {
            original: product.price,
            parsed: priceStr,
            result: parsedPrice,
          });
          // Track without value/currency if price is invalid
          trackViewContent(
            product.slug || product.id, 
            product.name, 
            product.gender?.join(', ') || 'Sunglasses', 
            0, 
            'EUR'
          );
          return;
        }
        
        const category = product.gender?.join(', ') || 'Sunglasses';
        
        // Track with Meta Pixel
        trackViewContent(
          product.slug || product.id, 
          product.name, 
          category, 
          parsedPrice, 
          'EUR'
        );
        
        // Track with GA4
        trackGA4ViewItem({
          item_id: product.slug || product.id,
          item_name: product.name,
          price: parsedPrice,
          currency: 'EUR',
          item_category: category,
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[ProductPage] Analytics tracked:', {
            product: product.name,
            price: parsedPrice,
            currency: 'EUR',
            category,
            originalPriceString: product.price,
          });
        }
      } catch (trackError) {
        console.error('[ProductPage] Analytics tracking error:', trackError);
      }
    }
  }, [product, currency]);

  return (
    <div className="relative">
      {/* Desktop Layout - Two Column Grid */}
      <div className="hidden lg:block" data-product-section>
        <div className="flex gap-8 lg:gap-12 xl:gap-16 items-start">
          {/* Left Column - Gallery (scrolled with page) */}
          <div className="w-[55%] flex-shrink-0">
            <ProductGalleryDesktopStack 
              product={product} 
              selectedVariant={selectedVariant}
            />
          </div>
          
          {/* Right Column - Sticky Product Info (stays fixed until gallery ends) */}
          <div className="w-[45%] flex-shrink-0">
            <div className="sticky top-[140px]">
              <ProductPurchaseForm 
                product={product} 
                selectedVariant={selectedVariant}
                onVariantChange={setSelectedVariant} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Stacked */}
      <div className="lg:hidden">
        <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
          <ProductPageClient product={product} />
        </Suspense>
      </div>

      {/* Full Width Sections - Product Details, Reviews, etc. */}
      <div className="mt-12 lg:mt-16 space-y-12">
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
      <div className="mt-24 w-screen relative" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <Suspense fallback={<div className="h-48 bg-muted animate-pulse" />}>
          <PackagingSection />
        </Suspense>
      </div>
      <div className="py-24">
        <Suspense fallback={<div className="h-64 bg-muted animate-pulse" />}>
          <ThingsToKnow />
        </Suspense>
      </div>
      <div className="bg-secondary/50 w-screen relative mt-4" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <Suspense fallback={<div className="h-64 bg-muted animate-pulse" />}>
          <RelatedProducts products={relatedProducts} />
        </Suspense>
      </div>
    </div>
  );
}
