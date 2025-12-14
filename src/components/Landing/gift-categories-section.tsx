"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { normalizeImageUrl } from "@/lib/normalize-image-url";
import { cn } from "@/lib/utils";

interface CategoryImageData {
  id: string;
  category: string;
  imageUrl: string;
  alt: string;
  link: string;
}

interface GiftCategoriesSectionProps {
  categoryImages: CategoryImageData[];
}

const categoryLabels: Record<string, string> = {
  MEN: 'SHOP FOR MEN',
  WOMEN: 'SHOP FOR WOMEN',
  KIDS: 'SHOP FOR KIDS',
};

const categoryRoutes: Record<string, string> = {
  MEN: '/shop/men',
  WOMEN: '/shop/women',
  KIDS: '/shop/kids',
};

export default function GiftCategoriesSection({ categoryImages }: GiftCategoriesSectionProps) {
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const autoScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Parallax scroll effect (for desktop)
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      
      // Only apply parallax on desktop (md and up)
      if (window.innerWidth >= 768) {
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

  // Auto-scroll functionality for mobile/tablet - continuously scroll through categories
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 1024) return; // Desktop - no auto-scroll
    
    let retryCount = 0;
    const maxRetries = 10;
    
    const scrollToNextCategory = () => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) {
        retryCount++;
        if (retryCount < maxRetries) {
          setTimeout(scrollToNextCategory, 200);
        }
        return;
      }
      
      // Don't scroll if user is interacting
      if (isUserScrolling) {
        // Retry after user stops scrolling
        autoScrollIntervalRef.current = setTimeout(scrollToNextCategory, 3000);
        return;
      }
      
      const container = scrollContainer;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      const maxScroll = scrollWidth - clientWidth;

      if (maxScroll <= 0) return; // No need to scroll if content fits
      
      // Get all category items (snap points)
      const categoryItems = container.querySelectorAll('[class*="snap-start"]');
      if (categoryItems.length <= 1) return; // Only one or no items, can't scroll
      
      // Find the current visible item
      const containerRect = container.getBoundingClientRect();
      let currentIndex = 0;
      let minDistance = Infinity;
      
      categoryItems.forEach((item, index) => {
        const itemRect = item.getBoundingClientRect();
        const distance = Math.abs(itemRect.left - containerRect.left);
        if (distance < minDistance) {
          minDistance = distance;
          currentIndex = index;
        }
      });
      
      // Calculate next index (wrap around if at end)
      const nextIndex = (currentIndex + 1) % categoryItems.length;
      const nextItem = categoryItems[nextIndex] as HTMLElement;
      
      if (!nextItem) return;
      
      // Calculate scroll position to show the next item
      const nextItemRect = nextItem.getBoundingClientRect();
      const containerRect2 = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft;
      const targetScroll = scrollLeft + (nextItemRect.left - containerRect2.left);
      
      // Smooth scroll to next category over 1 second
      const startScroll = container.scrollLeft;
      const distance = targetScroll - startScroll;
      const duration = 1000; // 1 second
      const startTime = performance.now();

      const animateScroll = (currentTime: number) => {
        const cont = scrollContainerRef.current;
        if (!cont || isUserScrolling) return;
        
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1); // 0 to 1
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        
        const currentScroll = startScroll + (distance * easeOutCubic);
        
        cont.scrollLeft = currentScroll;

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        } else {
          // After scrolling completes, schedule next scroll
          autoScrollIntervalRef.current = setTimeout(scrollToNextCategory, 2000); // Wait 2 seconds before next scroll
        }
      };

      requestAnimationFrame(animateScroll);
    };

    // Start auto-scroll after a delay to ensure DOM is ready
    const initialTimeout = setTimeout(() => {
      scrollToNextCategory();
    }, 1500);

    return () => {
      clearTimeout(initialTimeout);
      if (autoScrollIntervalRef.current) {
        clearTimeout(autoScrollIntervalRef.current);
      }
    };
  }, [categoryImages.length, isUserScrolling]);

  // Handle user interaction - pause auto-scroll when user manually scrolls
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleUserScroll = () => {
      if (window.innerWidth >= 768) return; // Only on mobile
      setIsUserScrolling(true);
      
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }

      autoScrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
      }, 3000);
    };

    scrollContainer.addEventListener('scroll', handleUserScroll, { passive: true });
    scrollContainer.addEventListener('touchstart', handleUserScroll, { passive: true });
    scrollContainer.addEventListener('mousedown', handleUserScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleUserScroll);
      scrollContainer.removeEventListener('touchstart', handleUserScroll);
      scrollContainer.removeEventListener('mousedown', handleUserScroll);
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
    };
  }, []);

  if (categoryImages.length === 0) {
    return null;
  }

  // Get images for each category
  const menImage = categoryImages.find(img => img.category === 'MEN');
  const womenImage = categoryImages.find(img => img.category === 'WOMEN');
  const kidsImage = categoryImages.find(img => img.category === 'KIDS');

  // Always show all three categories, even if they don't have images
  const categories = [
    { image: menImage, category: 'MEN' },
    { image: womenImage, category: 'WOMEN' },
    { image: kidsImage, category: 'KIDS' },
  ];

  // If no categories have images, don't show the section
  if (categories.every(item => !item.image)) {
    return null;
  }

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-[300px] lg:min-h-[600px] overflow-hidden w-full"
    >
      {/* Desktop: Grid Layout (lg and above) */}
      <div className="hidden lg:grid lg:grid-cols-3 min-h-[600px]">
        {categories.map(({ image, category }) => {
          if (!image) return null;
          
          return (
            <Link 
              key={image.id}
              href={categoryRoutes[category] || '/shop'} 
              prefetch={true}
              className="relative group overflow-hidden cursor-pointer"
              aria-label={`Shop for ${category.toLowerCase()}`}
            >
              <div className="absolute inset-0 overflow-hidden">
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
                    src={normalizeImageUrl(image.imageUrl)}
                    alt={image.alt}
                    fill
                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                    unoptimized
                  />
                </div>
              </div>
              <div className="absolute bottom-8 left-0 right-0 text-center z-10">
                <h3 className="text-white font-headline text-2xl font-bold uppercase tracking-wider drop-shadow-lg">
                  {categoryLabels[category] || `SHOP FOR ${category}`}
                </h3>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 z-10" />
            </Link>
          );
        })}
      </div>

      {/* Mobile & Tablet: Horizontal Scrollable - Edge to Edge */}
      <div 
        className="lg:hidden overflow-hidden relative"
        style={{
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
        }}
      >
        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
            width: '100vw',
          }}
        >
          <div className="flex gap-0">
            {categories.map(({ image, category }) => {
              if (!image) return null;
              
              return (
                <Link 
                  key={image.id}
                  href={categoryRoutes[category] || '/shop'} 
                  prefetch={true}
                  className="relative group overflow-hidden cursor-pointer flex-shrink-0 snap-start min-h-[300px]"
                  style={{ width: '100vw' }}
                  aria-label={`Shop for ${category.toLowerCase()}`}
                >
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src={normalizeImageUrl(image.imageUrl)}
                      alt={image.alt}
                      fill
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                      unoptimized
                    />
                  </div>
                  <div className="absolute bottom-8 left-0 right-0 text-center z-10">
                    <h3 className="text-white font-headline text-xl sm:text-2xl font-bold uppercase tracking-wider drop-shadow-lg">
                      {categoryLabels[category] || `SHOP FOR ${category}`}
                    </h3>
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 z-10" />
                </Link>
              );
            })}
            {/* Duplicate for seamless loop */}
            {categories.map(({ image, category }) => {
              if (!image) return null;
              
              return (
                <Link 
                  key={`duplicate-${image.id}`}
                  href={categoryRoutes[category] || '/shop'} 
                  prefetch={true}
                  className="relative group overflow-hidden cursor-pointer flex-shrink-0 snap-start min-h-[300px]"
                  style={{ width: '100vw' }}
                  aria-label={`Shop for ${category.toLowerCase()}`}
                >
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src={normalizeImageUrl(image.imageUrl)}
                      alt={image.alt}
                      fill
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                      unoptimized
                    />
                  </div>
                  <div className="absolute bottom-8 left-0 right-0 text-center z-10">
                    <h3 className="text-white font-headline text-xl sm:text-2xl font-bold uppercase tracking-wider drop-shadow-lg">
                      {categoryLabels[category] || `SHOP FOR ${category}`}
                    </h3>
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 z-10" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <style jsx global>{`
        div[class*="overflow-x-auto"]::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
        div[class*="overflow-x-auto"] {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </section>
  );
}

