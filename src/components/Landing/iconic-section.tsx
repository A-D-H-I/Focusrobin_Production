"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { normalizeImageUrl } from "@/lib/normalize-image-url";

interface IconicImageData {
  id: string;
  imageUrl: string;
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
      className="relative py-16 sm:py-24 overflow-hidden min-h-[600px] flex items-end md:items-center"
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
            src={normalizeImageUrl(iconicImage.imageUrl)}
            alt={iconicImage.alt}
            fill
            className="object-cover"
            priority
            sizes="100vw"
            unoptimized
          />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 pb-5 md:pb-0 w-full">
        <div className="max-w-2xl">
          {/* Text and Buttons */}
          <div className="flex flex-col justify-center text-center lg:text-left">
            <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-headline font-bold text-white mb-6 md:mb-12 leading-[1.1] tracking-tight">
              GIVE SOMETHING ICONIC
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link href="/shop" prefetch={true}>
                <Button size="lg" className="rounded-full px-4 sm:px-6 md:px-8 py-3 sm:py-5 md:py-6 text-sm sm:text-base md:text-lg">
                  SHOP SUNGLASSES
                </Button>
              </Link>
              <Link href="/shop" prefetch={true}>
                <Button size="lg" className="rounded-full px-4 sm:px-6 md:px-8 py-3 sm:py-5 md:py-6 text-sm sm:text-base md:text-lg">
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

