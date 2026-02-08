"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getAvailableFrameColors, type AvailableColor } from "@/app/actions/getAvailableColors";
import { getAvailableGlassShapes, type AvailableGlassShape } from "@/app/actions/getAvailableGlassShapes";
import { normalizeImageUrl } from "@/lib/normalize-image-url";
import { getAvailableBrands, type AvailableBrand } from "@/app/actions/getAvailableBrands";
import TranslatableText from "@/components/ui/TranslatableText";

interface ShopMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  isScrolled?: boolean;
  type: 'sunglasses' | 'eyeglasses';
  initialColors?: AvailableColor[];
  initialShapes?: AvailableGlassShape[];
  initialBrands?: AvailableBrand[];
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

// Map shape names to icons
function getShapeIcon(shapeName: string): string {
  const normalized = shapeName.toLowerCase().trim();
  const iconMap: Record<string, string> = {
    "cat eye": "cat-eye",
    "cat-eye": "cat-eye",
    "rectangle": "rectangle",
    "square": "square",
    "butterfly": "butterfly",
    "round": "round",
    "geometric": "geometric",
    "aviator": "aviator",
    "browline": "browline",
    "oval": "oval",
    "oval-shape": "oval",
    "oval shape": "oval",
  };
  return iconMap[normalized] || "round"; // Default to round if not found
}

export default function ShopMegaMenu(props: ShopMegaMenuProps) {
  const { isOpen, onClose, className, type, isScrolled = false, initialColors, initialShapes, initialBrands, onMouseEnter, onMouseLeave } = props;
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef(false);
  const [availableShapes, setAvailableShapes] = useState<AvailableGlassShape[]>(initialShapes || []);
  const [isLoadingShapes, setIsLoadingShapes] = useState(!initialShapes);
  const [availableColors, setAvailableColors] = useState<AvailableColor[]>(initialColors || []);
  const [isLoadingColors, setIsLoadingColors] = useState(!initialColors);
  const [availableBrands, setAvailableBrands] = useState<AvailableBrand[]>(initialBrands || []);
  const [isLoadingBrands, setIsLoadingBrands] = useState(!initialBrands);

  const baseUrl = type === 'eyeglasses' ? '/shop/prescription-glasses' : '/shop';
  const title = type === 'eyeglasses' ? 'Eyeglasses' : 'Sunglasses';

  // Navigation handler - set flag to prevent mouseLeave from interfering
  const handleNavigate = useCallback((href: string) => {
    isNavigatingRef.current = true;
    router.push(href);
  }, [router]);

  useEffect(() => {
    if (initialColors) {
      setAvailableColors(initialColors);
      setIsLoadingColors(false);
    }
  }, [initialColors]);

  useEffect(() => {
    if (initialShapes) {
      setAvailableShapes(initialShapes);
      setIsLoadingShapes(false);
    }
  }, [initialShapes]);

  useEffect(() => {
    if (initialBrands) {
      setAvailableBrands(initialBrands);
      setIsLoadingBrands(false);
    }
  }, [initialBrands]);

  useEffect(function fetchColors() {
    if (initialColors) return;

    if (isOpen && availableColors.length === 0) {
      setIsLoadingColors(true);
      getAvailableFrameColors(type)
        .then(function (colors) {
          setAvailableColors(colors);
          setIsLoadingColors(false);
        })
        .catch(function (error) {
          console.error("Error fetching available colors:", error);
          setIsLoadingColors(false);
        });
    }
  }, [isOpen, availableColors.length, type, initialColors]);

  useEffect(function fetchShapes() {
    if (initialShapes) return;

    if (isOpen && availableShapes.length === 0) {
      setIsLoadingShapes(true);
      getAvailableGlassShapes(type)
        .then(function (shapes) {
          setAvailableShapes(shapes);
          setIsLoadingShapes(false);
        })
        .catch(function (error) {
          console.error("Error fetching available shapes:", error);
          setIsLoadingShapes(false);
        });
    }
  }, [isOpen, availableShapes.length, type, initialShapes]);

  useEffect(function fetchBrands() {
    if (initialBrands) return;

    if (isOpen && availableBrands.length === 0) {
      setIsLoadingBrands(true);
      getAvailableBrands(type)
        .then(function (brands) {
          setAvailableBrands(brands);
          setIsLoadingBrands(false);
        })
        .catch(function (error) {
          console.error("Error fetching available brands:", error);
          setIsLoadingBrands(false);
        });
    }
  }, [isOpen, availableBrands.length, type, initialBrands]);

  function handleMouseLeave() {
    // Don't trigger close if we're navigating
    if (isNavigatingRef.current) {
      return;
    }
    if (onMouseLeave) {
      onMouseLeave();
    }
  }

  function handleMouseEnter() {
    // Reset navigating flag when mouse enters
    isNavigatingRef.current = false;
    if (onMouseEnter) {
      onMouseEnter();
    }
  }

  useEffect(function cleanup() {
    return function () {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Note: We don't prevent body scroll for hover menus as they don't need it
  // and it causes layout shift issues with the scrollbar compensation

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="absolute left-0 top-full mt-2 sm:mt-4 z-[110] w-full flex justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={menuRef}
        className={cn(
          "w-full bg-white shadow-2xl rounded-lg border border-gray-200",
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8",
          "max-h-[80vh] overflow-y-auto",
          "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
          className
        )}
      >
        <div className="space-y-4">
          <h3 className="text-brand-h3 font-headline text-black mb-3 sm:mb-4"><TranslatableText text={title} /></h3>
          <div className="space-y-2 sm:space-y-3">
            <Link href={baseUrl} className="block text-black hover:text-primary transition-colors text-xs sm:text-sm cursor-pointer">
              <TranslatableText text={`All ${title}`} />
            </Link>
            <Link href={`${baseUrl}/women`} className="block text-black hover:text-primary transition-colors text-xs sm:text-sm cursor-pointer">
              <TranslatableText text={`Women's ${title}`} />
            </Link>
            <Link href={`${baseUrl}/men`} className="block text-black hover:text-primary transition-colors text-xs sm:text-sm cursor-pointer">
              <TranslatableText text={`Men's ${title}`} />
            </Link>
            <Link href={`${baseUrl}/kids`} className="block text-black hover:text-primary transition-colors text-xs sm:text-sm cursor-pointer">
              <TranslatableText text={`Kids ${type === 'eyeglasses' ? 'Eyeglasses' : 'Sunglasses'}`} />
            </Link>
            <Link href={`${baseUrl}/unisex`} className="block text-black hover:text-primary transition-colors text-xs sm:text-sm cursor-pointer">
              <TranslatableText text={`Unisex ${title}`} />
            </Link>
            <Link href={`${baseUrl}?filter=bestsellers`} className="block text-black hover:text-primary transition-colors text-xs sm:text-sm cursor-pointer">
              <TranslatableText text="Best Sellers" />
            </Link>
            <Link href={`${baseUrl}/new-arrivals`} className="block text-black hover:text-primary transition-colors text-xs sm:text-sm cursor-pointer">
              <TranslatableText text="New Arrivals" />
            </Link>
          </div>
        </div>


        <div className="space-y-4">
          <h3 className="text-brand-h3 font-headline text-black mb-3 sm:mb-4"><TranslatableText text="Shop by Brand" /></h3>
          {isLoadingBrands ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(function (i) {
                return <div key={i} className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />;
              })}
            </div>
          ) : availableBrands.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-500"><TranslatableText text="No brands available" /></p>
          ) : (
            <div className="space-y-2">
              {availableBrands.map(function (brandData, index) {
                return (
                  <Link
                    key={brandData.brand + "-" + index}
                    href={`${baseUrl}?filter=${encodeURIComponent(brandData.brand)}`} // Using 'filter' as generic search/filter param or maybe just 'search' logic handles it if I add brand to search/filter logic
                    className="block text-black hover:text-primary transition-colors text-xs sm:text-sm cursor-pointer"
                  >
                    <TranslatableText text={brandData.brand} />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <h3 className="text-brand-h3 font-headline text-black mb-3 sm:mb-4"><TranslatableText text="Shop by Frame Color" /></h3>
          {isLoadingColors ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-3 gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5, 6].map(function (i) {
                return <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gray-300 bg-gray-200 animate-pulse" />;
              })}
            </div>
          ) : availableColors.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-500"><TranslatableText text="No colors available" /></p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-3 gap-2 sm:gap-3">
              {availableColors.map(function (color, index) {
                const colorHex = color.colorHex.startsWith("#") ? color.colorHex : "#" + color.colorHex;
                const isWhite = colorHex.toLowerCase() === "#ffffff" || colorHex.toLowerCase() === "#fff";
                return (
                  <Link
                    key={color.colorHex + "-" + index}
                    href={`${baseUrl}?color=${encodeURIComponent(colorHex)}`}
                    className="group relative flex justify-center cursor-pointer"
                    title={color.colorName}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all hover:scale-110 hover:border-primary",
                        isWhite ? "bg-white border-gray-400" : "border-gray-300"
                      )}
                      style={{ backgroundColor: colorHex }}
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </div>


        <div className="space-y-4">
          <h3 className="text-brand-h3 font-headline text-black mb-3 sm:mb-4"><TranslatableText text="Shop by Shape" /></h3>
          {isLoadingShapes ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5, 6].map(function (i) {
                return <div key={i} className="h-16 sm:h-20 bg-gray-200 rounded-lg animate-pulse" />;
              })}
            </div>
          ) : availableShapes.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-500"><TranslatableText text="No shapes available" /></p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2 sm:gap-3">
              {availableShapes.map(function (shapeData, index) {
                const shapeIcon = getShapeIcon(shapeData.shape);
                const hasImage = shapeData.imageUrl && shapeData.imageUrl.trim() !== '';

                return (
                  <Link
                    key={shapeData.shape + "-" + index}
                    href={`${baseUrl}?glassShape=${encodeURIComponent(shapeData.shape.toLowerCase().replace(/\s+/g, "-"))}`}
                    className="group flex flex-col items-center p-2 sm:p-3 bg-[#F5F5DC] rounded-lg hover:bg-[#E8E8D0] transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-6 sm:w-12 sm:h-8 mb-1 sm:mb-2 flex items-center justify-center relative">
                      {hasImage ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={normalizeImageUrl(shapeData.imageUrl!)}
                            alt={shapeData.shape}
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 40px, 48px"
                          />
                        </div>
                      ) : (
                        // Fallback to SVG icons if no image
                        <>
                          {shapeIcon === "cat-eye" && (
                            <svg viewBox="0 0 24 16" className="w-full h-full">
                              <path d="M2 8 Q6 2, 12 8 Q18 14, 22 8" stroke="black" strokeWidth="1.5" fill="none" />
                              <path d="M6 8 L12 4 L18 8" stroke="black" strokeWidth="1.5" fill="none" />
                            </svg>
                          )}
                          {shapeIcon === "rectangle" && (
                            <svg viewBox="0 0 24 16" className="w-full h-full">
                              <rect x="4" y="4" width="16" height="8" stroke="black" strokeWidth="1.5" fill="none" />
                            </svg>
                          )}
                          {shapeIcon === "square" && (
                            <svg viewBox="0 0 24 16" className="w-full h-full">
                              <rect x="6" y="2" width="12" height="12" stroke="black" strokeWidth="1.5" fill="none" />
                            </svg>
                          )}
                          {shapeIcon === "butterfly" && (
                            <svg viewBox="0 0 24 16" className="w-full h-full">
                              <path d="M2 8 Q8 2, 12 8 Q16 14, 22 8" stroke="black" strokeWidth="1.5" fill="none" />
                              <path d="M8 6 Q12 8, 16 6" stroke="black" strokeWidth="1.5" fill="none" />
                            </svg>
                          )}
                          {shapeIcon === "round" && (
                            <svg viewBox="0 0 24 16" className="w-full h-full">
                              <circle cx="12" cy="8" r="6" stroke="black" strokeWidth="1.5" fill="none" />
                            </svg>
                          )}
                          {shapeIcon === "geometric" && (
                            <svg viewBox="0 0 24 16" className="w-full h-full">
                              <polygon points="12,2 20,6 20,14 12,18 4,14 4,6" stroke="black" strokeWidth="1.5" fill="none" />
                            </svg>
                          )}
                          {shapeIcon === "aviator" && (
                            <svg viewBox="0 0 24 16" className="w-full h-full">
                              <ellipse cx="8" cy="8" rx="6" ry="4" stroke="black" strokeWidth="1.5" fill="none" />
                              <ellipse cx="16" cy="8" rx="6" ry="4" stroke="black" strokeWidth="1.5" fill="none" />
                              <line x1="14" y1="8" x2="10" y2="8" stroke="black" strokeWidth="1.5" />
                            </svg>
                          )}
                          {shapeIcon === "browline" && (
                            <svg viewBox="0 0 24 16" className="w-full h-full">
                              <path d="M4 6 L8 4 L12 6 L16 4 L20 6" stroke="black" strokeWidth="2" fill="none" />
                              <path d="M4 10 L8 12 L12 10 L16 12 L20 10" stroke="black" strokeWidth="1.5" fill="none" />
                            </svg>
                          )}
                          {shapeIcon === "oval" && (
                            <svg viewBox="0 0 24 16" className="w-full h-full">
                              <ellipse cx="12" cy="8" rx="8" ry="5" stroke="black" strokeWidth="1.5" fill="none" />
                            </svg>
                          )}
                        </>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs text-black text-center leading-tight"><TranslatableText text={shapeData.shape} /></span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
