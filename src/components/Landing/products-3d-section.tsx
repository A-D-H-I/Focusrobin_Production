"use client";

import ProductCard from "@/components/shop/product-card";
import type { Product } from "@/lib/productData";
import TranslatableText from "@/components/ui/TranslatableText";

interface Products3DSectionProps {
  products: Product[];
}

export default function Products3DSection({ products }: Products3DSectionProps) {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-brand-h2 font-headline text-foreground mb-6">
            <TranslatableText text="New Arrivals" />
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            <TranslatableText text="Discover our latest additions to the collection. Fresh styles just arrived." />
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              <TranslatableText text="No new arrivals at the moment. Check back soon for new arrivals!" />
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {products.map((product, index) => (
            <ProductCard
              key={`${product.id}-${index}`}
              product={product}
              priority={index < 5} // Prioritize first 5 images for better LCP
            />
          ))}
        </div>
        )}
      </div>
    </section>
  );
}
