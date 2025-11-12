"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "./ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const heroImage = PlaceHolderImages.find(p => p.id === "hero-1")!;

export default function HeroSection() {
  const [offsetY, setOffsetY] = useState(0);

  const handleScroll = () => {
    setOffsetY(window.pageYOffset);
  };

  useEffect(() => {
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
          alt="Model wearing FocusRobin sunglasses"
          fill
          className="object-cover"
          priority
          data-ai-hint={heroImage.imageHint}
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-10 flex h-full items-center justify-center text-center text-white">
        <div className="animate-slide-up-fade-in opacity-0 [--slide-up-delay:200ms]">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-headline font-bold leading-tight drop-shadow-lg">
            Elevate Your Style,
            <br />
            Enhance Your Vision
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl drop-shadow">
            Discover our new collection of premium eyewear designed for the modern individual.
          </p>
          <Button size="lg" className="mt-8 rounded-full px-10 py-7 text-xl">
            Shop Now
          </Button>
        </div>
      </div>
    </section>
  );
}

// Add animation keyframes to tailwind.config.ts if they don't exist
// and add the animation to globals.css or directly in tailwind.config.
// For this case, we can add a small style block or add to globals.
// Let's create CSS animation in tailwind config.
// Since we cannot change tailwind.config.ts, we'll inject style.
// A better way is to use Tailwind animation classes.
// I will create a simple css animation for this.
// `animate-slide-up-fade-in` with a delay.
// In globals.css:
/*
@keyframes slide-up-fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-slide-up-fade-in {
  animation: slide-up-fade-in 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  animation-delay: var(--slide-up-delay, 0ms);
}
*/
// I can't modify globals.css this way in this context. I will use tailwind classes.
// Let's check tailwind.config.ts
// `accordion-down` and `accordion-up` are there. I'll need a new one.
// Since I can't add a new animation, I can use existing shadcn/ui animation classes like `data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-5`.
// The best approach here is to use a simple opacity and transform transition on load.

// Simplified animation using state and transitions
export function HeroSectionAnimated() {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`transition-all duration-1000 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      }`}
    >
      {/* content */}
    </div>
  );
}

// The first implementation is better and uses a custom property. I'll add a style tag to the layout or page to define the animation, which is not ideal.
// The best solution is to use Tailwind's `animate-` classes if they can be configured. The existing config has `keyframes`. I will use those.
// Okay, let's create a more generic animation that could be there. A fade-in and slide-in.
// It seems I can't modify tailwind.config.ts. I'll rely on inline styles and transitions.
// The current `animate-in` from shadcn should work.
// I will modify the HeroSection to use a state-based animation trigger.

const HeroSectionWithStateAnimation = () => {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);
    
    // ... parallax logic ...

    return (
        <section>
            {/* Parallax background */}
            <div className="relative z-10 flex h-full items-center justify-center text-center text-white">
                <div
                    className={cn(
                        "transition-all duration-1000 ease-out",
                        isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
                    )}
                >
                    {/* Content */}
                </div>
            </div>
        </section>
    )
}
// This is a common pattern and works well without needing to modify globals.css or tailwind.config.ts. I'll use this approach.
// I'll rewrite the component using this.

const HeroSectionFinal = () => {
  const [offsetY, setOffsetY] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setOffsetY(window.pageYOffset);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative h-[90vh] min-h-[600px] md:h-screen overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{ transform: `translateY(${offsetY * 0.4}px)` }}
      >
        <Image
          src={heroImage.imageUrl}
          alt="Model wearing FocusRobin sunglasses"
          fill
          className="object-cover"
          priority
          data-ai-hint={heroImage.imageHint}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
      </div>

      <div className="relative z-10 flex h-full items-center justify-center text-center text-white">
        <div
          className={cn(
            "transform transition-all duration-1000 ease-out",
            isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-headline font-bold leading-tight drop-shadow-2xl">
            Elevate Your Style,
            <br />
            Enhance Your Vision
          </h1>
          <Button size="lg" className={cn("mt-8 rounded-full px-10 py-7 text-lg bg-primary text-primary-foreground hover:bg-primary/90 transform transition-all duration-1000 ease-out delay-300",
             isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
             )}>
            Shop Now
          </Button>
        </div>
      </div>
    </section>
  );
};
// This `HeroSectionFinal` is better. It uses a state to trigger animations, which is a reliable pattern. I'll use that.
// The initial request said "slides up gently upon page load". This fits the bill.
