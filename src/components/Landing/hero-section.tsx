"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { homePageData } from "@/lib/homePageData";
import { cn } from "@/lib/utils";

export default function HeroSection() {
  const [offsetY, setOffsetY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setOffsetY(window.pageYOffset);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative h-screen overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{ transform: `translateY(${offsetY * 0.5}px)` }}
      >
        <Image
          src={homePageData.hero.image.src}
          alt={homePageData.hero.image.alt}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="relative z-10 flex h-full items-center justify-center text-center text-white px-4">
        <div
           className={cn(
            "transform transition-all duration-1000 ease-out w-full max-w-4xl",
            isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-headline font-bold mb-4 drop-shadow-md break-words px-2">
                {homePageData.hero.title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 drop-shadow break-words px-2">
                {homePageData.hero.subtitle}
            </p>
            <Link href={homePageData.hero.cta.link}>
              <Button size="lg" className="rounded-full px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg">
                  {homePageData.hero.cta.text}
              </Button>
            </Link>
        </div>
      </div>
    </section>
  );
}
