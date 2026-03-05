"use client";

import Image from "next/image";
import { normalizeImageUrl } from "@/lib/normalize-image-url";

interface PremiumPackingBannerProps {
  imageUrl?: string;
  mobileTabletImageUrl?: string | null;
  product?: any;
}

export default function PremiumPackingBanner({
  imageUrl = '/PremiumPacking/premiumPackingLaptop.jpeg',
  mobileTabletImageUrl,
  product
}: PremiumPackingBannerProps) {
  if (product && product.brand && product.brand.trim().toLowerCase() !== 'focusrobin') {
    return null;
  }

  const desktopImageUrl = normalizeImageUrl(imageUrl);
  const mobileImageUrl = mobileTabletImageUrl
    ? normalizeImageUrl(mobileTabletImageUrl)
    : normalizeImageUrl('/PremiumPacking/premiumPackingMobile.png');

  return (
    <section className="relative py-0 lg:py-16 overflow-hidden min-h-[500px] md:min-h-[600px] lg:min-h-[400px] flex flex-col justify-end bg-gradient-to-br from-brand-teal/10 to-brand-blue/10 w-full">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="block w-full h-full group">
          <Image
            src={mobileImageUrl}
            alt="Premium Packaging"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 lg:hidden"
            priority
            sizes="100vw"
            unoptimized
          />
          <Image
            src={desktopImageUrl}
            alt="Premium Packaging"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 hidden lg:block"
            priority
            sizes="100vw"
            unoptimized
          />
        </div>
      </div>

      {/* Gradient Overlay for text readability - stronger on mobile/tablet */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent lg:from-black/30 lg:via-black/10 lg:to-transparent z-[1]"></div>

      {/* Mobile/Tablet Layout - Bottom Left */}
      <div className="w-full px-4 sm:px-6 relative z-10 pb-8 sm:pb-10 md:pb-12 flex flex-col justify-end min-h-full lg:hidden">
        <div className="w-full">
          <div className="flex flex-col text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-headline text-white mb-2 sm:mb-3 md:mb-4 leading-[1.1] tracking-tight drop-shadow-lg">
              Premium Packaging
            </h2>

            <p className="text-white/90 text-xs sm:text-sm md:text-base drop-shadow-md">
              Every product is carefully packaged with premium materials, ensuring your purchase arrives in perfect condition. Experience the luxury of unboxing with our thoughtfully designed packaging.
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Top Left Corner */}
      <div className="hidden lg:block absolute top-0 left-0 w-full h-full z-10">
        <div className="w-full h-full px-8 xl:px-12 2xl:px-16 pt-8 xl:pt-12 2xl:pt-16">
          <div className="w-full max-w-[50%] xl:max-w-[45%] 2xl:max-w-[40%]">
            {/* Text Content */}
            <div className="flex flex-col text-left">
              <h2 className="text-4xl lg:text-5xl xl:text-brand-h2 font-headline text-white mb-3 md:mb-4 leading-[1.1] tracking-tight drop-shadow-lg">
                Premium Packaging
              </h2>

              <p className="text-white/90 text-base lg:text-lg drop-shadow-md">
                Every product is carefully packaged with premium materials, ensuring your purchase arrives in perfect condition. Experience the luxury of unboxing with our thoughtfully designed packaging.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

