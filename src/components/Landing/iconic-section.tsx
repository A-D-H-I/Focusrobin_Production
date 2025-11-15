"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function IconicSection() {
  const [offsetY, setOffsetY] = useState(0);
  
  // Use the iconic image
  const backgroundImage = "/Iconic/iconicimage3.png";

  useEffect(() => {
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
    <section className="relative py-16 sm:py-24 overflow-hidden min-h-[600px] flex items-center">
      {/* Background Image with Parallax from Below */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ transform: `translateY(${-offsetY * 0.10+50}px)` }}
        >
          
          <Image
            src={backgroundImage}
            alt="FocusRobin background"
            fill
            className="object-contain"
            priority
            sizes="100vw"
          />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-2xl">
          {/* Text and Buttons */}
          <div className="flex flex-col justify-center text-center lg:text-left">
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-headline font-bold text-white mb-12 leading-[1.1] tracking-tight">
              GIVE SOMETHING ICONIC
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/shop" prefetch={true}>
                <Button size="lg" className="rounded-full px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg">
                  SHOP SUNGLASSES
                </Button>
              </Link>
              <Link href="/shop" prefetch={true}>
                <Button size="lg" className="rounded-full px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg">
                  Virtual Try-On
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

