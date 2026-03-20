"use client";

import { useState } from "react";
import type { ProductColorVariant, Product } from "@/lib/productData";
import ProductGallery from "@/components/shop/product-gallery";
import ProductPurchaseForm from "@/components/shop/product-purchase-form";

type ProductPageClientProps = {
  product: Product;
  showGalleryOnly?: boolean;
  showPurchaseFormOnly?: boolean;
  selectedVariant?: ProductColorVariant;
  onVariantChange?: (variant: ProductColorVariant) => void;
};

export default function ProductPageClient({ 
  product, 
  showGalleryOnly = false,
  showPurchaseFormOnly = false,
  selectedVariant: externalSelectedVariant,
  onVariantChange
}: ProductPageClientProps) {
  const [internalSelectedVariant, setInternalSelectedVariant] = useState<ProductColorVariant>(product.variants[0]);
  
  const selectedVariant = externalSelectedVariant || internalSelectedVariant;
  
  const handleVariantChange = (variant: ProductColorVariant) => {
    setInternalSelectedVariant(variant);
    if (onVariantChange) onVariantChange(variant);
  };

  // Mobile Layout: Gallery -> Purchase Form
  if (!showGalleryOnly && !showPurchaseFormOnly) {
    return (
      <div className="lg:hidden space-y-8">
        <ProductGallery product={product} selectedVariant={selectedVariant} />
        <ProductPurchaseForm product={product} selectedVariant={selectedVariant} onVariantChange={handleVariantChange} />
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
        <ProductPurchaseForm product={product} selectedVariant={selectedVariant} onVariantChange={handleVariantChange} />
      </div>
    );
  }

  return null;
}

