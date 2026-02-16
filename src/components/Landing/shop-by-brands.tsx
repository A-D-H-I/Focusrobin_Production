"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { normalizeImageUrl } from "@/lib/normalize-image-url";
import TranslatableText from "@/components/ui/TranslatableText";

interface BrandItem {
    name: string;
    imageUrl: string | null;
    landingImageUrl: string | null;
}

interface ShopByBrandsProps {
    brands: BrandItem[];
}

export default function ShopByBrands({ brands }: ShopByBrandsProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    // Only show brands that have a landing image
    const brandsWithImages = brands.filter(
        (b) => b.landingImageUrl && b.landingImageUrl.trim() !== ""
    );

    if (brandsWithImages.length === 0) return null;

    const scrollContainer = (direction: "left" | "right") => {
        const container = document.getElementById("brands-container");
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
                        <TranslatableText text="Shop By Brand" />
                    </h2>

                    <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
                        <TranslatableText text="Explore our curated collection of premium eyewear brands" />
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
                        id="brands-container"
                        className="flex gap-6 overflow-x-auto scrollbar-hide px-2 md:px-12 py-4"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                        {brandsWithImages.map((brand, index) => {
                            return (
                                <motion.div
                                    key={brand.name}
                                    initial={{ opacity: 0, x: 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    onHoverStart={() => setHoveredId(brand.name)}
                                    onHoverEnd={() => setHoveredId(null)}
                                    className="group relative flex-shrink-0 w-[300px] md:w-[350px] h-full"
                                >
                                    <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 h-full flex flex-col">
                                        {/* Image Container */}
                                        <Link
                                            href={`/shop?brand=${encodeURIComponent(brand.name)}`}
                                        >
                                            <div className="relative h-64 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                                                <motion.div
                                                    className="relative w-full h-full overflow-hidden flex items-center justify-center bg-slate-50"
                                                    animate={{
                                                        scale: 1,
                                                    }}
                                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                                >
                                                    <Image
                                                        src={normalizeImageUrl(brand.landingImageUrl!)}
                                                        alt={brand.name}
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
                                                        opacity: hoveredId === brand.name ? 1 : 0,
                                                        y: hoveredId === brand.name ? 0 : 20,
                                                    }}
                                                    transition={{ duration: 0.3 }}
                                                    className="absolute inset-0 flex items-center justify-center"
                                                >
                                                    <button className="bg-white text-slate-900 px-6 py-3 rounded-full flex items-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold">
                                                        <span><TranslatableText text="Shop" /> {brand.name}</span>
                                                        <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                </motion.div>
                                            </div>
                                        </Link>

                                        {/* Content */}
                                        <div className="p-5">
                                            <h3 className="text-brand-h3 font-headline mb-1 text-slate-900">
                                                <TranslatableText text={brand.name} />
                                            </h3>

                                            {/* Bottom Border Animation */}
                                            <motion.div
                                                className="h-1 bg-gradient-to-r from-teal-primary to-[#4DCECA] rounded-full mt-3"
                                                initial={{ scaleX: 0 }}
                                                animate={{
                                                    scaleX: hoveredId === brand.name ? 1 : 0,
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
