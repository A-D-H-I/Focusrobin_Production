"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function GiftCategoriesSection() {
  const [offsetY, setOffsetY] = useState(0);

  const handleScroll = () => {
    setOffsetY(window.pageYOffset);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="grid grid-cols-3 min-h-[600px]">
      {/* SHOP FOR MEN */}
      <Link 
        href="/shop" 
        className="relative group overflow-hidden cursor-pointer"
        aria-label="Shop for men"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 -top-[25%] -bottom-[25%]"
            style={{ transform: `translateY(${-offsetY * 0.10+50}px)` }}
          >
            <Image
              src="/heroimage/hero1.jpg"
              alt="Shop for men"
              fill
              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
            />
          </div>
        </div>
        <div className="absolute bottom-8 left-0 right-0 text-center z-10">
          <h3 className="text-white font-headline text-2xl font-bold uppercase tracking-wider drop-shadow-lg">
            SHOP FOR MEN
          </h3>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 z-10" />
      </Link>

      {/* SHOP FOR WOMEN */}
      <Link 
        href="/shop" 
        className="relative group overflow-hidden cursor-pointer"
        aria-label="Shop for women"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 -top-[25%] -bottom-[25%]"
            style={{ transform: `translateY(${-offsetY * 0.10+50}px)` }}
          >
            <Image
              src="/heroimage/heroimage.jpg"
              alt="Shop for women"
              fill
              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
            />
          </div>
        </div>
        <div className="absolute bottom-8 left-0 right-0 text-center z-10">
          <h3 className="text-white font-headline text-2xl font-bold uppercase tracking-wider drop-shadow-lg">
            SHOP FOR WOMEN
          </h3>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 z-10" />
      </Link>

      {/* SHOP FOR KIDS */}
      <Link 
        href="/shop" 
        className="relative group overflow-hidden cursor-pointer"
        aria-label="Shop for kids"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 -top-[25%] -bottom-[25%]"
            style={{ transform: `translateY(${-offsetY * 0.10+50}px)` }}
          >
            <Image
              src="/heroimage/hero1.jpg"
              alt="Shop for kids"
              fill
              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
            />
          </div>
        </div>
        <div className="absolute bottom-8 left-0 right-0 text-center z-10">
          <h3 className="text-white font-headline text-2xl font-bold uppercase tracking-wider drop-shadow-lg">
            SHOP FOR KIDS
          </h3>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 z-10" />
      </Link>
    </section>
  );
}

