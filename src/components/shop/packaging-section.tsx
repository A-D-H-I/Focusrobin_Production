"use client";

import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const packagingImage = PlaceHolderImages.find(p => p.id === "packaging")!;

export default function PackagingSection() {
  return (
    <section className="relative bg-black text-white py-0 lg:py-16 overflow-hidden min-h-[350px] md:min-h-[400px] lg:min-h-[450px] flex flex-col justify-end bg-gradient-to-br from-brand-teal/10 to-brand-blue/10 w-full">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={packagingImage.imageUrl}
          alt={packagingImage.description}
          fill
          className="object-cover opacity-30"
          data-ai-hint={packagingImage.imageHint}
        />
      </div>
      
      {/* Gradient Overlay for text readability - lighter to show image */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent lg:from-black/30 lg:via-black/10 lg:to-transparent z-[1]"></div>

      {/* Content Container - Left aligned, positioned at bottom like gift banner */}
      <div className="w-full px-4 sm:px-6 relative z-10 pb-8 sm:pb-10 md:pb-12 lg:pb-16 xl:pb-20 flex flex-col justify-end min-h-full">
        <div className="w-full lg:max-w-[50%]">
          <div className="flex flex-col text-left">
            <span className="text-white/70 text-xs sm:text-sm font-semibold uppercase mb-2 sm:mb-3">
              PREMIUM
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-brand-h2 font-headline mb-2 sm:mb-3 uppercase text-white leading-[1.1] tracking-tight drop-shadow-lg">
              EMPHASIS ON LUXURY &<br />
              FEEL
            </h2>
            <p className="text-white/90 text-xs sm:text-sm md:text-base drop-shadow-md">
              Premium packaging crafted from high-quality materials for a luxurious feel.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}