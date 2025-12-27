"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { normalizeImageUrl } from "@/lib/normalize-image-url";

interface GiftBannerData {
  id: string;
  imageUrl: string;
  mobileTabletImageUrl?: string | null;
  title: string;
  subtitle: string | null;
  link: string;
}

interface GiftBannerSectionProps {
  giftBanner: GiftBannerData;
}

export default function GiftBannerSection({ giftBanner }: GiftBannerSectionProps) {
  return (
    <section className="relative py-0 lg:py-16 overflow-hidden min-h-[500px] md:min-h-[600px] lg:min-h-[400px] flex flex-col justify-end bg-gradient-to-br from-brand-teal/10 to-brand-blue/10">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Link 
          href={giftBanner.link} 
          prefetch={true}
          className="block w-full h-full group"
          aria-label={giftBanner.title}
        >
          <Image
            src={normalizeImageUrl(giftBanner.mobileTabletImageUrl || giftBanner.imageUrl)}
            alt={giftBanner.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105 lg:hidden"
            priority
            sizes="100vw"
            unoptimized
          />
          <Image
            src={normalizeImageUrl(giftBanner.imageUrl)}
            alt={giftBanner.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105 hidden lg:block"
            priority
            sizes="100vw"
            unoptimized
          />
        </Link>
      </div>

      {/* Gradient Overlay for text readability - stronger on mobile/tablet */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent lg:from-black/30 lg:via-black/10 lg:to-transparent z-[1]"></div>

      <div className="w-full px-4 sm:px-6 relative z-10 pb-8 sm:pb-10 md:pb-12 lg:pb-16 xl:pb-20 flex flex-col justify-end min-h-full">
        <div className="w-full lg:max-w-[45%] xl:max-w-[40%]">
          {/* Text and Button */}
          <div className="flex flex-col text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-brand-h2 font-headline text-white mb-2 sm:mb-3 md:mb-4 leading-[1.1] tracking-tight drop-shadow-lg">
              {giftBanner.title}
            </h2>
            
            {giftBanner.subtitle ? (
              <p className="text-white/90 text-xs sm:text-sm md:text-base lg:text-lg mb-3 sm:mb-4 md:mb-5 lg:mb-6 drop-shadow-md">
                {giftBanner.subtitle}
              </p>
            ) : (
              <p className="text-white/90 text-xs sm:text-sm md:text-base lg:text-lg mb-3 sm:mb-4 md:mb-5 lg:mb-6 drop-shadow-md">
                Discover our elegant unisex collection, perfect for gifting to your loved ones. Timeless designs that suit everyone.
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 justify-start">
              <Link href={giftBanner.link} prefetch={true}>
                <Button size="lg" className="rounded-full px-4 py-3 sm:px-5 sm:py-3.5 md:px-6 md:py-4 lg:px-7 lg:py-4.5 text-xs sm:text-sm md:text-base lg:text-lg bg-[#4DCECA] text-[#1C3142] hover:bg-[#4DCECA]/90 shadow-xl">
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

