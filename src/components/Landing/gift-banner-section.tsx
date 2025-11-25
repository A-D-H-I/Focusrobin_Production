"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { normalizeImageUrl } from "@/lib/normalize-image-url";

interface GiftBannerData {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string | null;
  link: string;
}

interface GiftBannerSectionProps {
  giftBanner: GiftBannerData;
}

export default function GiftBannerSection({ giftBanner }: GiftBannerSectionProps) {
  return (
    <section className="relative py-16 sm:py-24 overflow-hidden min-h-[600px] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Link 
          href={giftBanner.link} 
          prefetch={true}
          className="block w-full h-full group"
          aria-label={giftBanner.title}
        >
          <Image
            src={normalizeImageUrl(giftBanner.imageUrl)}
            alt={giftBanner.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
            sizes="100vw"
            unoptimized
          />
        </Link>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-2xl">
          {/* Text and Button */}
          <div className="flex flex-col justify-center text-center lg:text-left">
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-headline font-bold text-white mb-6 leading-[1.1] tracking-tight">
              {giftBanner.title}
            </h2>
            
            {giftBanner.subtitle ? (
              <p className="text-white/90 text-lg sm:text-xl md:text-2xl mb-8 max-w-xl">
                {giftBanner.subtitle}
              </p>
            ) : (
              <p className="text-white/90 text-lg sm:text-xl md:text-2xl mb-8 max-w-xl">
                Discover our elegant unisex collection, perfect for gifting to your loved ones. Timeless designs that suit everyone.
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href={giftBanner.link} prefetch={true}>
                <Button size="lg" className="rounded-full px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg">
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

