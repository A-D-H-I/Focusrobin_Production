"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/lib/productData";
import { Button } from "@/components/ui/button";

interface BestsellersCarouselProps {
  products: Product[];
}

export default function BestsellersCarousel({ products }: BestsellersCarouselProps) {
  // Use provided products or fallback to empty array
  const displayProducts = products && products.length > 0 ? products : [];
  
  // If no products, show empty state
  if (displayProducts.length === 0) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold font-headline mb-4">BEST SELLERS</h2>
          <p className="text-muted-foreground">No products available at the moment.</p>
        </div>
      </section>
    );
  }
  
  // 2. Start in the middle
  const midIndex = Math.floor(displayProducts.length / 2);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "center",
      containScroll: false,
      startIndex: midIndex,
    },
    []
  );

  const [selectedIndex, setSelectedIndex] = useState(midIndex);
  // Track selected color variant for each product
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({});

  const [slideStyles, setSlideStyles] = useState<Record<
    number,
    { scale: number; opacity: number; zIndex: number; filter: string }
  >>({});

  // Refs for inner card (for tilt/perspective) and image (for parallax)
  const cardInnerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const imgRefs = useRef<Array<HTMLDivElement | null>>([]);

  // --- Tilt & Parallax Handlers (Medium 3D: Option 2) ---
  const handleMouseMove = useCallback((index: number, e: React.MouseEvent) => {
    const card = cardInnerRefs.current[index];
    const imgWrap = imgRefs.current[index];
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cx = rect.width / 2;
    const cy = rect.height / 2;

    // Medium strength values
    const maxRotate = 8; // degrees
    const rotateY = ((x - cx) / cx) * maxRotate; // left/right
    const rotateX = ((cy - y) / cy) * (maxRotate * 0.6); // up/down

    // Smooth transform on the inner card (so outer scale stays intact)
    card.style.transition = "transform 120ms linear";
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(6px)`;

    // Parallax image (small opposite movement, subtle)
    if (imgWrap) {
      imgWrap.style.transition = "transform 120ms linear";
      const parallaxX = -rotateY * 0.8; // inverse to rotation for depth
      const parallaxY = rotateX * 0.6;
      imgWrap.style.transform = `translate3d(${parallaxX}px, ${parallaxY}px, 0)`;
    }
  }, []);

  const handleMouseLeave = useCallback((index: number) => {
    const card = cardInnerRefs.current[index];
    const imgWrap = imgRefs.current[index];
    if (!card) return;
    // reset transforms
    card.style.transition = "transform 300ms cubic-bezier(.2,.8,.2,1)";
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)`;
    if (imgWrap) {
      imgWrap.style.transition = "transform 300ms cubic-bezier(.2,.8,.2,1)";
      imgWrap.style.transform = "translate3d(0,0,0)";
    }
  }, []);

  // --- Embla scroll logic (unchanged, just using the existing idea) ---
  const onScroll = useCallback(() => {
    if (!emblaApi) return;

    const engine = emblaApi.internalEngine();
    const scrollProgress = emblaApi.scrollProgress();

    const styles: Record<number, { scale: number; opacity: number; zIndex: number; filter: string }> =
      {};

    emblaApi.scrollSnapList().forEach((scrollSnap, index) => {
      let diffToTarget = scrollSnap - scrollProgress;

      if (engine.options.loop) {
        engine.slideLooper.loopPoints.forEach((loopItem) => {
          const target = loopItem.target();
          if (index === loopItem.index && target !== 0) {
            const sign = Math.sign(target);
            if (sign === -1) diffToTarget = scrollSnap - (1 + scrollProgress);
            if (sign === 1) diffToTarget = scrollSnap + (1 - scrollProgress);
          }
        });
      }

      // 3. FIX: Widen the "Clear Zone"
      const tweenValue = 1 - Math.abs(diffToTarget * 2);
      const scale = Math.max(0.6, Math.min(1.2, 0.6 + tweenValue * 0.6));
      const opacity = Math.max(0.4, Math.min(1, 0.4 + tweenValue * 0.6));

      // New Blur Logic: Multiplier (1.2) makes it reach 0 blur SOONER (at 83% centered)
      // This prevents the blurry look when it's "almost" centered
      const blur = Math.max(0, (1 - tweenValue * 1.2) * 6);

      styles[index] = {
        scale,
        opacity,
        zIndex: Math.round(scale * 100),
        filter: `blur(${blur}px)`,
      };
    });

    setSlideStyles(styles);
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onScroll();
    emblaApi.on("scroll", onScroll);
    emblaApi.on("select", onScroll);
    emblaApi.on("reInit", onScroll);

    return () => {
      emblaApi.off("scroll", onScroll);
      emblaApi.off("select", onScroll);
      emblaApi.off("reInit", onScroll);
    };
  }, [emblaApi, onScroll]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section className="bg-brand-white py-8 relative w-full overflow-hidden">
      <div className="text-center mb-6 px-4">
        <h2 className="text-brand-blue font-headline text-4xl sm:text-5xl font-bold mb-2">
          BEST SELLERS
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Take your pick from our selection of the hottest styles of the season.
        </p>
      </div>

      <div className="relative w-full max-w-[1800px] mx-auto overflow-hidden">
        <button
          onClick={scrollPrev}
          className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white rounded-full p-3 shadow-xl transition-all border border-border/10 hover:scale-110"
          aria-label="Previous product"
        >
          <ChevronLeft className="h-6 w-6 text-brand-blue" />
        </button>

        <button
          onClick={scrollNext}
          className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white rounded-full p-3 shadow-xl transition-all border border-border/10 hover:scale-110"
          aria-label="Next product"
        >
          <ChevronRight className="h-6 w-6 text-brand-blue" />
        </button>

        <div className="w-full overflow-visible" ref={emblaRef}>
          <div className="flex touch-pan-y touch-pinch-zoom">
            {displayProducts.map((product, index) => {
              const isActive = selectedIndex === index;

              // Force default styles if not calculated yet
              const style =
                slideStyles[index] ||
                (index === midIndex
                  ? { scale: 1.2, opacity: 1, zIndex: 20, filter: "none" }
                  : { scale: 0.6, opacity: 0.4, zIndex: 10, filter: "blur(2px)" });

              const currentFilter = isActive ? "none" : style.filter;

              // Get selected variant index for this product (default to 0)
              const selectedVariantIndex = selectedVariants[product.id] ?? 0;
              const selectedVariant = product.variants && product.variants.length > 0
                ? (product.variants[selectedVariantIndex] || product.variants[0])
                : null;
              
              // Get image for bestseller - prefer NO_BG (transparent background) for 3D effect, fallback to thumbnail
              let mainImage = "";
              if (selectedVariant) {
                // Try NO_BG first, then thumbnail, then first gallery image
                mainImage = selectedVariant.nobg 
                  || selectedVariant.thumbnail 
                  || (selectedVariant.images && selectedVariant.images.length > 0 ? selectedVariant.images[0] : "")
                  || "";
              }
              const visibleVariants = product.variants && product.variants.length > 0 
                ? product.variants.slice(0, 4) 
                : [];
              const remainingCount = product.variants && product.variants.length > 4 
                ? product.variants.length - 4 
                : 0;

              // Handle color variant selection
              const handleVariantSelect = (variantIndex: number) => {
                setSelectedVariants((prev) => ({
                  ...prev,
                  [product.id]: variantIndex,
                }));
              };

              // ensure refs array slots exist
              if (!cardInnerRefs.current[index]) cardInnerRefs.current[index] = null;
              if (!imgRefs.current[index]) imgRefs.current[index] = null;

              return (
                <div
                  key={product.id}
                  className="flex-[0_0_75%] md:flex-[0_0_38%] lg:flex-[0_0_32%] min-w-0 relative px-2 md:px-3"
                  style={{
                    transform: `translate3d(0, 0, 0) scale(${style.scale})`,
                    opacity: style.opacity,
                    zIndex: style.zIndex,
                    filter: currentFilter,
                    transition: "none",
                    position: "relative",
                    willChange: "transform, opacity, filter",
                    backfaceVisibility: "hidden",
                  }}
                >
                  <div className="bg-transparent py-2 relative" style={{ zIndex: style.zIndex }}>
                    <motion.div
                      // This is the visual container that will float (y oscillation) for the active slide
                      className="aspect-[16/9] relative bg-transparent mb-1"
                      animate={isActive ? { y: [0, -20, 0] } : { y: 0 }}
                      transition={isActive ? { duration: 6, repeat: Infinity, ease: "easeInOut" } : {}}
                    >
                      {/* Inner card handles perspective & tilt, image wrapper handles parallax */}
                      <Link
                        href={`/products/${product.id}`}
                        prefetch={true}
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                          willChange: "transform",
                          borderRadius: 12,
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        <div
                          ref={(el) => {
                            cardInnerRefs.current[index] = el;
                          }}
                          onMouseMove={(e) => {
                            // Only center/active slide should tilt
                            if (!isActive) return;
                            handleMouseMove(index, e);
                          }}
                          onMouseLeave={() => {
                            if (!isActive) return;
                            handleMouseLeave(index);
                          }}
                          className="absolute inset-0 flex items-center justify-center"
                          style={{
                            willChange: "transform",
                            borderRadius: 12,
                            padding: 0,
                            // keep pointer events for inner interactions but don't block Link clicks
                            pointerEvents: "auto",
                          }}
                        >
                          <div
                            ref={(el) => {
                              imgRefs.current[index] = el;
                            }}
                            className="relative w-full h-full flex items-center justify-center"
                            style={{
                              willChange: "transform",
                              overflow: "visible",
                              transform: "scale(1.15)",
                            }}
                          >
                            {mainImage ? (
                              <Image
                                key={`${product.id}-${selectedVariantIndex}-${mainImage}`}
                                src={mainImage}
                                alt={`${product.name} - ${selectedVariant?.name || ""}`}
                                fill
                                priority={index === midIndex}
                                className="object-contain drop-shadow-2xl transition-transform duration-200"
                                sizes="(max-width: 768px) 85vw, 50vw"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted rounded-lg">
                                <span className="text-sm">No image available</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>

                    <div className="text-center relative z-40 drop-shadow-lg pt-0">
                      <h3 className="text-xl font-bold text-brand-blue mb-3 tracking-tight drop-shadow-md">
                        {product.name}
                      </h3>

                             <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
                               <p className="text-lg font-medium text-brand-blue/80 drop-shadow-md">
                                 {product.price}
                               </p>
                               {product.originalPrice && product.originalPrice !== product.price && (
                                 <>
                                   <p className="text-sm text-muted-foreground line-through drop-shadow-md">
                                     {product.originalPrice}
                                   </p>
                                   {product.discountPct && (
                                     <span className="text-xs font-semibold text-destructive bg-white/90 px-2 py-0.5 rounded drop-shadow-md">
                                       -{product.discountPct}%
                                     </span>
                                   )}
                                 </>
                               )}
                             </div>

                      {product.variants && product.variants.length > 1 && (
                        <div className="flex items-center justify-center gap-4 mb-8 flex-wrap relative z-40">
                          {visibleVariants.map((variant, variantIndex) => (
                            <button
                              key={variant.hex}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleVariantSelect(variantIndex);
                              }}
                              className={`h-6 w-6 rounded-full border-2 transition-all relative z-40 ${
                                selectedVariantIndex === variantIndex
                                  ? "border-brand-blue ring-2 ring-brand-blue ring-offset-2 scale-125"
                                  : "border-white/50 ring-1 ring-border/20 hover:scale-110"
                              } shadow-sm cursor-pointer`}
                              style={{ backgroundColor: variant.hex }}
                              title={variant.name}
                              aria-label={`Select color: ${variant.name}`}
                            />
                          ))}
                          {remainingCount > 0 && (
                            <span className="text-xs text-muted-foreground font-medium">
                              +{remainingCount}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="h-16 flex items-center justify-center relative z-50 mt-4">
                        <AnimatePresence mode="wait">
                          {isActive && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              transition={{ duration: 0.2 }}
                              className="relative z-50"
                            >
                              <Link href={`/products/${product.id}`} prefetch={true} className="relative z-50">
                                <Button
                                  className="px-8 py-6 text-base font-bold bg-brand-teal text-white hover:bg-brand-teal/90 shadow-lg rounded-full uppercase tracking-wide hover:scale-105 transition-transform relative z-50"
                                >
                                  Shop Now
                                </Button>
                              </Link>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center items-center gap-3 mt-10 mb-4">
          {displayProducts.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`transition-all duration-300 rounded-full ${
                index === selectedIndex
                  ? "w-8 h-1.5 bg-brand-blue"
                  : "w-2 h-2 bg-brand-blue/20 hover:bg-brand-blue/40"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
