"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { normalizeImageUrl } from "@/lib/normalize-image-url";

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

  if (categoryImages.length === 0) {
    return null;
  }

  // Get images for each category
  const menImage = categoryImages.find(img => img.category === 'MEN');
  const womenImage = categoryImages.find(img => img.category === 'WOMEN');
  const kidsImage = categoryImages.find(img => img.category === 'KIDS');

  const categories = [
    { image: menImage, category: 'MEN' },
    { image: womenImage, category: 'WOMEN' },
    { image: kidsImage, category: 'KIDS' },
  ].filter(item => item.image);

  if (categories.length === 0) {
    return null;
  }

  return (
    <section 
      ref={sectionRef}
      className="grid grid-cols-1 md:grid-cols-3 min-h-[600px] overflow-hidden"
    >
      {categories.map(({ image, category }) => {
        if (!image) return null;
        
        return (
          <Link 
            key={image.id}
            href={categoryRoutes[category] || '/shop'} 
            prefetch={true}
            className="relative group overflow-hidden cursor-pointer min-h-[300px] md:min-h-0"
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
    </section>
  );
}

