"use client";

import Image from "next/image";
import Link from "next/link";
import { productCatalog } from "@/lib/productData";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BestsellersSection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-headline font-bold text-center mb-12">
          Trending Now
        </h2>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {productCatalog.map((product) => {
              const mainImage = product.variants[0]?.images[0] || "/images/placeholder.jpg";
              
              return (
              <CarouselItem
                key={product.id}
                className="pl-4 md:basis-1/2 lg:basis-1/3"
              >
                <Link href={`/products/${product.id}`} prefetch={true}>
                  <div className="p-1">
                    <Card className="overflow-hidden border-none shadow-lg transform transition-transform duration-300 hover:scale-105">
                      <CardContent className="p-0">
                        <div className="aspect-[4/3] relative">
                          <Image
                            src={mainImage}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-6">
                          <h3 className="text-lg font-semibold mb-2">
                            {product.name}
                          </h3>
                          <p className="text-lg font-bold text-foreground mb-4">
                            {product.price}
                          </p>
                          <div className="flex items-center space-x-2">
                            {product.variants.map((variant) => (
                              <span
                                key={variant.hex}
                                className="block h-6 w-6 rounded-full border-2 border-border"
                                style={{ backgroundColor: variant.hex }}
                                title={variant.name}
                              ></span>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </Link>
              </CarouselItem>
            )})}
          </CarouselContent>
          <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
          <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
        </Carousel>
        <div className="text-center mt-12">
            <Button size="lg" className="rounded-full px-8 py-6 text-lg">Shop All Bestsellers</Button>
        </div>
      </div>
    </section>
  );
}
