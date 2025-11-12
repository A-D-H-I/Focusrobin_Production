"use client";

import Image from "next/image";
import { useInView } from "react-intersection-observer";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

const instagramImages = PlaceHolderImages.filter(p => p.id.startsWith("ig-"));

function MasonryImage({ image, index }: { image: typeof instagramImages[0], index: number }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div
      ref={ref}
      className={cn(
        "mb-4 break-inside-avoid transition-all duration-700 ease-in-out",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="relative group overflow-hidden rounded-lg shadow-lg">
        <Image
          src={image.imageUrl}
          alt={image.description}
          width={500}
          height={Math.random() > 0.5 ? 700 : 500}
          className="w-full h-auto object-cover transform transition-transform duration-300 group-hover:scale-105"
          data-ai-hint={image.imageHint}
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <p className="text-white text-lg font-bold">@focusrobin</p>
        </div>
      </div>
    </div>
  );
}

export default function InstagramFeedSection() {
  return (
    <section className="bg-secondary py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-headline font-bold text-center mb-12">
          Seen on You
        </h2>
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
          {instagramImages.map((image, index) => (
            <MasonryImage key={image.id} image={image} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
