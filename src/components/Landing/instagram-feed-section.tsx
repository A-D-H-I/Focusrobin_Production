"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { normalizeImageUrl } from "@/lib/normalize-image-url";

interface InstagramImageData {
  id: string;
  imageUrl: string;
  alt: string;
  link: string;
}

interface InstagramFeedSectionProps {
  instagramImages: InstagramImageData[];
}

function CommunityImage({ item, index }: { item: InstagramImageData, index: number }) {
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
        <div className="relative aspect-[3/4] w-full h-full overflow-hidden">
          <Image
            src={normalizeImageUrl(item.imageUrl)}
            alt={item.alt}
            fill
            className="object-cover transform transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        </div>
      </a>
    </div>
  );
}

// Helper function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function InstagramFeedSection({ instagramImages }: InstagramFeedSectionProps) {
  const [displayImages, setDisplayImages] = useState<InstagramImageData[]>([]);

  useEffect(() => {
    if (instagramImages.length === 0) {
      setDisplayImages([]);
      return;
    }

    // Create 8 images by repeating and shuffling (2 rows x 4 columns)
    const shuffled = shuffleArray(instagramImages);
    const repeatedImages: InstagramImageData[] = [];
    for (let i = 0; i < 8; i++) {
      repeatedImages.push(shuffled[i % shuffled.length]);
    }
    const finalShuffled = shuffleArray(repeatedImages);
    setDisplayImages(finalShuffled);
  }, [instagramImages]);

  if (displayImages.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-background overflow-hidden"> 
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
          {/* Left Panel - Text Section */}
          <div className="bg-black text-white flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12 lg:py-0">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold mb-6 lg:mb-8">
              Community Lookbook
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/90 leading-relaxed max-w-md">
              Shop and share your favorite looks. Use the hashtag <span className="font-semibold">#FocusRobin</span> for a chance to be featured here.
            </p>
          </div>

          {/* Right Panel - Image Grid */}
          <div className="grid grid-cols-4 grid-rows-2 w-full h-full">
            {displayImages.map((item, index) => (
              <CommunityImage key={`${item.id}-${index}`} item={item} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}