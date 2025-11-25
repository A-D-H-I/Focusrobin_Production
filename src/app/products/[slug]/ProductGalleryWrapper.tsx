"use client";

import { useState } from "react";
import type { Product, ProductColorVariant } from "@/lib/productData";
import ProductGallery from "@/components/shop/product-gallery";

interface ProductGalleryWrapperProps {
  product: Product;
}

export default function ProductGalleryWrapper({ product }: ProductGalleryWrapperProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductColorVariant>(product.variants[0]);

  return <ProductGallery product={product} selectedVariant={selectedVariant} />;
}

