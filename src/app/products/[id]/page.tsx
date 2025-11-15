
import { Suspense } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";
import { productCatalog } from "@/lib/productData";
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
  
  if (!product) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow pt-24 bg-background">
          <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl font-bold">Product not found</h1>
            <Link href="/shop" className="text-primary hover:underline mt-4 inline-block">
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
          <div className="space-y-12 lg:space-y-0">
            <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
              <ProductPageClient product={product} />
            </Suspense>
            
            {/* Product Details Tabs - Desktop only in left column, Mobile below */}
            <div className="hidden lg:block">
              <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded-lg" />}>
                <ProductDetailsTabs product={product} />
              </Suspense>
            </div>
            
            {/* Customer Reviews - Desktop only in left column, Mobile below */}
            <div className="hidden lg:block">
              <Suspense fallback={<div className="h-48 bg-muted animate-pulse rounded-lg" />}>
                <CustomerReviews />
              </Suspense>
            </div>
            
            {/* Mobile: Tabs and Reviews */}
            <div className="lg:hidden space-y-8">
              <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded-lg" />}>
                <ProductDetailsTabs product={product} />
              </Suspense>
              <Suspense fallback={<div className="h-48 bg-muted animate-pulse rounded-lg" />}>
                <CustomerReviews />
              </Suspense>
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
