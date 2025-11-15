"use client";

import { useState } from "react";
import type { ProductColorVariant, Product } from "@/lib/productData";
import ProductGallery from "@/components/shop/product-gallery";
import ProductPurchaseForm from "@/components/shop/product-purchase-form";

type ProductPageClientProps = {
  product: Product;
};

export default function ProductPageClient({ product }: ProductPageClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductColorVariant>(product.variants[0]);

  return (
    <>
      {/* Mobile Layout: Gallery -> Purchase Form */}
      <div className="lg:hidden space-y-8">
        <ProductGallery product={product} selectedVariant={selectedVariant} />
        <ProductPurchaseForm product={product} onVariantChange={setSelectedVariant} />
      </div>

      {/* Desktop Grid Layout */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-12">
        {/* Left Column - Scrollable */}
        <div className="lg:col-span-3 space-y-12">
          <ProductGallery product={product} selectedVariant={selectedVariant} />
        </div>
        
        {/* Right Column - Sticky */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-28">
            <ProductPurchaseForm product={product} onVariantChange={setSelectedVariant} />
          </div>
        </div>
      </div>
    </>
  );
}

