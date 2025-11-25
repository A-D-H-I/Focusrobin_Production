"use client";

import { useState } from "react";
import type { Product, ProductColorVariant } from "@/lib/productData";
import ProductPurchaseForm from "@/components/shop/product-purchase-form";

interface ProductPurchaseFormWrapperProps {
  product: Product;
}

export default function ProductPurchaseFormWrapper({ product }: ProductPurchaseFormWrapperProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductColorVariant>(product.variants[0]);

  return (
    <ProductPurchaseForm 
      product={product} 
      selectedVariant={selectedVariant}
      onVariantChange={setSelectedVariant} 
    />
  );
}

