
"use client";

import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Badge } from "@/components/ui/badge";

const packagingImage = PlaceHolderImages.find(p => p.id === "packaging")!;

export default function PackagingSection() {
  return (
    <section className="relative bg-black text-white py-24 sm:py-32 w-screen">
      <div className="absolute inset-0 z-0">
        <Image
          src={packagingImage.imageUrl}
          alt={packagingImage.description}
          fill
          className="object-cover opacity-30"
          data-ai-hint={packagingImage.imageHint}
        />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end lg:items-center min-h-[400px] md:min-h-[500px]">
        <div className="max-w-xl pb-12 md:pb-16 lg:pb-0">
          <Badge variant="secondary" className="mb-4">PREMIUM</Badge>
          <h2 className="text-3xl sm:text-4xl font-headline font-bold mb-4 uppercase">
            Emphasis on Luxury & Feel
          </h2>
          <p className="text-white/80">
            Experience our premium packaging. Crafted from high-quality materials, it's designed to provide a superior, luxurious feel from the very first touch.
          </p>
        </div>
      </div>
    </section>
  );
}

