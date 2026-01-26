"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/lib/productData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePrice } from "@/hooks/usePrice";
import TranslatableText from "@/components/ui/TranslatableText";

interface BestsellersCarouselProps {
  products: Product[];
}

export default function BestsellersCarousel({ products }: BestsellersCarouselProps) {
  const { formatPrice, parseEurPrice } = usePrice();
  
  // Use provided products or fallback to empty array
  const displayProducts = products && products.length > 0 ? products : [];
  
  // If no products, show empty state
  if (displayProducts.length === 0) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-brand-h2 font-headline mb-4"><TranslatableText text="Unique Designs" /></h2>
          <p className="text-muted-foreground"><TranslatableText text="No products available at the moment." /></p>
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
      skipSnaps: false,
      dragFree: false,
      duration: 15, // Reduced from 25 to make movement faster
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
    card.style.transition = "transform 80ms linear"; // Reduced from 120ms for faster movement
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(6px)`;

    // Parallax image (small opposite movement, subtle)
    if (imgWrap) {
      imgWrap.style.transition = "transform 80ms linear"; // Reduced from 120ms for faster movement
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
    card.style.transition = "transform 200ms cubic-bezier(.2,.8,.2,1)"; // Reduced from 300ms for faster movement
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)`;
    if (imgWrap) {
      imgWrap.style.transition = "transform 200ms cubic-bezier(.2,.8,.2,1)"; // Reduced from 300ms for faster movement
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
      // Reduced max blur from 6px to 2px for a subtler effect
      const blur = Math.max(0, (1 - tweenValue * 1.2) * 2);

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
    <section className="bg-brand-white py-8 sm:py-12 relative w-full overflow-hidden">
      <div className="text-center mb-6 sm:mb-8 px-4">
        <h2 className="text-brand-blue font-headline text-brand-h2 mb-2">
          <TranslatableText text="Unique Designs" />
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base mb-2">
          <TranslatableText text="Discover our exclusive collection of distinctive and one-of-a-kind eyewear designs." />
        </p>
        <p className="text-muted-foreground text-sm sm:text-base">
          <TranslatableText text="Minimalist sunglasses designed in Lithuania for everyday comfort." />
        </p>
      </div>

      <div className="relative w-full max-w-[1800px] mx-auto overflow-visible px-0 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        <button
          onClick={scrollPrev}
          className="absolute left-1 sm:left-2 md:left-4 top-[45%] -translate-y-1/2 z-40 bg-white/95 hover:bg-white rounded-full p-2 md:p-3 shadow-xl transition-all border border-border/20 hover:scale-110"
          aria-label="Previous product"
        >
          <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-brand-blue" />
        </button>

        <button
          onClick={scrollNext}
          className="absolute right-1 sm:right-2 md:right-4 top-[45%] -translate-y-1/2 z-40 bg-white/95 hover:bg-white rounded-full p-2 md:p-3 shadow-xl transition-all border border-border/20 hover:scale-110"
          aria-label="Next product"
        >
          <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-brand-blue" />
        </button>

        <div className="w-full overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y touch-pinch-zoom pb-4" style={{ overflow: 'visible' }}>
            {displayProducts.map((product, index) => {
              const isActive = selectedIndex === index;

              // Force default styles if not calculated yet
              // Use better scale values for mobile/tablet visibility
              const style =
                slideStyles[index] ||
                (index === midIndex
                  ? { scale: 1.0, opacity: 1, zIndex: 20, filter: "none" }
                  : { scale: 0.7, opacity: 0.5, zIndex: 10, filter: "blur(0.5px)" });

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
                  className="flex-[0_0_100%] sm:flex-[0_0_75%] md:flex-[0_0_38%] lg:flex-[0_0_32%] min-w-0 relative px-4 sm:px-4 md:px-5 pb-8 flex-shrink-0"
                  style={{
                    transform: `translate3d(0, 0, 0) scale(${style.scale})`,
                    opacity: style.opacity,
                    zIndex: style.zIndex,
                    filter: currentFilter,
                    transition: "none",
                    position: "relative",
                    willChange: "transform, opacity, filter",
                    backfaceVisibility: "hidden",
                    overflow: "visible",
                  }}
                >
                  <div className="bg-transparent py-2 sm:py-4 relative flex flex-col items-center" style={{ zIndex: style.zIndex, overflow: 'visible' }}>
                    <motion.div
                      // This is the visual container that will float (y oscillation) for the active slide
                      className="aspect-[3/2] sm:aspect-[3/2] md:aspect-[16/9] relative bg-transparent mb-1 sm:mb-2 h-[200px] sm:h-[240px] md:h-auto w-full max-w-full"
                      animate={isActive ? { y: [0, -20, 0] } : { y: 0 }}
                      transition={isActive ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : {}} // Reduced from 6s to 3s for faster jumping
                      style={{ overflow: 'visible', position: 'relative' }}
                    >
                      {/* Inner card handles perspective & tilt, image wrapper handles parallax */}
                      <Link
                        href={`/shop/${encodeURIComponent(product.slug || product.id)}`}
                        prefetch={true}
                        className="absolute inset-0 flex items-center justify-center overflow-visible"
                        style={{
                          willChange: "transform",
                          borderRadius: 12,
                          padding: 0,
                          cursor: "pointer",
                          overflow: "visible",
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
                          className="absolute inset-0 flex items-center justify-center overflow-visible"
                          style={{
                            willChange: "transform",
                            borderRadius: 12,
                            padding: 0,
                            overflow: "visible",
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
                              transform: "scale(0.8)",
                              width: "100%",
                              height: "100%",
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
                                sizes="(max-width: 640px) 80vw, (max-width: 768px) 70vw, 40vw"
                                unoptimized
                                style={{ 
                                  objectFit: 'contain',
                                  width: '100%',
                                  height: '100%',
                                  maxWidth: '100%',
                                  maxHeight: '100%'
                                }}
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

                    <div className="text-center relative z-40 drop-shadow-lg pt-0 pb-4">
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-brand-h3 font-headline text-brand-blue mb-2 sm:mb-3 tracking-tight drop-shadow-md line-clamp-2 break-words overflow-hidden px-2 sm:px-4">
                        {product.name}
                      </h3>

                             <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6 flex-wrap px-2 sm:px-4">
                               <p className="text-lg font-medium text-brand-blue/80 drop-shadow-md">
                                 {formatPrice(parseEurPrice(product.price))}
                               </p>
                               {product.originalPrice && product.originalPrice !== product.price && (
                                 <>
                                   <p className="text-sm text-muted-foreground line-through drop-shadow-md">
                                     {formatPrice(parseEurPrice(product.originalPrice))}
                                   </p>
                                   {product.discountPct && (
                                     <span className="text-xs font-semibold text-destructive bg-white/90 px-2 py-0.5 rounded drop-shadow-md">
                                       -{product.discountPct}%
                                     </span>
                                   )}
                                 </>
                               )}
                             </div>

                      {product.cashback && parseEurPrice(product.cashback) > 0 && (
                        <div className="flex justify-center mb-3 sm:mb-4 relative z-40 px-2 sm:px-4">
                          <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200">
                            🎁 {formatPrice(parseEurPrice(product.cashback))} <TranslatableText text="cashback" />
                          </Badge>
                        </div>
                      )}

                      {product.variants && product.variants.length > 1 && (
                        <div className="flex items-center justify-center gap-4 mb-4 sm:mb-6 flex-wrap relative z-40 px-2 sm:px-4">
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

                      <div className="min-h-[64px] sm:min-h-[72px] flex items-center justify-center relative z-50 mt-2 sm:mt-4 pointer-events-auto px-2 sm:px-4">
                        <AnimatePresence mode="wait">
                          {isActive && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              transition={{ duration: 0.2 }}
                              className="relative z-50 pointer-events-auto"
                            >
                              <Link 
                                href={`/shop/${encodeURIComponent(product.slug || product.id)}`} 
                                prefetch={true} 
                                className="relative z-50 pointer-events-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <Button
                                  className="px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-base font-bold bg-brand-teal text-white hover:bg-brand-teal/90 shadow-lg rounded-full uppercase tracking-wide hover:scale-105 transition-transform relative z-50 pointer-events-auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  <TranslatableText text="Shop Now" />
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
