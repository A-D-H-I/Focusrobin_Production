
"use client";

import { getAllProducts } from "@/lib/productData";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ProductCard from "./product-card";


export default function RelatedProducts() {
    const products = getAllProducts().slice(0, 8); // Show 8 related products

    return (
        <section className="w-full">
            <div className="container mx-auto px-4 py-8">
                <h2 className="text-3xl font-bold font-headline text-center mb-16">You Might Also Like</h2>
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-4">
                        {products.map((product) => (
                            <CarouselItem key={product.id} className="pl-4 md:basis-1/2 lg:basis-1/4">
                                <ProductCard product={product} />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
                    <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
                </Carousel>
            </div>
        </section>
    )
}

