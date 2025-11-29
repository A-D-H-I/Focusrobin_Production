"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { normalizeImageUrl } from "@/lib/normalize-image-url";

interface GiftForLovedOnesBannerData {
  id: string;
  imageUrl: string;
  isActive: boolean;
}

interface GiftForLovedOnesBannerProps {
  bannerData?: GiftForLovedOnesBannerData | null;
}

export default function GiftForLovedOnesBanner({ bannerData }: GiftForLovedOnesBannerProps) {
  // If no banner data or not active, show default
  const imageUrl = bannerData?.isActive && bannerData?.imageUrl 
    ? normalizeImageUrl(bannerData.imageUrl)
    : '/shopcategory/kids.jpg'; // Default fallback image

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden min-h-[400px] flex items-center bg-gradient-to-br from-brand-teal/10 to-brand-blue/10">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Link 
          href="/shop/unisex" 
          prefetch={true}
          className="block w-full h-full group"
          aria-label="Gift for your loved ones"
        >
          <Image
            src={imageUrl}
            alt="Gift for your loved ones"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-90"
            priority
            sizes="100vw"
            unoptimized
          />
        </Link>
      </div>

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20 z-[1]"></div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-2xl">
          {/* Text and Button */}
          <div className="flex flex-col justify-center text-left">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-white mb-6 leading-[1.1] tracking-tight drop-shadow-lg">
              Gift for your loved ones
            </h2>
            
            <p className="text-white/90 text-lg sm:text-xl md:text-2xl mb-8 max-w-xl drop-shadow-md">
              Discover our elegant unisex collection, perfect for gifting to your loved ones. Timeless designs that suit everyone.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-start">
              <Link href="/shop/unisex" prefetch={true}>
                <Button size="lg" className="rounded-full px-8 py-6 text-base sm:text-lg bg-brand-teal text-white hover:bg-brand-teal/90 shadow-xl">
                  SHOP UNISEX COLLECTION
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

