"use client";

import ProductCard from "@/components/shop/product-card";
import type { Product } from "@/lib/productData";

interface Products3DSectionProps {
  products: Product[];
}

export default function Products3DSection({ products }: Products3DSectionProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-foreground mb-6">
            Explore Our Collection
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Browse our premium eyewear collection. Discover styles that match your personality.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <ProductCard
              key={`${product.id}-${index}`}
              product={product}
              priority={index < 5} // Prioritize first 5 images for better LCP
            />
          ))}
        </div>
      </div>
    </section>
  );
}
