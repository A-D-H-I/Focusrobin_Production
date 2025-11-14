"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { productCatalog } from "@/lib/productData";
import ProductCard from "@/components/ui/ProductCard";

export default function BestsellersCarousel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -400,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 400,
        behavior: "smooth",
      });
    }
  };

  const products = productCatalog.slice(0, 5);

  return (
    <section className="bg-brand-white py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-brand-blue font-headline text-4xl font-bold">
            Trending Now
          </h2>
          
          {/* Navigation Buttons */}
          <div className="flex gap-2">
            <button
              onClick={scrollLeft}
              className="bg-brand-teal text-white p-3 rounded-full hover:bg-brand-teal/90 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={scrollRight}
              className="bg-brand-teal text-white p-3 rounded-full hover:bg-brand-teal/90 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Scrolling Container */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory gap-6 pb-4 hide-scrollbar"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-80 snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

