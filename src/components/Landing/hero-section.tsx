"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { normalizeImageUrl } from "@/lib/normalize-image-url";

interface HeroData {
  desktopImageUrl: string;
  mobileImageUrl: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

interface HeroSectionProps {
  heroData: HeroData;
}

export default function HeroSection({ heroData }: HeroSectionProps) {
  const [offsetY, setOffsetY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setOffsetY(window.pageYOffset);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative h-screen overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{ transform: `translateY(${offsetY * 0.5}px)` }}
      >
        {/* Mobile Image */}
        <Image
          src={normalizeImageUrl(heroData.mobileImageUrl)}
          alt={heroData.title}
          fill
          className="object-cover md:hidden"
          priority
          unoptimized
        />
        {/* Desktop Image */}
        <Image
          src={normalizeImageUrl(heroData.desktopImageUrl)}
          alt={heroData.title}
          fill
          className="object-cover hidden md:block"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="relative z-10 flex h-full items-end justify-center text-center text-white px-4 pb-20 md:pb-34">
        <div
           className={cn(
            "transform transition-all duration-1000 ease-out w-full max-w-4xl",
            isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-headline font-bold mb-4 drop-shadow-md break-words px-2">
                {heroData.title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 drop-shadow break-words px-2">
                {heroData.subtitle}
            </p>
            <Link href={heroData.ctaLink}>
              <Button size="lg" className="rounded-full px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg">
                  {heroData.ctaText}
              </Button>
            </Link>
        </div>
      </div>
    </section>
  );
}
