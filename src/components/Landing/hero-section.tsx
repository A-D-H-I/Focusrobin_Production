"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { normalizeImageUrl } from "@/lib/normalize-image-url";

interface HeroData {
  id: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  isActive?: boolean;
  order?: number;
}

interface HeroSectionProps {
  heroData: HeroData[];
}

export default function HeroSection({ heroData }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  // Filter to only active hero images and sort by order
  const activeHeroImages = heroData
    .filter(h => h && h.isActive !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Parallax scroll effect - fixed to prevent white bars
  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.querySelector('section[class*="h-screen"]');
      if (!heroSection) return;
      
      const rect = heroSection.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      
      // Calculate parallax offset based on scroll position
      // Only apply when section is visible and being scrolled
      // Use smaller multiplier and ensure image always covers the section
      if (sectionTop < window.innerHeight && sectionTop > -sectionHeight) {
        // Parallax effect: move image slower than scroll (reduced intensity)
        // Use smaller multiplier to prevent gaps
        const parallaxOffset = (sectionTop / sectionHeight) * 30;
        setScrollY(parallaxOffset);
      } else if (sectionTop <= -sectionHeight) {
        // Section is completely scrolled past - keep image in place
        setScrollY(-30);
      } else {
        // Section hasn't been reached yet
        setScrollY(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Auto-scroll functionality - slower on mobile devices
  useEffect(() => {
    if (activeHeroImages.length <= 1 || !isAutoPlaying) return;

    // Function to get scroll interval based on screen size
    const getScrollInterval = () => {
      if (typeof window === 'undefined') return 5000;
      // Slower speed on mobile (8 seconds) vs desktop (5 seconds)
      return window.innerWidth < 768 ? 8000 : 5000;
    };

    let scrollInterval = getScrollInterval();
    let interval: NodeJS.Timeout;

    const startInterval = () => {
      scrollInterval = getScrollInterval();
      if (interval) clearInterval(interval);
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === activeHeroImages.length - 1 ? 0 : prevIndex + 1
        );
      }, scrollInterval);
    };

    // Start initial interval
    startInterval();

    // Update interval on window resize (e.g., device rotation)
    const handleResize = () => {
      const newInterval = getScrollInterval();
      if (newInterval !== scrollInterval) {
        startInterval();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeHeroImages.length, isAutoPlaying]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    // Keep auto-play running continuously, don't pause on manual navigation
  }, []);

  if (activeHeroImages.length === 0) {
    return null;
  }

  const currentHero = activeHeroImages[currentIndex];
  // Use the first image's text and button text for all images (shared)
  const sharedText = activeHeroImages[0];
  // But use current image's route (individual routing per image)
  const currentRoute = currentHero.ctaLink;

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Carousel Container */}
      <div className="relative h-full w-full overflow-hidden">
        {activeHeroImages.map((hero, index) => (
          <div
            key={hero.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            )}
            style={{
              transform: index === currentIndex 
                ? `translateY(${scrollY}px) scale(1.15)` 
                : 'none',
              transition: index === currentIndex 
                ? 'transform 0.1s ease-out' 
                : 'opacity 1s ease-in-out',
              // Ensure image always covers the section even when parallax moves it
              height: '120%',
              width: '100%',
              top: '-10%',
              left: '0',
            }}
          >
            {/* Mobile Image */}
            <Image
              src={normalizeImageUrl(hero.mobileImageUrl)}
              alt={sharedText?.title || hero.title}
              fill
              className="object-cover md:hidden"
              priority={index === 0}
              unoptimized
            />
            {/* Desktop Image */}
            <Image
              src={normalizeImageUrl(hero.desktopImageUrl)}
              alt={sharedText?.title || hero.title}
              fill
              className="object-cover hidden md:block"
              priority={index === 0}
              unoptimized
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>
        ))}
      </div>

      {/* Content Overlay - Fixed positioning to ensure visibility */}
      <div className="absolute inset-0 z-20 flex items-end justify-center text-center text-white px-4 pb-20 md:pb-34 pointer-events-none">
        <div
          className={cn(
            "transform transition-all duration-1000 ease-out w-full max-w-4xl pointer-events-auto",
            isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-headline font-bold mb-4 drop-shadow-lg break-words px-2">
            {sharedText?.title || "Elevate Your Style, Enhance Your Vision"}
          </h1>
          <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 drop-shadow-lg break-words px-2">
            {sharedText?.subtitle || "Shop our latest collection of premium sunglasses & prescription glasses."}
          </p>
          <Link href={currentRoute || "/shop"}>
            <Button size="lg" className="rounded-full px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg bg-brand-teal hover:bg-brand-teal/90 text-white shadow-lg">
              {sharedText?.ctaText || "Shop Now"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Dots Indicator */}
      {activeHeroImages.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {activeHeroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}