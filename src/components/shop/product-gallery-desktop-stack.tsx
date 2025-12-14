"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Product, ProductColorVariant } from "@/lib/productData";

type ProductGalleryDesktopStackProps = {
  product: Product;
  selectedVariant: ProductColorVariant;
};

export default function ProductGalleryDesktopStack({ product, selectedVariant }: ProductGalleryDesktopStackProps) {
  // Get images for the selected color variant from database
  const galleryImages = selectedVariant.images || [];
  const thumbnail = selectedVariant.thumbnail || '';
  
  // Create a deduplicated list of all images from database
  const allImages = React.useMemo(() => {
    if (galleryImages.length > 0) {
      // Remove duplicates while preserving order
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
      // Fallback to thumbnail if no gallery images
      return [thumbnail];
    }
    return [];
  }, [thumbnail, galleryImages, selectedVariant.hex, selectedVariant.sku, selectedVariant.name]);

  if (allImages.length === 0) {
    return (
      <div className="w-full flex items-center justify-center text-muted-foreground py-24">
        <span>No images available</span>
      </div>
    );
  }

  const firstImage = allImages[0];
  const remainingImages = allImages.slice(1);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Handle opening fullscreen
  const openFullscreen = (imageUrl: string) => {
    const index = allImages.findIndex(img => img === imageUrl);
    if (index !== -1) {
      setCurrentImageIndex(index);
    }
    setIsFullscreen(true);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  // Handle closing fullscreen
  const closeFullscreen = () => {
    setIsFullscreen(false);
    document.body.style.overflow = 'unset';
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
      } else if (e.key === 'ArrowLeft') {
        setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, allImages.length]);

  return (
    <>
      <div className="space-y-3 lg:space-y-4">
        {/* First Image - Full Width */}
        {firstImage && (
          <div
            key={`desktop-stack-0-${firstImage}`}
            className="relative w-full rounded-xl lg:rounded-2xl overflow-hidden bg-[#EFFAFA] cursor-pointer"
            onClick={() => openFullscreen(firstImage)}
          >
            <div className="relative w-full aspect-square">
              <Image
                src={firstImage}
                alt={`${product.name} - View 1`}
                fill
                className="object-contain"
                sizes="(min-width: 1024px) 58vw, 100vw"
                quality={90}
                loading="eager"
                unoptimized
              />
            </div>
          </div>
        )}

        {/* Remaining Images - Two per Row */}
        {remainingImages.length > 0 && (
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            {remainingImages.map((imageUrl, index) => {
              // Calculate the actual index in allImages array
              const actualIndex = index + 1;
              return (
                <div
                  key={`desktop-stack-${actualIndex}-${imageUrl}`}
                  className="relative w-full rounded-xl lg:rounded-2xl overflow-hidden bg-[#EFFAFA] cursor-pointer"
                  onClick={() => openFullscreen(imageUrl)}
                >
                  <div className="relative w-full aspect-square">
                    <Image
                      src={imageUrl}
                      alt={`${product.name} - View ${actualIndex + 1}`}
                      fill
                      className="object-contain"
                      sizes="(min-width: 1024px) 29vw, 100vw"
                      quality={90}
                      loading="lazy"
                      unoptimized
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[150] bg-white overflow-hidden flex flex-col"
          onClick={closeFullscreen}
        >
          {/* Close Button - Positioned below navbar */}
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

          {/* Fullscreen Image Container - No Scroll */}
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
                unoptimized
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
                        unoptimized
                      />
                    </div>
                    {/* Active Indicator - Black line underneath */}
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

