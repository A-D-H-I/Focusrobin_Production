"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { normalizeImageUrl } from "@/lib/normalize-image-url";
import TranslatableText from "@/components/ui/TranslatableText";

interface ShapeProduct {
  shape: string;
  productId: string;
  productSlug: string;
  imageUrl: string;
}

interface ShopByShapesProps {
  shapes: ShapeProduct[];
}

// Shape descriptions mapping - these will be translated
const getShapeDescription = (shape: string): string => {
  const descriptions: Record<string, string> = {
    "Cat Eye": "Bold & vintage-inspired",
    "Cateye": "Bold & vintage-inspired",
    "Aviator": "Classic & timeless",
    "Wayfarer": "Iconic & versatile",
    "Round": "Retro & sophisticated",
    "Rectangle": "Modern & sleek",
    "Square": "Bold & contemporary",
    "Oval": "Elegant & refined",
    "Clubmaster": "Sophisticated & stylish",
  };
  return descriptions[shape] || "Stylish & unique";
};

// Mark popular shapes
const popularShapes = ["Cat Eye", "Cateye", "Aviator", "Wayfarer"];

export default function ShopByShapes({ shapes }: ShopByShapesProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Group shapes by name to get unique shapes
  const uniqueShapes = Array.from(
    new Map(shapes.map((item) => [item.shape, item])).values()
  );

  const scrollContainer = (direction: "left" | "right") => {
    const container = document.getElementById("shapes-container");
    if (container) {
      const scrollAmount = 400;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-8 md:py-12 bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-10"
        >
          <h2 className="text-brand-h2 font-headline mb-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
            <TranslatableText text="Shop By Shapes" />
          </h2>

          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            <TranslatableText text="Discover eyewear that complements your face shape and personal style" />
          </p>
        </motion.div>

        {/* Horizontal Scroll Container */}
        <div className="relative">
          {/* Left Arrow */}
          <button
            onClick={() => scrollContainer("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-xl hover:bg-white hover:scale-110 transition-all duration-300 hidden md:block"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 text-slate-900" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => scrollContainer("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-xl hover:bg-white hover:scale-110 transition-all duration-300 hidden md:block"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 text-slate-900" />
          </button>

          {/* Scrollable Row */}
          <div
            id="shapes-container"
            className="flex gap-6 overflow-x-auto scrollbar-hide px-2 md:px-12 py-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {uniqueShapes.map((shapeItem, index) => {
              const isPopular = popularShapes.includes(shapeItem.shape);
              const description = getShapeDescription(shapeItem.shape);

              return (
                <motion.div
                  key={shapeItem.shape}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onHoverStart={() => setHoveredId(shapeItem.shape)}
                  onHoverEnd={() => setHoveredId(null)}
                  className="group relative flex-shrink-0 w-[300px] md:w-[350px] h-full"
                >
                  <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 h-full flex flex-col">
                    {/* Popular Badge */}
                    {isPopular && (
                      <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-teal-primary to-[#4DCECA] text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        <TranslatableText text="Popular" />
                      </div>
                    )}

                    {/* Image Container */}
                    <Link
                      href={`/shop?glassShape=${encodeURIComponent(
                        shapeItem.shape.toLowerCase().replace(/\s+/g, "-")
                      )}`}
                    >
                      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                        {shapeItem.imageUrl ? (
                          <>
                            <motion.div
                              className="relative w-full h-full overflow-hidden flex items-center justify-center bg-slate-50"
                              animate={{
                                scale: 1,
                              }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                            >
                              <Image
                                src={normalizeImageUrl(shapeItem.imageUrl)}
                                alt={shapeItem.shape}
                                fill
                                className="object-contain p-4"
                                sizes="(max-width: 768px) 300px, 350px"
                              />
                            </motion.div>

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Hover Button */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{
                                opacity: hoveredId === shapeItem.shape ? 1 : 0,
                                y: hoveredId === shapeItem.shape ? 0 : 20,
                              }}
                              transition={{ duration: 0.3 }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <button className="bg-white text-slate-900 px-6 py-3 rounded-full flex items-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold">
                                <span><TranslatableText text="Explore" /> {shapeItem.shape}</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </motion.div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">
                              {shapeItem.shape}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-brand-h3 font-headline mb-1 text-slate-900">
                        <TranslatableText text={shapeItem.shape} />
                      </h3>
                      <p className="text-sm text-slate-600">
                        <TranslatableText text={description} />
                      </p>

                      {/* Bottom Border Animation */}
                      <motion.div
                        className="h-1 bg-gradient-to-r from-teal-primary to-[#4DCECA] rounded-full mt-3"
                        initial={{ scaleX: 0 }}
                        animate={{
                          scaleX: hoveredId === shapeItem.shape ? 1 : 0,
                        }}
                        transition={{ duration: 0.3 }}
                        style={{ transformOrigin: "left" }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}

