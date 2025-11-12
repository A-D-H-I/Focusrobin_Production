"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "./ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

const heroImage = PlaceHolderImages.find(p => p.id === "hero-1")!;

export default function HeroSection() {
  const [offsetY, setOffsetY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  const handleScroll = () => {
    setOffsetY(window.pageYOffset);
  };

  useEffect(() => {
    setIsMounted(true);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative h-screen overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{ transform: `translateY(${offsetY * 0.5}px)` }}
      >
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          fill
          className="object-cover"
          priority
          data-ai-hint={heroImage.imageHint}
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="relative z-10 flex h-full items-center justify-center text-center text-white">
        <div
           className={cn(
            "transform transition-all duration-1000 ease-out",
            isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 drop-shadow-md">
                Elevate Your Style,<br /> Enhance Your Vision
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 drop-shadow">
                Discover our new collection of premium eyewear designed for the modern individual.
            </p>
            <Button size="lg" className="rounded-full px-8 py-6 text-lg">
                Shop Now
            </Button>
        </div>
      </div>
    </section>
  );
}
