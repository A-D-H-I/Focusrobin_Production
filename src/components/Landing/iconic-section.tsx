"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { normalizeImageUrl } from "@/lib/normalize-image-url";

interface IconicImageData {
  id: string;
  imageUrl: string;
  mobileTabletImageUrl?: string | null;
  alt: string;
}

interface IconicSectionProps {
  iconicImage: IconicImageData;
}

export default function IconicSection({ iconicImage }: IconicSectionProps) {
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      
      // Calculate parallax offset based on scroll position
      if (sectionTop < window.innerHeight && sectionTop > -sectionHeight) {
        // Parallax effect: move image slower than scroll
        const parallaxOffset = (sectionTop / sectionHeight) * 30;
        setScrollY(parallaxOffset);
      } else if (sectionTop <= -sectionHeight) {
        setScrollY(-30);
      } else {
        setScrollY(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!iconicImage) {
    return null;
  }

  return (
    <section 
      ref={sectionRef}
      className="relative py-0 lg:py-16 overflow-hidden min-h-[500px] md:min-h-[600px] lg:min-h-[400px] flex flex-col justify-end bg-gradient-to-br from-brand-teal/10 to-brand-blue/10"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          style={{
            transform: `translateY(${scrollY}px) scale(1.15)`,
            transition: 'transform 0.1s ease-out',
            height: '120%',
            width: '100%',
            top: '-10%',
            left: '0',
            position: 'absolute',
          }}
        >
          <Image
            src={normalizeImageUrl(iconicImage.mobileTabletImageUrl || iconicImage.imageUrl)}
            alt={iconicImage.alt}
            fill
            className="object-cover lg:hidden"
            priority
            sizes="100vw"
            unoptimized
          />
          <Image
            src={normalizeImageUrl(iconicImage.imageUrl)}
            alt={iconicImage.alt}
            fill
            className="object-cover hidden lg:block"
            priority
            sizes="100vw"
            unoptimized
          />
        </div>
      </div>

      {/* Gradient Overlay for text readability - stronger on mobile/tablet */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent lg:from-black/30 lg:via-black/10 lg:to-transparent z-[1]"></div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 w-full pb-8 sm:pb-10 md:pb-12 lg:pb-16 xl:pb-20 flex flex-col justify-end min-h-full">
        <div className="max-w-2xl lg:max-w-[45%] xl:max-w-[40%]">
          {/* Text and Buttons */}
          <div className="flex flex-col text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-brand-h2 font-headline text-white mb-2 sm:mb-3 md:mb-4 leading-[1.1] tracking-tight drop-shadow-lg">
              GIVE SOMETHING ICONIC
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 justify-center lg:justify-start">
              <Link href="/shop" prefetch={true}>
                <Button size="lg" className="rounded-full px-4 py-3 sm:px-5 sm:py-3.5 md:px-6 md:py-4 lg:px-7 lg:py-4.5 text-xs sm:text-sm md:text-base lg:text-lg bg-[#4DCECA] text-[#1C3142] hover:bg-[#4DCECA]/90 shadow-xl">
                  SHOP SUNGLASSES
                </Button>
              </Link>
              <Link href="/try-on" prefetch={true}>
                <Button size="lg" className="rounded-full px-4 py-3 sm:px-5 sm:py-3.5 md:px-6 md:py-4 lg:px-7 lg:py-4.5 text-xs sm:text-sm md:text-base lg:text-lg bg-[#4DCECA] text-[#1C3142] hover:bg-[#4DCECA]/90 shadow-xl">
                  Virtual Try-On
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

