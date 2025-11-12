"use client";

import { useState, useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";

const lensLayers = [
  { name: "Anti-Scratch Coating", style: { color: "rgba(128, 128, 255, 0.7)" } },
  { name: "UV 400 Protection", style: { color: "rgba(255, 128, 128, 0.7)" } },
  { name: "Polarization Filter", style: { color: "rgba(128, 255, 128, 0.7)" } },
  { name: "High-Clarity Lens", style: { color: "rgba(200, 200, 200, 0.7)" } },
  { name: "Anti-Reflective Coating", style: { color: "rgba(255, 255, 128, 0.7)" } },
];

export default function LensFeatureSection() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.2,
  });

  const handleScroll = () => {
    if (!sectionRef.current) return;
    const { top, height } = sectionRef.current.getBoundingClientRect();
    const progress = Math.min(Math.max(-(top - window.innerHeight / 2) / (height / 1.5), 0), 1);
    setScrollProgress(progress);
  };

  useEffect(() => {
    if (inView) {
      window.addEventListener("scroll", handleScroll);
      handleScroll();
    } else {
      window.removeEventListener("scroll", handleScroll);
    }
    return () => window.removeEventListener("scroll", handleScroll);
  }, [inView]);

  return (
    <section ref={inViewRef} className="py-20 md:py-32 bg-background">
      <div ref={sectionRef} className="container mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
        <div className="text-center md:text-left">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold mb-6">
            Uncompromising Clarity
          </h2>
          <p className="text-lg text-foreground/80 max-w-lg mx-auto md:mx-0">
            Our lenses are engineered with multiple layers of cutting-edge technology to protect your eyes and enhance your world. Experience vision without compromise.
          </p>
        </div>
        
        <div className="relative h-80 w-full flex items-center justify-center">
          {lensLayers.map((layer, index) => {
            const center = Math.floor(lensLayers.length / 2);
            const displacement = (index - center) * 60;
            const y = displacement * scrollProgress;
            const opacity = 1 - (Math.abs(index-center) * 0.1 * (1 - scrollProgress));

            return (
              <div
                key={layer.name}
                className="absolute w-full h-full transition-transform duration-200 ease-out"
                style={{ transform: `translateY(${y}px)` }}
              >
                <div
                  className={cn(
                    "w-full h-full rounded-3xl border-2 flex items-center justify-center transition-opacity",
                    scrollProgress > 0.5 ? 'border-primary' : 'border-border'
                  )}
                  style={{
                    backgroundColor: layer.style.color,
                    opacity: opacity,
                  }}
                >
                  <span className={cn(
                    "text-foreground font-semibold transition-opacity duration-500",
                     scrollProgress > 0.8 ? 'opacity-100' : 'opacity-0'
                  )}>
                    {layer.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
