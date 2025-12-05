"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { normalizeImageUrl } from "@/lib/normalize-image-url";
import { Instagram } from "lucide-react";

interface InstagramImageData {
  id: string;
  imageUrl: string;
  alt: string;
  link: string;
}

interface InstagramFeedSectionProps {
  instagramImages: InstagramImageData[];
}

function CommunityImage({ 
  item, 
  index
}: { 
  item: InstagramImageData; 
  index: number;
}) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-in-out", 
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative group overflow-hidden w-full h-full"
      >
        <div className="relative w-full h-full overflow-hidden aspect-square rounded-lg">
          <Image
            src={normalizeImageUrl(item.imageUrl)}
            alt={item.alt}
            fill
            className="object-cover transform transition-transform duration-300 group-hover:scale-105"
            unoptimized
            sizes="(max-width: 768px) 20vw, 20vw"
          />
        </div>
      </a>
    </div>
  );
}

export default function InstagramFeedSection({ instagramImages }: InstagramFeedSectionProps) {
  if (instagramImages.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-[#E0F2F1] overflow-hidden py-12 md:py-16"> 
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        {/* Header Section - Centered */}
        <div className="flex flex-col items-center mb-8 md:mb-12">
          {/* Instagram Camera Logo Outline */}
          <div className="mb-4">
            <svg 
              width="40" 
              height="40" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-gray-800"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </div>
          
          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 text-center">
            Follow Us on Instagram
          </h2>
          
          {/* Tagline */}
          <p className="text-base md:text-lg text-gray-600 text-center">
            @focusrobin • Join our community and share your style
          </p>
        </div>

        {/* Image Grid Section - Horizontally Scrollable */}
        <div className="w-full mb-8 md:mb-12 -mx-4 md:-mx-6">
          <div 
            className="overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory w-full"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x',
            }}
          >
            <div className="flex gap-3 md:gap-4 min-w-max pb-2 px-4 md:px-6">
              {instagramImages.map((item, index) => (
                <div 
                  key={item.id} 
                  className="flex-shrink-0 w-[200px] md:w-[250px] snap-start"
                >
                  <CommunityImage item={item} index={index} />
                </div>
              ))}
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
        </div>

        {/* Call to Action Button - Gradient */}
        <div className="flex justify-center">
          <a
            href="https://www.instagram.com/focus.robin"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-semibold text-base md:text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Instagram className="w-5 h-5 md:w-6 md:h-6" />
            <span>Follow @focusrobin</span>
          </a>
        </div>
      </div>
    </section>
  );
}