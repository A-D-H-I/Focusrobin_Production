
"use client";

import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const packagingImage = PlaceHolderImages.find(p => p.id === "packaging")!;

export default function PackagingSection() {
  return (
    <section className="relative bg-black text-white py-0 lg:py-16 overflow-hidden min-h-[350px] md:min-h-[400px] lg:min-h-[450px] flex flex-col justify-end lg:justify-center w-full max-w-full">
      <div className="absolute inset-0 z-0">
        <Image
          src={packagingImage.imageUrl}
          alt={packagingImage.description}
          fill
          className="object-cover opacity-30"
          data-ai-hint={packagingImage.imageHint}
        />
      </div>
      <div className="w-full px-4 sm:px-6 relative z-10 pb-8 md:pb-12 lg:pb-0">
        <div className="w-full lg:max-w-[50%]">
          <div className="flex flex-col justify-end text-left">
            <span className="text-white/70 text-sm font-semibold uppercase mb-3">PREMIUM</span>
            <h2 className="text-brand-h2 font-headline mb-3 uppercase text-white">
              Emphasis on Luxury & Feel
            </h2>
            <p className="text-white/80 text-sm sm:text-base">
              Premium packaging crafted from high-quality materials for a luxurious feel.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

