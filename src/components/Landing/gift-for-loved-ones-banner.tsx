"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { normalizeImageUrl } from "@/lib/normalize-image-url";

interface GiftForLovedOnesBannerData {
  id: string;
  imageUrl: string;
  mobileTabletImageUrl?: string | null;
  isActive: boolean;
}

interface GiftForLovedOnesBannerProps {
  bannerData?: GiftForLovedOnesBannerData | null;
}

export default function GiftForLovedOnesBanner({ bannerData }: GiftForLovedOnesBannerProps) {
  // If no banner data or not active, show default
  const desktopImageUrl = bannerData?.isActive && bannerData?.imageUrl 
    ? normalizeImageUrl(bannerData.imageUrl)
    : '/shopcategory/kids.jpg'; // Default fallback image
  const mobileImageUrl = bannerData?.isActive && bannerData?.mobileTabletImageUrl
    ? normalizeImageUrl(bannerData.mobileTabletImageUrl)
    : desktopImageUrl; // Fallback to desktop image if mobile not provided

  return (
    <section className="relative py-0 lg:py-16 overflow-hidden min-h-[500px] md:min-h-[600px] lg:min-h-[400px] flex flex-col justify-end lg:justify-center bg-gradient-to-br from-brand-teal/10 to-brand-blue/10">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Link 
          href="/shop/unisex" 
          prefetch={true}
          className="block w-full h-full group"
          aria-label="Gift for your loved ones"
        >
          <Image
            src={mobileImageUrl}
            alt="Gift for your loved ones"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 lg:hidden"
            priority
            sizes="100vw"
            unoptimized
          />
          <Image
            src={desktopImageUrl}
            alt="Gift for your loved ones"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 hidden lg:block"
            priority
            sizes="100vw"
            unoptimized
          />
        </Link>
      </div>

      {/* Gradient Overlay for text readability - stronger on mobile/tablet */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent lg:from-black/30 lg:via-black/10 lg:to-transparent z-[1]"></div>

      <div className="w-full px-4 sm:px-6 relative z-10 pb-6 md:pb-8 lg:pb-0">
        <div className="w-full lg:max-w-[50%]">
          {/* Text and Button */}
          <div className="flex flex-col justify-end text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-headline font-bold text-white mb-3 md:mb-4 lg:mb-6 leading-[1.1] tracking-tight drop-shadow-lg">
              Gift for your loved ones
            </h2>
            
            <p className="text-white/90 text-sm sm:text-base md:text-lg lg:text-2xl mb-4 md:mb-6 lg:mb-8 drop-shadow-md">
              Discover our elegant unisex collection, perfect for gifting to your loved ones. Timeless designs that suit everyone.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-start">
              <Link href="/shop/unisex" prefetch={true}>
                <Button size="lg" className="rounded-full px-6 py-4 md:px-7 md:py-5 lg:px-8 lg:py-6 text-sm md:text-base lg:text-lg bg-[#4DCECA] text-[#1C3142] hover:bg-[#4DCECA]/90 shadow-xl">
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

