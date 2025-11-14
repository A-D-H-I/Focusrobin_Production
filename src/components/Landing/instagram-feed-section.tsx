"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useInView } from "react-intersection-observer";
import { allInstagramImages, shuffleArray } from "@/lib/instagramData";
import { cn } from "@/lib/utils";

function InstagramImage({ item, index }: { item: { id: number; src: string; alt: string; link: string }, index: number }) {
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
      <div className="relative group overflow-hidden rounded-lg shadow-lg aspect-square">
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src={item.src}
            alt={item.alt}
            fill
            className="object-cover transform transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white text-lg font-bold">@focusrobin</p>
          </div>
        </a>
      </div>
    </div>
  );
}

export default function InstagramFeedSection() {
  const [shuffledImages, setShuffledImages] = useState<Array<{ id: number; src: string; alt: string; link: string }>>([]);

  useEffect(() => {
    // Create 9 images by repeating and shuffling
    const shuffled = shuffleArray(allInstagramImages);
    const repeatedImages = [];
    for (let i = 0; i < 9; i++) {
      repeatedImages.push(shuffled[i % shuffled.length]);
    }
    const finalShuffled = shuffleArray(repeatedImages).map((img, index) => ({
      id: index + 1,
      src: img.src,
      alt: `${img.alt} ${index + 1}`,
      link: 'https://www.instagram.com/p/DQwrNF9ikKg/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==',
    }));
    setShuffledImages(finalShuffled);
  }, []);

  return (
    <section className="py-16 sm:py-24 bg-secondary"> 
      <div className="container mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-headline font-bold text-center mb-12">
          Seen on You
        </h2>
        
        <div className="grid grid-cols-3 gap-4">
          {shuffledImages.map((item, index) => (
            <InstagramImage key={item.id} item={item} index={index} />
          ))}
        </div>
        
      </div>
    </section>
  );
}