"use client";

import { useState } from "react";
import type { ProductColorVariant, Product } from "@/lib/productData";
import ProductGallery from "@/components/shop/product-gallery";
import ProductPurchaseForm from "@/components/shop/product-purchase-form";

type ProductPageClientProps = {
  product: Product;
  showGalleryOnly?: boolean;
  showPurchaseFormOnly?: boolean;
};

export default function ProductPageClient({ 
  product, 
  showGalleryOnly = false,
  showPurchaseFormOnly = false 
}: ProductPageClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductColorVariant>(product.variants[0]);

  // Mobile Layout: Gallery -> Purchase Form
  if (!showGalleryOnly && !showPurchaseFormOnly) {
    return (
      <div className="lg:hidden space-y-8">
        <ProductGallery product={product} selectedVariant={selectedVariant} />
        <ProductPurchaseForm product={product} onVariantChange={setSelectedVariant} />
      </div>
    );
  }

  // Desktop: Show only Gallery
  if (showGalleryOnly) {
    return (
      <div className="hidden lg:block">
        <ProductGallery product={product} selectedVariant={selectedVariant} />
      </div>
    );
  }

  // Desktop: Show only Purchase Form
  if (showPurchaseFormOnly) {
    return (
      <div className="hidden lg:block">
        <ProductPurchaseForm product={product} onVariantChange={setSelectedVariant} />
      </div>
    );
  }

  return null;
}

