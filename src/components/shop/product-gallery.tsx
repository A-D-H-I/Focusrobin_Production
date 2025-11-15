
"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";
import type { Product, ProductColorVariant } from "@/lib/productData";

type ProductGalleryProps = {
  product: Product;
  selectedVariant: ProductColorVariant;
};

export default function ProductGallery({ product, selectedVariant }: ProductGalleryProps) {
  // Get images for the selected color variant
  const galleryImages = selectedVariant.images.length > 0 
    ? selectedVariant.images 
    : [selectedVariant.tilted].filter(Boolean);
  
  // Use thumbnail as first image if available, otherwise use first gallery image
  const initialImage = selectedVariant.thumbnail || galleryImages[0] || '';
  const [mainImage, setMainImage] = useState(initialImage);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  
  // Update main image when variant changes
  useEffect(() => {
    const newImage = selectedVariant.thumbnail || galleryImages[0] || '';
    setMainImage(newImage);
  }, [selectedVariant.thumbnail, galleryImages]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setZoomPosition({ x, y });
  };

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnail Gallery */}
      <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
        {galleryImages.map((imageUrl, index) => (
          <div
            key={`thumb-${index}`}
            className={cn(
              "relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
              mainImage === imageUrl ? "border-primary" : "border-transparent hover:border-border"
            )}
            onClick={() => setMainImage(imageUrl)}
          >
            <Image
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
      
      {/* Main Image with Zoom */}
      <div 
        className="flex-1 relative aspect-square rounded-lg overflow-hidden shadow-lg cursor-zoom-in"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <div className="relative w-full h-full overflow-hidden">
          <div 
            className={cn(
              "relative w-full h-full transition-transform duration-300 ease-out",
              isZoomed ? "scale-150" : "scale-100"
            )}
            style={{
              transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
            }}
          >
            <Image
              src={mainImage}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              quality={90}
            />
          </div>
        </div>
        <Button variant="outline" className="absolute top-4 right-4 bg-background/80 hover:bg-background z-10">
          <Camera className="mr-2 h-4 w-4" />
          Virtual Try-On
        </Button>
      </div>
    </div>
  );
}

