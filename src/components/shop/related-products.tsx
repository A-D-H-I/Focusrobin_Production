
"use client";

import type { Product } from "@/lib/productData";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ProductCard from "./product-card";
import { cn } from "@/lib/utils";
import TranslatableText from "@/components/ui/TranslatableText";

interface RelatedProductsProps {
  products: Product[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
    if (products.length === 0) {
      return null; // Don't show section if no related products
    }

    return (
        <section className="w-full overflow-hidden">
            <div className="w-full py-1.5 sm:py-2">
                <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 mb-0.5 sm:mb-1 md:mb-2">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-brand-h2 font-bold md:font-normal lg:font-headline text-center"><TranslatableText text="You Might Also Like" /></h2>
                </div>
                <div className="relative w-full">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="ml-0">
                            {products.map((product, index) => (
                                <CarouselItem 
                                    key={product.id} 
                                    className={cn(
                                        index === 0 ? 'pl-4 sm:pl-6 md:pl-8 lg:pl-12' : 'pl-4 sm:pl-6',
                                        index === products.length - 1 ? 'pr-4 sm:pr-6 md:pr-8 lg:pr-12' : 'pr-4 sm:pr-6',
                                        'md:basis-1/2 lg:basis-1/3 xl:basis-1/4'
                                    )}
                                >
                                    <ProductCard product={product} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="absolute left-0 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 hidden sm:flex bg-background/95 backdrop-blur-sm hover:bg-background border-2 shadow-xl" />
                        <CarouselNext className="absolute right-0 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 hidden sm:flex bg-background/95 backdrop-blur-sm hover:bg-background border-2 shadow-xl" />
                    </Carousel>
                </div>
            </div>
        </section>
    )
}

