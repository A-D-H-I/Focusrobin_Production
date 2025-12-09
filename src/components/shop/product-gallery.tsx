
"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Camera, X, ChevronLeft, ChevronRight, Box } from "lucide-react";
import type { Product, ProductColorVariant } from "@/lib/productData";
import Product3DViewer from "./product-3d-viewer";
import VirtualTryOn from "./virtual-tryon";

type ProductGalleryProps = {
  product: Product;
  selectedVariant: ProductColorVariant;
};

export default function ProductGallery({ product, selectedVariant }: ProductGalleryProps) {
  // Get images for the selected color variant from database
  // The images array contains all GALLERY type assets from the database
  const galleryImages = selectedVariant.images || [];
  const thumbnail = selectedVariant.thumbnail || '';
  
  // Create a deduplicated list of all images from database
  // Ensure we have images to display - use galleryImages first, fallback to thumbnail
  // Use selectedVariant.sku as key to force recalculation when variant changes
  const allImages = React.useMemo(() => {
    // Force recalculation by including variant identifier
    const variantKey = `${selectedVariant.sku}-${selectedVariant.hex}`;
    
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
  
  // Initialize state with first image from database
  const [mainImage, setMainImage] = useState(() => allImages[0] || '');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [is3DViewerOpen, setIs3DViewerOpen] = useState(false);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  
  // Use the same 3D model for all products
  const model3DUrl = `/sunglasses3D.glb`;
  
  // Update main image when variant or images change (data from database)
  useEffect(() => {
    if (allImages.length > 0) {
      const firstImage = allImages[0];
      setMainImage(firstImage);
      setCurrentImageIndex(0);
    } else if (thumbnail && thumbnail.trim()) {
      // Fallback if allImages is empty but we have a thumbnail
      setMainImage(thumbnail);
      setCurrentImageIndex(0);
    } else {
      // If no images at all, clear the main image
      setMainImage('');
      setCurrentImageIndex(0);
    }
  }, [allImages, thumbnail, selectedVariant.hex, selectedVariant.sku, selectedVariant.name]);

  // Handle thumbnail click
  const handleThumbnailClick = (imageUrl: string, index: number) => {
    setMainImage(imageUrl);
    // Find the index in allImages array
    const allImagesIndex = allImages.findIndex(img => img === imageUrl);
    if (allImagesIndex !== -1) {
      setCurrentImageIndex(allImagesIndex);
    }
  };

  // Handle opening fullscreen
  const openFullscreen = (imageUrl: string) => {
    const index = allImages.findIndex(img => img === imageUrl);
    if (index !== -1) {
      setCurrentImageIndex(index);
    } else {
      // If image not found, use current mainImage index
      const currentIndex = allImages.findIndex(img => img === mainImage);
      if (currentIndex !== -1) {
        setCurrentImageIndex(currentIndex);
      }
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
      <div className="flex flex-col-reverse md:flex-row gap-4">
        {/* Thumbnail Gallery */}
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
          {allImages.map((imageUrl, index) => (
            <div
              key={`thumb-${index}-${imageUrl}`}
              className={cn(
                "relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
                mainImage === imageUrl ? "border-primary" : "border-transparent hover:border-border"
              )}
              onClick={() => handleThumbnailClick(imageUrl, index)}
              onDoubleClick={() => openFullscreen(imageUrl)}
            >
              <Image
                key={`${selectedVariant.hex}-${selectedVariant.sku}-thumb-${index}-${imageUrl}`}
                src={imageUrl}
                alt={`${product.name} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 80px, 96px"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
        
        {/* Main Image Container */}
        <div className="flex-1">
          <div 
            className="relative aspect-square rounded-lg overflow-hidden shadow-lg cursor-pointer bg-muted"
            onClick={() => mainImage && openFullscreen(mainImage)}
          >
            {mainImage ? (
              <div className="relative w-full h-full">
                <Image
                  key={`${selectedVariant.hex}-${selectedVariant.sku}-${mainImage}`}
                  src={mainImage}
                  alt={product.name}
                  fill
                  priority
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  quality={90}
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <span>No image available</span>
              </div>
            )}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <Button 
                variant="outline" 
                className="bg-background/80 hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTryOnOpen(true);
                }}
              >
                <Camera className="mr-2 h-4 w-4" />
                Virtual Try-On
              </Button>
              <Button 
                variant="outline" 
                className="bg-background/80 hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  setIs3DViewerOpen(true);
                }}
              >
                <Box className="mr-2 h-4 w-4" />
                3D View
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[150] bg-black/95 overflow-y-auto"
          onClick={closeFullscreen}
        >
          {/* Close Button - Positioned below navbar */}
          <button
            onClick={closeFullscreen}
            className="fixed top-24 right-4 md:top-28 z-[151] p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
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
                className="fixed left-4 top-1/2 -translate-y-1/2 z-[151] p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="fixed right-4 top-1/2 -translate-y-1/2 z-[151] p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Fullscreen Image Container - Scrollable */}
          <div 
            className="min-h-screen flex items-center justify-center py-24 px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-7xl">
              <Image
                src={allImages[currentImageIndex] || ''}
                alt={`${product.name} - Image ${currentImageIndex + 1}`}
                width={1920}
                height={1080}
                className="w-full h-auto object-contain"
                sizes="100vw"
                quality={100}
                priority
                unoptimized
              />
            </div>
          </div>

          {/* Image Counter */}
          {allImages.length > 1 && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[151] px-4 py-2 rounded-full bg-white/10 text-white text-sm backdrop-blur-sm">
              {currentImageIndex + 1} / {allImages.length}
            </div>
          )}
        </div>
      )}

      {/* 3D Model Viewer */}
      <Product3DViewer
        modelUrl={model3DUrl}
        productName={product.name}
        isOpen={is3DViewerOpen}
        onClose={() => setIs3DViewerOpen(false)}
      />

      {/* Virtual Try-On */}
      <VirtualTryOn
        product={product}
        variants={product.variants}
        selectedVariantIndex={product.variants.findIndex(v => v.hex === selectedVariant.hex && v.name === selectedVariant.name)}
        productName={product.name}
        isOpen={isTryOnOpen}
        onClose={() => setIsTryOnOpen(false)}
      />
    </>
  );
}

