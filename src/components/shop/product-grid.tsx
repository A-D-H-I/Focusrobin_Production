"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/productData";
import ProductCard from "./product-card";
import { cn } from "@/lib/utils";

interface ProductGridProps {
    products: Product[];
    viewMode?: "grid" | "list";
}

export default function ProductGrid({ products, viewMode = "grid" }: ProductGridProps) {
    const searchParams = useSearchParams();
    const viewedProductId = searchParams.get('viewed');
    
    // Reorder products to put viewed product at the top
    const sortedProducts = useMemo(() => {
        if (!viewedProductId) {
            return products;
        }
        
        const viewedIndex = products.findIndex(p => p.id === viewedProductId);
        if (viewedIndex === -1) {
            return products;
        }
        
        const viewedProduct = products[viewedIndex];
        const otherProducts = products.filter((_, i) => i !== viewedIndex);
        return [viewedProduct, ...otherProducts];
    }, [products, viewedProductId]);

    // Scroll to top when product is viewed
    useEffect(() => {
        if (viewedProductId) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [viewedProductId]);

  return (
    <div className={cn(
      viewMode === "grid" 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        : "flex flex-col gap-4"
    )}>
      {sortedProducts.map((product, index) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          priority={index < 6}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
}
