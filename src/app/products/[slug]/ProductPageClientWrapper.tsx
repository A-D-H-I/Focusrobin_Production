"use client";

import { useState } from "react";
import type { Product, ProductColorVariant } from "@/lib/productData";
import ProductGallery from "@/components/shop/product-gallery";

interface ProductPageClientWrapperProps {
  product: Product;
  selectedVariant: ProductColorVariant;
  onVariantChange: (variant: ProductColorVariant) => void;
}

export default function ProductPageClientWrapper({ product, selectedVariant, onVariantChange }: ProductPageClientWrapperProps) {
  return <ProductGallery product={product} selectedVariant={selectedVariant} />;
}

