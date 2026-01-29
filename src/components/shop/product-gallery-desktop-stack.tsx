"use client";

import { useState, useEffect, useRef } from "react";
import * as React from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Product, ProductColorVariant } from "@/lib/productData";

type ProductGalleryDesktopStackProps = {
  product: Product;
  selectedVariant: ProductColorVariant;
};

export default function ProductGalleryDesktopStack({ product, selectedVariant }: ProductGalleryDesktopStackProps) {
  const galleryRef = useRef<HTMLDivElement>(null);
  // Get images for the selected color variant from database
  const galleryImages = selectedVariant.images || [];
  const thumbnail = selectedVariant.thumbnail || '';

  // Create a deduplicated list of all images from database
  const allImages = React.useMemo(() => {
    if (galleryImages.length > 0) {
      const uniqueImages: string[] = [];
      const seen = new Set<string>();
      for (const img of galleryImages) {
        if (img && img.trim() && !seen.has(img)) {
          uniqueImages.push(img);
          seen.add(img);
        }
      }
      return uniqueImages;
    } else if (thumbnail && thumbnail.trim()) {
      return [thumbnail];
    }
    return [];
  }, [thumbnail, galleryImages, selectedVariant.hex, selectedVariant.sku, selectedVariant.name]);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (allImages.length === 0) {
    return (
      <div className="w-full flex items-center justify-center text-muted-foreground py-24">
        <span>No images available</span>
      </div>
    );
  }

  const firstImage = allImages[0];
  const remainingImages = allImages.slice(1);

  // Handle opening fullscreen
  const openFullscreen = (imageUrl: string) => {
    const index = allImages.findIndex(img => img === imageUrl);
    if (index !== -1) {
      setCurrentImageIndex(index);
    }
    setIsFullscreen(true);
    // Prevent background scrolling with scrollbar compensation
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  };

  // Handle closing fullscreen
  const closeFullscreen = () => {
    setIsFullscreen(false);
    document.body.style.overflow = 'unset';
    document.body.style.paddingRight = '';
  };

  // Handle navigation in fullscreen
  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Handle keyboard navigation
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
        document.body.style.overflow = 'unset';
        document.body.style.paddingRight = '';
      } else if (e.key === 'ArrowLeft') {
        setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, allImages.length]);

  // Capture scroll events and apply to gallery with smooth scrolling
  useEffect(() => {
    const galleryContainer = galleryRef.current;
    if (!galleryContainer) return;

    let scrollVelocity = 0;
    let isScrolling = false;
    let animationFrameId: number | null = null;

    const smoothScroll = () => {
      if (!galleryContainer) return;

      const scrollTop = galleryContainer.scrollTop;
      const scrollHeight = galleryContainer.scrollHeight;
      const clientHeight = galleryContainer.clientHeight;

      // Apply velocity with easing
      if (Math.abs(scrollVelocity) > 0.1) {
        galleryContainer.scrollTop += scrollVelocity;

        // Apply friction
        scrollVelocity *= 0.92;

        // Check boundaries
        const newScrollTop = galleryContainer.scrollTop;
        if (newScrollTop <= 0) {
          galleryContainer.scrollTop = 0;
          scrollVelocity = 0;
        } else if (newScrollTop >= scrollHeight - clientHeight) {
          galleryContainer.scrollTop = scrollHeight - clientHeight;
          scrollVelocity = 0;
        }

        animationFrameId = requestAnimationFrame(smoothScroll);
      } else {
        scrollVelocity = 0;
        isScrolling = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // Check if the scroll is happening within the product section
      const target = e.target as HTMLElement;
      const productSection = target.closest('[data-product-section]');

      if (productSection) {
        const scrollTop = galleryContainer.scrollTop;
        const scrollHeight = galleryContainer.scrollHeight;
        const clientHeight = galleryContainer.clientHeight;

        // Calculate boundaries with tolerance
        const isAtTop = scrollTop <= 1;
        const isAtBottom = scrollHeight - clientHeight - scrollTop <= 1;

        const scrollingDown = e.deltaY > 0;
        const scrollingUp = e.deltaY < 0;

        // If at top and scrolling up, allow page scroll
        if (isAtTop && scrollingUp) {
          scrollVelocity = 0;
          return;
        }

        // If at bottom and scrolling down, allow page scroll
        if (isAtBottom && scrollingDown) {
          scrollVelocity = 0;
          return;
        }

        // Check if scrolling would exceed boundaries
        const wouldExceedBottom = scrollingDown && (scrollTop + e.deltaY >= scrollHeight - clientHeight);
        const wouldExceedTop = scrollingUp && (scrollTop + e.deltaY <= 0);

        // If scrolling would exceed boundaries, allow page scroll
        if (wouldExceedBottom && scrollingDown) {
          scrollVelocity = 0;
          return;
        }
        if (wouldExceedTop && scrollingUp) {
          scrollVelocity = 0;
          return;
        }

        // Prevent default and accumulate velocity for smooth scrolling
        e.preventDefault();

        // Accumulate scroll velocity with smoothing factor
        scrollVelocity += e.deltaY * 0.5;

        // Clamp velocity for smoother feel
        scrollVelocity = Math.max(-50, Math.min(50, scrollVelocity));

        // Start smooth scroll animation if not already running
        if (!isScrolling) {
          isScrolling = true;
          animationFrameId = requestAnimationFrame(smoothScroll);
        }
      }
    };

    // Add event listener to window for capturing all scroll events
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <>
      {/* Gallery - Scrollable without visible scrollbar with smooth scrolling */}
      <div
        ref={galleryRef}
        className="space-y-4 overflow-y-auto max-h-[calc(100vh-8rem)] hide-scrollbar scroll-smooth"
        style={{ scrollBehavior: 'auto' }}
      >
        {/* First Image - Full Width */}
        {firstImage && (
          <div
            className="aspect-square bg-gray-50 rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => openFullscreen(firstImage)}
          >
            <div className="relative w-full h-full">
              <Image
                src={firstImage}
                alt={`${product.name} - View 1`}
                fill
                className="object-contain group-hover:scale-105 transition-transform duration-300"
                sizes="(min-width: 1024px) 50vw, 100vw"
                quality={90}
                priority
              />
            </div>
          </div>
        )}

        {/* Remaining Images - Two Column Grid */}
        {remainingImages.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {remainingImages.map((imageUrl, index) => (
              <div
                key={`gallery-${index + 1}-${imageUrl}`}
                className="aspect-square bg-gray-50 rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => openFullscreen(imageUrl)}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={imageUrl}
                    alt={`${product.name} - View ${index + 2}`}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-300"
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    quality={90}
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[150] bg-white overflow-hidden flex flex-col"
          onClick={closeFullscreen}
        >
          {/* Close Button */}
          <button
            onClick={closeFullscreen}
            className="fixed top-24 right-4 md:top-28 z-[151] p-2 text-black hover:text-gray-700 transition-colors"
            aria-label="Close fullscreen"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation Buttons */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="fixed left-4 top-1/2 -translate-y-1/2 z-[151] p-2 text-black hover:text-gray-700 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="fixed right-4 top-1/2 -translate-y-1/2 z-[151] p-2 text-black hover:text-gray-700 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Fullscreen Image Container */}
          <div
            className="flex-1 flex items-center justify-center p-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={allImages[currentImageIndex] || ''}
                alt={`${product.name} - Image ${currentImageIndex + 1}`}
                width={1920}
                height={1080}
                className="w-full h-full object-contain"
                sizes="100vw"
                quality={100}
                priority
              />
            </div>
          </div>

          {/* Thumbnail Preview Strip */}
          {allImages.length > 1 && (
            <div
              className="w-full bg-gray-50/80 py-4 px-4 overflow-x-auto border-t border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-end justify-center gap-4 max-w-7xl mx-auto">
                {allImages.map((imageUrl, index) => (
                  <button
                    key={`thumb-preview-${index}-${imageUrl}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className="relative flex-shrink-0 flex flex-col items-center transition-all pb-1"
                  >
                    <div className={`
                      relative w-20 h-20 rounded overflow-hidden transition-all border-2
                      ${currentImageIndex === index
                        ? 'border-gray-300'
                        : 'border-transparent opacity-60 hover:opacity-100'
                      }
                    `}>
                      <Image
                        src={imageUrl}
                        alt={`${product.name} - Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                        quality={75}
                      />
                    </div>
                    {/* Active Indicator */}
                    {currentImageIndex === index && (
                      <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-black" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
